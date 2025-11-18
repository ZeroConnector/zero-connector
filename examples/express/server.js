import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import ZeroConnector from '../../src/index.js';
import { createZeroX402Client, checkUsdcBalance } from '../../src/client/x402.js'; // Import new client
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Zero Connector with JSON storage
const connector = new ZeroConnector({
  storagePath: './data/wallets.json',
  network: 'mainnet-beta' // Change to 'devnet' for testing
});

const app = express();
const PORT = process.env.PORT || 3001;
// Initialize Solana Connection for the proxy
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth middleware
const requireAuth = (req, res, next) => {
  const sessionToken = req.cookies.session;
  const session = connector.verifySession(sessionToken);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.session = session;
  req.user = { publicKey: session.publicKey };
  next();
};

// Routes

/**
 * POST /api/wallet/create
 * Create a new wallet
 */
app.post('/api/wallet/create', async (req, res) => {
  try {
    const result = await connector.createWallet(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * POST /api/wallet/authenticate
 * Authenticate with existing wallet
 */
app.post('/api/wallet/authenticate', async (req, res) => {
  try {
    const result = await connector.authenticate(req.body);
    
    if (result.success && result.sessionToken) {
      // Set session cookie
      res.cookie('session', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Don't send session token in response
      delete result.sessionToken;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * GET /api/wallet/balance
 * Get wallet balance (requires auth)
 */
app.get('/api/wallet/balance', requireAuth, async (req, res) => {
  try {
    const result = await connector.getBalance(req.user.publicKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * POST /api/wallet/balance/refresh
 * Refresh balance from blockchain (requires auth)
 */
app.post('/api/wallet/balance/refresh', requireAuth, async (req, res) => {
  try {
    // 1. Refresh SOL balance (existing)
    const result = await connector.refreshBalance(req.user.publicKey);
    
    // 2. Refresh USDC balance (NEW)
    // Note: checkUsdcBalance returns boolean, we need amount. 
    // Let's use getAccount from spl-token directly or modify checkUsdcBalance if needed.
    // Since we are in server.js, let's just do a quick raw fetch for display.
    
    // Actually, we can reuse the client helper logic but we want the NUMBER.
    // Let's do it manually here for the example to keep it simple without modifying core libs too much.
    
    let usdcBalance = 0;
    try {
        const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
        const ata = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(req.user.publicKey));
        const account = await getAccount(connection, ata);
        usdcBalance = Number(account.amount) / 1000000; // 6 decimals
    } catch (e) {
        // Account likely doesn't exist or 0 balance
        usdcBalance = 0;
    }

    // Add USDC to the response result
    if (result.success) {
        result.balance.usdcBalance = usdcBalance;
        
        // Ideally save this to storage too if you want persistence
        // connector.updateBalance(req.user.publicKey, undefined, { usdcBalance });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * GET /api/wallet/transactions
 * Get transaction history (requires auth)
 */
app.get('/api/wallet/transactions', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await connector.getTransactions(
      req.user.publicKey,
      limit,
      offset
    );
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * POST /api/wallet/logout
 * Logout (clear session)
 */
app.post('/api/wallet/logout', (req, res) => {
  try {
    const sessionToken = req.cookies.session;
    
    if (sessionToken) {
      connector.deleteSession(sessionToken);
    }
    
    res.clearCookie('session');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * GET /api/wallet/verify
 * Verify if user is authenticated
 */
app.get('/api/wallet/verify', (req, res) => {
  try {
    const sessionToken = req.cookies.session;
    const session = connector.verifySession(sessionToken);
    
    if (!session) {
      return res.json({ success: false, authenticated: false });
    }
    
    res.json({
      success: true,
      authenticated: true,
      publicKey: session.publicKey
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * POST /api/ai/request (NEW)
 * Proxy for x402 requests using authenticated wallet
 */
app.post('/api/ai/request', requireAuth, async (req, res) => {
    try {
        // 1. Get Signer from Session (using new helper)
        const sessionToken = req.cookies.session;
        const signer = connector.getSignerFromSession(sessionToken);

        // 2. Create Client
        const client = createZeroX402Client({
            connection,
            signer,
            network: 'solana'
        });

        // 3. Make Request
        const API_URL = req.body.targetUrl || 'https://api.zeroconnector.fun/api/zeroc-x402-demo';
        const prompt = req.body.prompt || 'Hello';
        const payloadKey = req.body.payloadKey || 'prompt'; // Default to 'prompt'

        // Construct body dynamically
        const body = {};
        body[payloadKey] = prompt;

        const response = await client.fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                success: false, 
                error: `Upstream error: ${response.statusText}`, 
                details: errorText 
            });
        }

        const data = await response.json();
        res.json({ success: true, data });

    } catch (error) {
        console.error('AI Proxy Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Start server
app.listen(PORT, () => {
  console.log(`Zero Connector Express server running on http://localhost:${PORT}`);
  console.log(`Network: ${connector.network}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await connector.close();
  process.exit(0);
});
