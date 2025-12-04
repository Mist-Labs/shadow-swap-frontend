/**
 * Mock Relayer API
 * Returns backend API responses based on documentation
 * Used when backend is not yet implemented
 */

import { generateMockSwapId } from './config'

/**
 * Mock get price - returns response per docs
 */
export async function mockGetPrice(
  fromSymbol: string,
  toSymbol: string,
  amount?: number
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Exchange rates per docs
  const rates: Record<string, Record<string, number>> = {
    STRK: {
      ZEC: 0.024, // Per docs example
      USD: 0.52,
      VEIL: 1.0 // 1:1 for internal swaps (STRK ↔ VEIL)
    },
    ZEC: {
      STRK: 41.67, // Per docs: 1/0.024
      USD: 21.50,
      VEIL: 41.67 // Same as STRK since VEIL = STRK
    },
    VEIL: {
      STRK: 1.0, // 1:1 for internal swaps
      ZEC: 0.024, // Same as STRK
      USD: 0.52
    }
  }
  
  const rate = rates[fromSymbol]?.[toSymbol] || 1
  const convertedAmount = amount ? amount * rate : undefined
  
  return {
    from_symbol: fromSymbol,
    to_symbol: toSymbol,
    rate,
    amount,
    converted_amount: convertedAmount,
    timestamp: Math.floor(Date.now() / 1000),
    sources: [
      {
        source: 'CryptoCompare',
        price: rate
      },
      {
        source: 'CoinGecko',
        price: rate * 1.02 // Slight variation
      }
    ]
  }
}

/**
 * Mock get all prices - returns response per docs
 */
export async function mockGetAllPrices(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return {
    strk_to_zec: 0.024,
    zec_to_strk: 41.67,
    strk_to_usd: 0.52,
    zec_to_usd: 21.50,
    timestamp: Math.floor(Date.now() / 1000)
  }
}

/**
 * Mock initiate swap - returns response per docs
 */
export async function mockInitiateSwap(params: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate swap ID per docs format: swap_{direction}_{address}_{timestamp}
  const addressShort = params.user_address.slice(2, 8)
  const timestamp = Math.floor(Date.now() / 1000)
  const swapId = `swap_${params.swap_direction}_${addressShort}_${timestamp}`
  
  return {
    success: true,
    swap_id: swapId,
    message: 'Swap initiated successfully. Relayer will process the counter-HTLC.',
    error: null
  }
}

// Track swap status progression per swap ID
const swapStatusTracker = new Map<string, {
  status: 'initiated' | 'locked' | 'redeemed' | 'refunded' | 'failed'
  createdAt: number
  lastUpdate: number
  callCount: number
}>()

/**
 * Mock get swap status - returns response per docs with status progression
 */
export async function mockGetSwapStatus(swapId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Parse swap ID to get direction and amounts
  const isStarknetToZcash = swapId.includes('starknet_to_zcash')
  
  // Get or create status tracker for this swap
  let tracker = swapStatusTracker.get(swapId)
  const now = Date.now()
  
  if (!tracker) {
    // First call - start with 'initiated'
    tracker = {
      status: 'initiated',
      createdAt: now,
      lastUpdate: now,
      callCount: 0
    }
    swapStatusTracker.set(swapId, tracker)
  }
  
  tracker.callCount++
  tracker.lastUpdate = now
  
  // Progress status based on time and call count
  // initiated -> locked (after 1-2 calls, ~5-10 seconds)
  // locked -> redeemed (after 2-3 more calls, ~10-15 seconds)
  if (tracker.status === 'initiated' && tracker.callCount >= 2) {
    tracker.status = 'locked'
  } else if (tracker.status === 'locked' && tracker.callCount >= 4) {
    tracker.status = 'redeemed'
  }
  
  const elapsedSeconds = Math.floor((now - tracker.createdAt) / 1000)
  
  return {
    status: 'success',
    data: {
      swap_id: swapId,
      status: tracker.status,
      starknet_amount: '1000000000000000000', // 1 token in wei
      zcash_amount: isStarknetToZcash ? '0.024' : '1.0', // Per exchange rate
      starknet_htlc_nullifier: tracker.status !== 'initiated' 
        ? `0x${Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')}`
        : undefined,
      zcash_txid: tracker.status === 'redeemed' 
        ? `tx_${Date.now()}_${Math.random().toString(36).substring(7)}` 
        : undefined,
      created_at: new Date(tracker.createdAt).toISOString(),
      updated_at: new Date(tracker.lastUpdate).toISOString()
    }
  }
}

/**
 * Mock get system stats - returns response per docs
 */
export async function mockGetSystemStats(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return {
    status: 'success',
    data: {
      total_swaps: 1543,
      successful_swaps: 1489,
      failed_swaps: 12,
      refunded_swaps: 42,
      pending_swaps: 7,
      critical_swaps: 0
    }
  }
}

/**
 * Mock health check - returns response per docs
 */
export async function mockHealthCheck(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  }
}

