# Zero Connector

**Solana wallet authentication system with password-based security**

Zero Connector is a powerful, flexible authentication library for Solana wallets that allows users to create password-protected wallets without browser extensions. It features adapter-based storage (JSON, PostgreSQL, MongoDB), session management, and is framework-agnostic.

## Features

- **Password-Protected Wallets**: Create Solana wallets secured by passwords
- **No Browser Extension Required**: Server-side wallet management
- **Multiple Storage Adapters**: JSON file, PostgreSQL, MongoDB support
- **Session Management**: Built-in session handling with automatic cleanup
- **Framework Agnostic**: Works with any Node.js framework
- **TypeScript Support**: Full type definitions included
- **Security First**: AES-256-GCM encryption, scrypt password hashing
- **Blockchain Integration**: Automatic balance fetching from Solana mainnet/devnet
- **x402 Payment Support**: Seamlessly handle paid requests (e.g., AI agents) with built-in wallet integration

## Installation

```bash
npm install zero-connector
```

### Optional Dependencies

For PostgreSQL support:
```bash
npm install pg
```

For MongoDB support:
```bash
npm install mongodb
```

## Quick Start

```javascript
import ZeroConnector from 'zero-connector';

// Initialize with JSON storage (default)
const connector = new ZeroConnector({
  storagePath: './data/wallets.json',
  network: 'mainnet-beta' // or 'devnet'
});

// Create a new wallet
const result = await connector.createWallet({
  password: 'secure-password-123'
});

console.log(result.publicKey); // User's new Solana wallet address

// Authenticate
const authResult = await connector.authenticate({
  publicKey: result.publicKey,
  password: 'secure-password-123'
});

console.log(authResult.sessionToken); // Session token for future requests

// Get balance
const balance = await connector.getBalance(result.publicKey);
console.log(`Balance: ${balance.balance.solBalance} SOL`);

// Make Paid Requests (x402)
// 1. Get Signer from session or login
const signer = await connector.getSigner(result.publicKey, 'secure-password-123');

// 2. Create Payment Client
import { createZeroX402Client } from 'zero-connector/client/x402';
import { Connection } from '@solana/web3.js';

const client = createZeroX402Client({
  connection: new Connection('https://api.mainnet-beta.solana.com'),
  signer,
  network: 'solana' // or 'devnet'
});

// 3. Send Request (Handles 402 Payment Automatically)
const response = await client.fetch('https://api.example.com/paid-service', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello AI' })
});
console.log(await response.json());
```

## Storage Adapters

### JSON File Storage (Default)

```javascript
import { ZeroConnector, JSONAdapter } from 'zero-connector';

const connector = new ZeroConnector({
  storage: new JSONAdapter('./data/wallets.json')
});
```

### PostgreSQL Storage

```javascript
import { ZeroConnector, PostgresAdapter } from 'zero-connector';

const storage = new PostgresAdapter({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

const connector = new ZeroConnector({ storage });

// Initialize database tables
await connector.initialize();
```

### MongoDB Storage

```javascript
import { ZeroConnector, MongoAdapter } from 'zero-connector';

const storage = new MongoAdapter(
  'mongodb://localhost:27017',
  'myapp'
);

const connector = new ZeroConnector({ storage });
await connector.initialize();
```

## API Reference

### ZeroConnector Class

#### Constructor Options

```javascript
new ZeroConnector({
  storage: StorageAdapter,           // Storage adapter instance
  storagePath: string,                // Path for JSON storage (if using default)
  sessionManager: SessionManager,     // Custom session manager
  network: string,                    // 'mainnet-beta', 'devnet', 'testnet'
  customRpcUrl: string,               // Custom Solana RPC URL
  sessionOptions: {
    sessionDuration: number,          // Session duration in ms (default 24h)
    cleanupInterval: number,          // Cleanup interval in ms (default 1h)
    autoCleanup: boolean              // Auto cleanup (default true)
  }
})
```

#### Methods

**createWallet(data)**
```javascript
await connector.createWallet({ password: string });
// Returns: { success, publicKey, message }
```

**authenticate(data)**
```javascript
await connector.authenticate({ publicKey: string, password: string });
// Returns: { success, sessionToken, publicKey, balance, message }
```

**getBalance(publicKey)**
```javascript
await connector.getBalance(publicKey: string);
// Returns: { success, publicKey, balance: { solBalance, customData }, message }
```

**refreshBalance(publicKey)**
```javascript
await connector.refreshBalance(publicKey: string);
// Returns: { success, publicKey, balance, message }
```

**verifySession(sessionToken)**
```javascript
connector.verifySession(sessionToken: string);
// Returns: session object or null
```

**deleteSession(sessionToken)**
```javascript
connector.deleteSession(sessionToken: string);
// Returns: boolean
```

**addTransaction(publicKey, transaction)**
```javascript
await connector.addTransaction(publicKey, { type: 'payment', amount: 0.1 });
// Returns: transaction object with timestamp
```

**getTransactions(publicKey, limit, offset)**
```javascript
await connector.getTransactions(publicKey, 100, 0);
// Returns: array of transactions
```

**getSigner(publicKey, password)**
```javascript
const signer = await connector.getSigner(publicKey, password);
// Returns: Keypair (Signer) object for signing transactions
```

**getSignerFromSession(sessionToken)**
```javascript
const signer = connector.getSignerFromSession(sessionToken);
// Returns: Keypair (Signer) object from active session
```

## Frontend Integration

Zero Connector provides client utilities for frontend applications:

```javascript
import { 
  createWallet, 
  authenticate, 
  getBalance,
  shortenPublicKey,
  formatSolBalance 
} from 'zero-connector/client';

// Create wallet
const result = await createWallet('/api/wallet', password);

// Authenticate
const auth = await authenticate('/api/wallet', publicKey, password);

// Get balance
const balance = await getBalance('/api/wallet');

// Display utilities
const shortened = shortenPublicKey(publicKey); // "5Gv8c...3Hx2"
const formatted = formatSolBalance(1.234567, 4); // "1.2346"
```

## Express.js Example

```javascript
import express from 'express';
import ZeroConnector from 'zero-connector';

const app = express();
const connector = new ZeroConnector();

app.use(express.json());

app.post('/api/wallet/create', async (req, res) => {
  const result = await connector.createWallet(req.body);
  res.json(result);
});

app.post('/api/wallet/auth', async (req, res) => {
  const result = await connector.authenticate(req.body);
  
  if (result.success) {
    // Set session cookie
    res.cookie('session', result.sessionToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  
  res.json(result);
});

app.get('/api/wallet/balance', async (req, res) => {
  const session = connector.verifySession(req.cookies.session);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const result = await connector.getBalance(session.publicKey);
  res.json(result);
});

app.listen(3000);
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Strong Passwords**: Enforce minimum password requirements
3. **Session Storage**: Consider Redis for production session storage
4. **Rate Limiting**: Implement rate limiting on authentication endpoints
5. **Environment Variables**: Store sensitive configuration in environment variables
6. **Database Backups**: Regularly backup wallet data
7. **Private Keys**: Private keys are encrypted with user passwords - if user loses password, wallet cannot be recovered

## Custom Storage Adapter

Create your own storage adapter by extending `StorageAdapter`:

```javascript
import { StorageAdapter } from 'zero-connector/storage';

class CustomAdapter extends StorageAdapter {
  async createWallet(publicKey, encryptedPrivateKey, passwordHash, salt) {
    // Your implementation
  }
  
  async getWallet(publicKey) {
    // Your implementation
  }
  
  // Implement other required methods...
}

const connector = new ZeroConnector({
  storage: new CustomAdapter()
});
```

## Development

### Project Structure

```
zero-connector/
├── src/
│   ├── core/           # Core functionality (crypto, session, solana)
│   ├── storage/        # Storage adapters
│   ├── handlers/       # Business logic handlers
│   ├── client/         # Frontend utilities
│   └── index.js        # Main entry point
├── examples/           # Integration examples
└── tests/             # Test files
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

For issues and questions, please open an issue on GitHub.

