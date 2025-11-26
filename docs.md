Shadow Swap Relayer API Documentation
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
User MUST call pool.deposit(token, commitment, amount) on Starknet FIRST
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
  "nullifier": "0x..." // Starknet only
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
  "secret": "0x..." // The revealed secret!
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


Frontend Integration Flow
Starknet → Zcash Swap
// 1. Generate privacy parameters
const secret = generateRandom32Bytes();
const blinding = generateRandom32Bytes();
const commitment = PoseidonHash(amount, blinding);
const hash_lock = SHA256(secret);

// 2. Deposit to pool
await pool.deposit(token, commitment, amount);
// Wait for confirmation...

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
    swap_direction: 'starknet_to_zcash',
    commitment: commitment,
    hash_lock: hash_lock,
    starknet_amount: amount,
    zcash_amount: zcashAmount
  })
});

const { swap_id } = await response.json();

// 4. Monitor swap status
const status = await fetch(`/swap/${swap_id}`);

// 5. When secret revealed, redeem on Starknet
// (Relayer handles Zcash redemption automatically)

Zcash → Starknet Swap
// 1. Generate privacy parameters
const secret = generateRandom32Bytes();
const hash_lock = SHA256(secret);

// 2. Initiate swap with relayer
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
    starknet_amount: amount,
    zcash_amount: zcashAmount
  })
});

// 3. Create Zcash HTLC with hash_lock
// (User handles this via Zcash wallet)

// 4. Indexer detects Zcash HTLC → relayer creates Starknet HTLC

// 5. Monitor and redeem when ready


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


Important Security Notes
Never send secret to backend - only hash_lock
Generate commitment locally - backend cannot recreate it
Verify deposit before initiating - Starknet → Zcash swaps require prior deposit
Store secret securely - needed for redemption
Use SHA256 for hash_lock - cross-chain compatibility
HMAC secret - obtain from relayer operator

Support
For issues or questions, contact the relayer operator or check system logs.

