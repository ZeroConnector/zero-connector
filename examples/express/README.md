# Zero Connector Express.js Example

This is a complete Express.js REST API example using Zero Connector for Solana wallet authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure Zero Connector is installed in the parent directory:
```bash
cd ../..
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /api/wallet/create
Create a new wallet

**Request:**
```json
{
  "password": "your-secure-password"
}
```

**Response:**
```json
{
  "success": true,
  "publicKey": "5Gv8c...3Hx2",
  "message": "Wallet created successfully"
}
```

### POST /api/wallet/authenticate
Authenticate with existing wallet

**Request:**
```json
{
  "publicKey": "5Gv8c...3Hx2",
  "password": "your-secure-password"
}
```

**Response:**
```json
{
  "success": true,
  "publicKey": "5Gv8c...3Hx2",
  "balance": {
    "solBalance": 0.1,
    "customData": {},
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  },
  "message": "Authentication successful"
}
```

### GET /api/wallet/balance
Get wallet balance (requires authentication)

**Response:**
```json
{
  "success": true,
  "publicKey": "5Gv8c...3Hx2",
  "balance": {
    "solBalance": 0.1,
    "customData": {},
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  }
}
```

### POST /api/wallet/balance/refresh
Refresh balance from blockchain (requires authentication)

### GET /api/wallet/transactions?limit=100&offset=0
Get transaction history (requires authentication)

### POST /api/wallet/logout
Logout and clear session

### GET /api/wallet/verify
Verify if user is authenticated

## Testing with cURL

Create wallet:
```bash
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"password":"test123456"}'
```

Authenticate:
```bash
curl -X POST http://localhost:3001/api/wallet/authenticate \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"YOUR_PUBLIC_KEY","password":"test123456"}' \
  -c cookies.txt
```

Get balance:
```bash
curl -X GET http://localhost:3001/api/wallet/balance \
  -b cookies.txt
```

## Configuration

Edit `server.js` to configure:
- Port (default: 3001)
- Network (mainnet-beta or devnet)
- CORS origin
- Storage path

