/**
 * Relayer API Client
 * Handles communication with the Shadow Swap relayer backend
 */

import { RELAYER_URL, HMAC_SECRET } from '@/lib/constants/contracts'
import {
  mockGetPrice,
  mockGetAllPrices,
  mockInitiateSwap,
  mockGetSwapStatus,
  mockGetSystemStats,
  mockHealthCheck
} from '@/lib/simulation/mock-relayer'

// Use mock backend when relayer URL is not available or backend not ready
const USE_MOCK_BACKEND = !RELAYER_URL || RELAYER_URL.includes('localhost:8080')

/**
 * Generate HMAC signature for authenticated requests
 */
function generateHmacSignature(timestamp: string, body: any): string {
  const message = timestamp + JSON.stringify(body)
  
  // Browser-compatible HMAC-SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(HMAC_SECRET)
  const messageData = encoder.encode(message)
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signature => 
    Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

/**
 * Get current exchange rate between two currencies
 */
export async function getPrice(
  fromSymbol: string,
  toSymbol: string,
  amount?: number
): Promise<{
  from_symbol: string
  to_symbol: string
  rate: number
  amount?: number
  converted_amount?: number
  timestamp: number
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockGetPrice(fromSymbol, toSymbol, amount)
  }
  
  const params = new URLSearchParams({
    from_symbol: fromSymbol,
    to_symbol: toSymbol,
  })
  
  if (amount !== undefined) {
    params.append('amount', amount.toString())
  }
  
  const response = await fetch(`${RELAYER_URL}/price?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch price')
  }
  
  return response.json()
}

/**
 * Get all available exchange rates
 */
export async function getAllPrices(): Promise<{
  strk_to_zec: number
  zec_to_strk: number
  strk_to_usd: number
  zec_to_usd: number
  timestamp: number
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockGetAllPrices()
  }
  
  const response = await fetch(`${RELAYER_URL}/prices/all`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  
  return response.json()
}

/**
 * Initiate a new swap with the relayer
 */
export async function initiateSwap(params: {
  user_address: string
  swap_direction: 'starknet_to_zcash' | 'zcash_to_starknet'
  commitment: string
  hash_lock: string
  starknet_amount: string
  zcash_amount: string
}): Promise<{
  success: boolean
  swap_id: string
  message: string
  error: string | null
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockInitiateSwap(params)
  }
  
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await generateHmacSignature(timestamp, params)
  
  const response = await fetch(`${RELAYER_URL}/swap/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-timestamp': timestamp,
      'x-signature': signature,
    },
    body: JSON.stringify(params),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to initiate swap')
  }
  
  return data
}

/**
 * Get swap status
 */
export async function getSwapStatus(swapId: string): Promise<{
  status: string
  data: {
    swap_id: string
    status: 'initiated' | 'locked' | 'redeemed' | 'refunded' | 'failed'
    starknet_amount: string
    zcash_amount: string
    starknet_htlc_nullifier?: string
    zcash_txid?: string
    created_at: string
    updated_at: string
  }
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockGetSwapStatus(swapId)
  }
  
  const response = await fetch(`${RELAYER_URL}/swap/${swapId}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch swap status')
  }
  
  return response.json()
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<{
  status: string
  data: {
    total_swaps: number
    successful_swaps: number
    failed_swaps: number
    refunded_swaps: number
    pending_swaps: number
    critical_swaps: number
  }
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockGetSystemStats()
  }
  
  const response = await fetch(`${RELAYER_URL}/stats`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch system stats')
  }
  
  return response.json()
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string
  timestamp: string
}> {
  // Use mock backend if not available
  if (USE_MOCK_BACKEND) {
    return mockHealthCheck()
  }
  
  const response = await fetch(`${RELAYER_URL}/health`)
  
  if (!response.ok) {
    throw new Error('Relayer is not healthy')
  }
  
  return response.json()
}

