# Zero Connector Frontend Test

Frontend test client for Zero Connector - Solana Wallet Authentication System.

## Setup

1. **Start Backend** (in Terminal 1):
```bash
cd ../express
npm install
npm start
```

Express server runs on `http://localhost:3001`

2. **Start Frontend** (in Terminal 2):
```bash
cd examples/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- Create wallets with password protection
- Login with existing wallets
- Balance display (SOL + USDC)
- Refresh balance from blockchain
- Session management with cookies
- Live API log for all requests
- Copy public key to clipboard
- **x402 AI Request Integration**: Pay for AI services directly from your wallet
- Responsive design

## Usage

### 1. Create New Wallet
1. Enter password (min. 8 characters)
2. Confirm password
3. Click "Create Wallet"
4. Save the displayed public key!

### 2. Login with Existing Wallet
1. Enter public key
2. Enter password
3. Click "Login"

### 3. Check Balance
- Balance loads automatically on login
- Displays both **SOL** and **USDC** balance
- Click 🔄 to refresh balance from blockchain
- Network can be configured in Express server (mainnet-beta/devnet)

### 4. x402 AI Requests
- Select an AI Agent from the dropdown (or use custom URL)
- Enter a prompt (or use a template)
- Click "Send Request"
- The backend automatically handles the 402 Payment Challenge using your wallet
- Cost: ~0.01 USDC per request

## API Endpoints (tested)

- `POST /api/wallet/create` - Create wallet
- `POST /api/wallet/authenticate` - Login
- `GET /api/wallet/balance` - Get balance
- `POST /api/wallet/balance/refresh` - Refresh balance from blockchain
- `POST /api/wallet/logout` - Logout
- `GET /api/wallet/verify` - Verify session

## Technology Stack

- **Vite** - Build tool & dev server
- **Vanilla JavaScript** - No framework overhead
- **Fetch API** - HTTP requests
- **CSS3** - Modern styling
- **Cookie-based Authentication** - Secure session management

## Development

```bash
npm run dev     # Development server with hot reload
npm run build   # Production build
npm run preview # Production preview
```

## Notes

- Express server must be running before starting frontend
- CORS is already configured for `http://localhost:5173`
- Cookies are saved automatically (httpOnly, secure in production)
- For Testnet/Devnet: Set network to 'devnet' in Express server
- Wallet data is stored in `examples/express/data/wallets.json`

