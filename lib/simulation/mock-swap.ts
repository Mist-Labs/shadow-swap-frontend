/**
 * Mock Swap Service
 * Handles swap execution when backend is not ready
 */

import { generateMockTxHash } from './config'
import { generateSwapParameters, toWei } from '@/lib/utils/crypto'
import { mockInitiateSwap } from './mock-relayer'

export interface MockSwapParams {
  fromToken: 'STRK' | 'VEIL' | 'ZEC'
  toToken: 'STRK' | 'VEIL' | 'ZEC'
  amount: string
  userAddress: string
  swapDirection: 'starknet_to_zcash' | 'zcash_to_starknet' | 'starknet_internal'
}

export interface MockSwapResult {
  swapId: string
  commitment: string
  secret: string
  blindingFactor: string
  hashLock: string
  txHash: string
}

/**
 * Mock execute swap
 */
export async function mockExecuteSwap(params: MockSwapParams): Promise<MockSwapResult> {
  const { fromToken, toToken, amount, userAddress, swapDirection } = params
  
  // Validate swap direction
  if (fromToken === 'ZEC' && toToken === 'ZEC') {
    throw new Error('Cannot swap ZEC to ZEC')
  }
  
  if (fromToken === 'ZEC' && swapDirection !== 'zcash_to_starknet') {
    throw new Error('Invalid swap direction for Zcash source')
  }
  
  if (toToken === 'ZEC' && swapDirection !== 'starknet_to_zcash') {
    throw new Error('Invalid swap direction for Zcash destination')
  }
  
  // Convert amount to wei
  const amountWei = toWei(amount)
  
  // Generate privacy parameters (real crypto, just mocked blockchain calls)
  console.log('[Mock Swap] Generating privacy parameters...')
  const { secret, blindingFactor, commitment, hashLock } = 
    await generateSwapParameters(amountWei)
  
  console.log('[Mock Swap] Privacy parameters:', {
    commitment,
    hashLock: hashLock.slice(0, 16) + '...'
  })
  
  let txHash = ''
  
  // Simulate deposit for Starknet → Zcash or Starknet internal swaps
  if (swapDirection !== 'zcash_to_starknet') {
    // Check token allowance
    console.log('[Swap] Checking token allowance...')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Approve if needed
    const needsApproval = Math.random() > 0.3 // 70% chance needs approval
    if (needsApproval) {
      console.log('[Swap] Approving token spending...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      const approveTxHash = generateMockTxHash()
      console.log('[Swap] Approval tx:', approveTxHash)
      
      // Wait for approval confirmation
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('[Swap] Approval confirmed')
    }
    
    // Deposit to pool
    console.log('[Swap] Depositing to pool...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    txHash = generateMockTxHash()
    console.log('[Swap] Deposit tx:', txHash)
    
    // Wait for deposit confirmation
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('[Swap] Deposit confirmed')
  } else {
    // For Zcash → Starknet, user creates Zcash HTLC separately
    console.log('[Mock Swap] Zcash → Starknet: User must create Zcash HTLC with hash_lock:', hashLock)
  }
  
  // Initiate swap with relayer
  console.log('[Mock Swap] Initiating swap with relayer...')
  
  // Calculate Zcash amount (for cross-chain swaps)
  const zcashAmount = toToken === 'ZEC' ? amount : '0'
  
  const swapResponse = await mockInitiateSwap({
    user_address: userAddress,
    swap_direction: swapDirection,
    commitment,
    hash_lock: hashLock,
    starknet_amount: swapDirection === 'zcash_to_starknet' ? '0' : amountWei,
    zcash_amount: zcashAmount
  })
  
  if (!swapResponse.success) {
    throw new Error(swapResponse.error || swapResponse.message)
  }
  
  console.log('[Mock Swap] Swap initiated:', swapResponse.swap_id)
  
  return {
    swapId: swapResponse.swap_id,
    commitment,
    secret,
    blindingFactor,
    hashLock,
    txHash
  }
}

/**
 * Mock monitor swap status
 */
export async function mockMonitorSwap(
  swapId: string, 
  onUpdate: (status: any) => void
): Promise<void> {
  const pollInterval = 3000 // 3 seconds
  
  // Simulate status progression
  const statuses: Array<'initiated' | 'locked' | 'redeemed'> = ['initiated', 'locked', 'redeemed']
  let currentStatusIndex = 0
  
  // Send initial status
  const sendStatus = () => {
    const status = {
      status: 'success',
      data: {
        swap_id: swapId,
        status: statuses[currentStatusIndex],
        starknet_amount: '1000000000000000000',
        zcash_amount: '50000000',
        starknet_htlc_nullifier: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        zcash_txid: currentStatusIndex > 0 ? `tx_${Date.now()}` : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    onUpdate(status)
    
    // Progress to next status
    if (currentStatusIndex < statuses.length - 1) {
      currentStatusIndex++
      setTimeout(sendStatus, pollInterval)
    }
    // If completed, stop
  }
  
  // Start monitoring
  sendStatus()
}

