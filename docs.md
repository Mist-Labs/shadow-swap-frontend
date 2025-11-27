Shadow Swap Relayer API Documentation
DEPLOYED SMART CONTRACTS
FastPool: 0x01749627bb08da4f8c3df6c55045ac429abdceada025262d4c51430d643db84e
StandardPool: 0x05cf3a281b3932cb4fec5648558c05fe796bd2d1b6e75554e3306c4849b82ed8
SUPPORTED TOKENS
VeilToken: 0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1
Strk: 
0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d

Base URL: http://localhost:8080 (or configured server)
Authentication: HMAC-SHA256 signatures required for all POST endpoints

Authentication
All POST requests require HMAC authentication:
Headers:
x-timestamp: <unix_timestamp>
x-signature: <hmac_sha256_hex>

Signature Generation:
const message = timestamp + JSON.stringify(body);
const signature = crypto.createHmac('sha256', HMAC_SECRET)
  .update(message)
  .digest('hex');


Endpoints
1. Initiate Swap
Endpoint: POST /swap/initiate
Purpose: Register a new cross-chain swap with the relayer
Request Body:
{
  "user_address": "0x1234...abcd",
  "swap_direction": "starknet_to_zcash",
  "commitment": "0xabcd...1234",
  "hash_lock": "a1b2c3d4...",
  "starknet_amount": "1000000000000000000",
  "zcash_amount": "0.001"
}

Fields:
Field
Type
Required
Description
user_address
string
✅
User's Starknet address (0x...)
swap_direction
string
✅
"starknet_to_zcash" or "zcash_to_starknet"
commitment
string
✅
Poseidon hash commitment (0x..., 66 chars)
hash_lock
string
✅
SHA256 hash of secret (hex, 64 chars)
starknet_amount
string
✅
Amount in wei (u256 as string)
zcash_amount
string
✅
ZEC amount as decimal string

Important Notes:
For starknet_to_zcash:
User MUST approve smart contract to spend swap amount, then call pool.deposit(token, commitment, amount) on Starknet FIRST (the two calls can be batched on Starknet as one transaction)
Wait for deposit transaction confirmation
Then call /swap/initiate with the same commitment
Relayer verifies commitment exists in pool before proceeding
For zcash_to_starknet:
Call /swap/initiate to register intent
Create Zcash HTLC with the provided hash_lock
Indexer will detect and notify relayer
Commitment Generation:
// Frontend must generate these locally:
const secret = generateRandom32Bytes();
const blinding_factor = generateRandom32Bytes();
const commitment = PoseidonHash(amount, blinding_factor);
const hash_lock = SHA256(secret); // Use SHA256, not Poseidon!

Response (200 OK):
{
  "success": true,
  "swap_id": "swap_starknet_to_zcash_0x123456_1234567890",
  "message": "Swap initiated successfully. Relayer will process the counter-HTLC.",
  "error": null
}

Response (400 Bad Request):
{
  "success": false,
  "swap_id": "swap_...",
  "message": "Commitment not found in pool - user must deposit first",
  "error": "Call pool.deposit() before initiating swap"
}


2. Indexer Event Webhook
Endpoint: POST /indexer/event
Purpose: Receive blockchain events from indexers (internal use)
Request Body:
{
  "event_type": "htlc_created",
  "chain": "starknet",
  "transaction_hash": "0xabc...123",
  "commitment": "0x1234...abcd",
  "nullifier": "0xdef...456",
  "hash_lock": "a1b2c3d4...",
  "secret": null,
  "timestamp": 1234567890
}

Event Types:
htlc_created - HTLC detected on chain
{
  "event_type": "htlc_created",
  "chain": "starknet | zcash",
  "transaction_hash": "0x...",
  "commitment": "0x...",
  "nullifier": "0x...", // Starknet only
  "hash_lock": "...",
  "timestamp": 1234567890
}

htlc_redeemed - Secret revealed
{
  "event_type": "htlc_redeemed",
  "chain": "starknet | zcash",
  "transaction_hash": "0x...",
  "commitment": "0x...",
  "hash_lock": "...",
  "secret": "0x...", // The revealed secret!
  "timestamp": 1234567890
}

htlc_refunded - Timelock expired
{
  "event_type": "htlc_refunded",
  "chain": "starknet | zcash",
  "transaction_hash": "0x...",
  "nullifier": "0x...",
  "commitment": "0x...",
  "timestamp": 1234567890
}


3. Get Swap Status
Endpoint: GET /swap/{swap_id}
Purpose: Check status of a specific swap
Example: GET /swap/swap_starknet_to_zcash_0x123456_1234567890
Response (200 OK):
{
  "status": "success",
  "data": {
    "swap_id": "swap_starknet_to_zcash_0x123456_1234567890",
    "status": "locked",
    "starknet_amount": "1000000000000000000",
    "zcash_amount": "0.001",
    "starknet_htlc_nullifier": "0xdef...456",
    "zcash_txid": "abc123...",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:35:00Z"
  }
}

Swap Statuses:
initiated - Swap registered, waiting for HTLCs
locked - Both HTLCs created
redeemed - Successfully completed
refunded - Timelock expired, funds returned
failed - Error occurred
Response (404 Not Found):
{
  "status": "error",
  "message": "Swap not found"
}


4. Get System Stats
Endpoint: GET /stats
Purpose: View overall system statistics
Response (200 OK):
{
  "status": "success",
  "data": {
    "total_swaps": 1543,
    "successful_swaps": 1489,
    "failed_swaps": 12,
    "refunded_swaps": 42,
    "pending_swaps": 7,
    "critical_swaps": 0
  }
}


5. Get Relayer Metrics
Endpoint: GET /metrics
Purpose: View detailed relayer performance metrics
Response (200 OK):
{
  "status": "success",
  "data": {
    "total_swaps_processed": 1543,
    "successful_swaps": 1489,
    "failed_swaps": 12,
    "refunded_swaps": 42,
    "starknet_htlcs_created": 1501,
    "zcash_htlcs_created": 1498,
    "starknet_redemptions": 1492,
    "zcash_redemptions": 1490,
    "retry_attempts": 234,
    "last_error": null,
    "uptime_seconds": 86400
  }
}


6. Health Check
Endpoint: GET /health
Purpose: Verify relayer is operational
Response (200 OK):
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z"
}


7. Root
Endpoint: GET /
Purpose: Service information
Response (200 OK):
{
  "service": "Shadow Swap Relayer",
  "version": "1.0.0",
  "status": "operational"
}


8. Get Price
Endpoint: GET /price
Purpose: Get current exchange rate between two currencies
Query Parameters:
from_symbol - Source currency (STRK, ZEC)
to_symbol - Target currency (STRK, ZEC, USD)
amount - Optional amount to convert
Example: GET /price?from_symbol=STRK&to_symbol=ZEC&amount=100
Response (200 OK):
{
  "from_symbol": "STRK",
  "to_symbol": "ZEC",
  "rate": 0.024,
  "amount": 100.0,
  "converted_amount": 2.4,
  "timestamp": 1234567890,
  "sources": [
    {
      "source": "CryptoCompare",
      "price": 0.024
    },
    {
      "source": "CoinGecko",
      "price": 0.025
    }
  ]
}

Response (404 Not Found):
{
  "error": "Price feed not found",
  "pair": "STRK-BTC",
  "available_pairs": ["STRK-ZEC", "ZEC-STRK", "STRK-USD", "ZEC-USD"]
}

Response (503 Service Unavailable):
{
  "error": "Price data not yet available",
  "pair": "STRK-ZEC"
}


9. Get All Prices
Endpoint: GET /prices/all
Purpose: Get all available exchange rates at once
Response (200 OK):
{
  "strk_to_zec": 0.024,
  "zec_to_strk": 41.67,
  "strk_to_usd": 0.52,
  "zec_to_usd": 21.50,
  "timestamp": 1234567890
}


10. Convert Amount
Endpoint: POST /price/convert
Purpose: Convert amount between two currencies
Request Body:
{
  "from_symbol": "STRK",
  "to_symbol": "ZEC",
  "amount": 1000.0
}

Response (200 OK):
{
  "from_symbol": "STRK",
  "to_symbol": "ZEC",
  "input_amount": 1000.0,
  "output_amount": 24.0,
  "rate": 0.024,
  "timestamp": 1234567890
}

Response (404 Not Found):
{
  "error": "Price feed not found",
  "pair": "STRK-BTC"
}

Response (503 Service Unavailable):
{
  "error": "Failed to get exchange rate: No valid price data available"
}


Frontend Integration Flow
Starknet → Zcash Swap
// 1. Get current exchange rate
const priceResponse = await fetch('/price?from_symbol=STRK&to_symbol=ZEC&amount=1000');
const { rate, converted_amount } = await priceResponse.json();

// 2. Generate privacy parameters
const secret = generateRandom32Bytes();
const blinding = generateRandom32Bytes();
const commitment = PoseidonHash(amount, blinding);
const hash_lock = SHA256(secret);

// 3. Deposit to pool
await pool.deposit(token, commitment, amount);
// Wait for confirmation...

// 4. Initiate swap with relayer
const response = await fetch('/swap/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-timestamp': timestamp,
    'x-signature': signature
  },
  body: JSON.stringify({
    user_address: '0x...',
    swap_direction: 'starknet_to_zcash',
    commitment: commitment,
    hash_lock: hash_lock,
    starknet_amount: amount,
    zcash_amount: converted_amount.toString()
  })
});

const { swap_id } = await response.json();

// 5. Monitor swap status
const status = await fetch(`/swap/${swap_id}`);

// 6. When secret revealed, redeem on Starknet
// (Relayer handles Zcash redemption automatically)

Zcash → Starknet Swap
// 1. Get current exchange rate
const priceResponse = await fetch('/price?from_symbol=ZEC&to_symbol=STRK&amount=1.0');
const { rate, converted_amount } = await priceResponse.json();

// 2. Generate privacy parameters
const secret = generateRandom32Bytes();
const hash_lock = SHA256(secret);

// 3. Initiate swap with relayer
const response = await fetch('/swap/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-timestamp': timestamp,
    'x-signature': signature
  },
  body: JSON.stringify({
    user_address: '0x...',
    swap_direction: 'zcash_to_starknet',
    commitment: '0x0', // Not used for Zcash → Starknet
    hash_lock: hash_lock,
    starknet_amount: converted_amount.toString(),
    zcash_amount: '1.0'
  })
});

// 4. Create Zcash HTLC with hash_lock
// (User handles this via Zcash wallet)

// 5. Indexer detects Zcash HTLC → relayer creates Starknet HTLC

// 6. Monitor and redeem when ready


Price Feed Features
Real-time Updates: Prices refresh every 60 seconds
Multi-source Aggregation: Averages prices from CryptoCompare and CoinGecko
Slippage Protection: Swap validation checks for price deviations > 5%
Available Pairs: STRK-ZEC, ZEC-STRK, STRK-USD, ZEC-USD

Error Codes
Code
Meaning
200
Success
400
Bad request (invalid params)
401
Unauthorized (invalid HMAC)
404
Resource not found
500
Internal server error
503
Service unavailable (price data not ready)


Important Security Notes
Never send secret to backend - only hash_lock
Generate commitment locally - backend cannot recreate it
Verify deposit before initiating - Starknet → Zcash swaps require prior deposit
Store secret securely - needed for redemption
Use SHA256 for hash_lock - cross-chain compatibility
HMAC secret - obtain from relayer operator
Check current prices before swap - market rates change constantly
Allow for slippage - prices may move during swap execution

Support
For issues or questions, contact the relayer operator or check system logs.


