import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import ZeroConnector from '../../src/index.js';

// Initialize Zero Connector with JSON storage
const connector = new ZeroConnector({
  storagePath: './data/wallets.json',
  network: 'mainnet-beta' // Change to 'devnet' for testing
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
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
    const result = await connector.refreshBalance(req.user.publicKey);
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

