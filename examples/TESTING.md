# Zero Connector - Quick Test Guide

Quick guide for testing the Zero Connector library with frontend and backend.

## Setup (one-time)

### 1. Install root dependencies
```bash
# In main directory
npm install
```

### 2. Install Express backend dependencies
```bash
cd examples/express
npm install
cd ../..
```

### 3. Install frontend dependencies
```bash
cd examples/frontend
npm install
cd ../..
```

## Starting

### Terminal 1: Start backend
```bash
cd examples/express
npm start
```

Server runs on: `http://localhost:3001`

### Terminal 2: Start frontend
```bash
cd examples/frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Test Scenario

### 1. Create new wallet
1. Open browser: `http://localhost:5173`
2. In "Create New Wallet" section:
   - Enter password (min. 8 characters, e.g. `test123456`)
   - Confirm password
   - Click "Create Wallet"
3. Public key is displayed in result section
4. **Important**: Save public key for later login!

### 2. Login with wallet
1. In "Login to Existing Wallet" section:
   - Paste public key (from step 1)
   - Enter password
   - Click "Login"
2. After successful login:
   - Auth status is shown at top
   - Balance is loaded (0.0000 SOL for new wallets)
   - Create/Login forms are hidden

### 3. Test balance
1. Check balance display in auth status
2. Click 🔄 button to refresh balance from blockchain
   - On Mainnet: Real balance from blockchain
   - On Devnet: Balance from devnet

### 4. Copy public key
1. Click 📋 button next to public key
2. Public key is copied to clipboard
3. Button briefly shows ✓ for confirmation

### 5. Logout
1. Click "Logout" button
2. Session is deleted
3. Login forms are shown again

## Check API log

In the lower "API Log" section, all API requests are displayed:
- Timestamp
- HTTP method & endpoint
- Status code (green = success, red = error)
- Request/response data

## Configure network

### For Testnet/Devnet (recommended for testing):
```javascript
// examples/express/server.js, line 9
network: 'devnet'  // instead of 'mainnet-beta'
```

### Get Devnet SOL (for testing):
1. Create wallet on devnet
2. Go to https://faucet.solana.com
3. Enter public key
4. Request devnet SOL (free)
5. Refresh balance in frontend

## Troubleshooting

### CORS errors
- Backend must be running before starting frontend
- CORS is configured for `http://localhost:5173`
- For different frontend port: adjust `server.js`

### "Unauthorized" on balance fetch
- Session expired (24h)
- Login again

### Balance shows 0.0000
- New wallet has no balance
- For Mainnet: Send SOL to public key
- For Devnet: Use faucet (see above)

### Backend won't start
- Port 3001 already in use?
- Dependencies installed? (`npm install` in express folder)

## Files

- **Backend**: `examples/express/server.js`
- **Frontend**: `examples/frontend/`
- **Wallet Storage**: `examples/express/data/wallets.json`

## Next Steps

- Integrate with your own frontend using client utils
- Implement custom storage adapter (PostgreSQL/MongoDB)
- Test transaction history
- Integrate into your own app

