/**
 * Swap Service
 * Orchestrates the complete swap flow: deposit → initiate → monitor
 */

import { Contract, Account, CallData } from 'starknet'
import { CONTRACTS } from '@/lib/constants/contracts'
import { generateSwapParameters, toWei } from '@/lib/utils/crypto'
import { initiateSwap, getSwapStatus } from '@/lib/api/relayer'

// ERC20 ABI (minimal - just what we need)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'felt' },
      { name: 'amount', type: 'Uint256' }
    ],
    outputs: [{ name: 'success', type: 'felt' }]
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'felt' },
      { name: 'spender', type: 'felt' }
    ],
    outputs: [{ name: 'remaining', type: 'Uint256' }]
  }
]

// Pool ABI (minimal)
const POOL_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'token', type: 'felt' },
      { name: 'commitment', type: 'felt' },
      { name: 'amount', type: 'Uint256' }
    ],
    outputs: []
  }
]

/**
 * Convert amount to Uint256 format for Starknet
 */
function toUint256(amount: string): { low: string; high: string } {
  const amountBigInt = BigInt(amount)
  const low = amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
  const high = amountBigInt >> BigInt(128)
  
  return {
    low: '0x' + low.toString(16),
    high: '0x' + high.toString(16)
  }
}

export interface SwapParams {
  fromToken: 'STRK' | 'VEIL' | 'ZEC'
  toToken: 'STRK' | 'VEIL' | 'ZEC'
  amount: string // Human-readable amount (e.g., "100")
  userAddress: string
  account: Account // Starknet account for signing transactions
  swapDirection: 'starknet_to_zcash' | 'zcash_to_starknet' | 'starknet_internal'
}

export interface SwapResult {
  swapId: string
  commitment: string
  secret: string
  blindingFactor: string
  hashLock: string
  txHash: string
}

/**
 * Execute a complete swap (Starknet internal or cross-chain)
 * 1. Generate privacy parameters
 * 2. Approve token spending (Starknet only)
 * 3. Deposit to pool (Starknet → Zcash or Starknet internal)
 * 4. Initiate swap with relayer
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const { fromToken, toToken, amount, userAddress, account, swapDirection } = params
  
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
  
  // Generate privacy parameters
  console.log('[Swap] Generating privacy parameters...')
  const { secret, blindingFactor, commitment, hashLock } = 
    await generateSwapParameters(amountWei)
  
  console.log('[Swap] Privacy parameters:', {
    commitment,
    hashLock: hashLock.slice(0, 16) + '...'
  })
  
  let txHash = ''
  
  // Only do deposit for Starknet → Zcash or Starknet internal swaps
  if (swapDirection !== 'zcash_to_starknet') {
    // Get token contract address
    const tokenAddress = fromToken === 'STRK' ? CONTRACTS.STRK_TOKEN : CONTRACTS.VEIL_TOKEN
    const poolAddress = CONTRACTS.FAST_POOL // or STANDARD_POOL based on user preference
    
    // Create contract instances
    const tokenContract = new Contract(ERC20_ABI, tokenAddress, account)
    const poolContract = new Contract(POOL_ABI, poolAddress, account)
    
    // Check and approve if needed
    console.log('[Swap] Checking token allowance...')
    const allowance = await tokenContract.allowance(userAddress, poolAddress)
    const allowanceBigInt = BigInt(allowance.remaining.low) + (BigInt(allowance.remaining.high) << BigInt(128))
    
    if (allowanceBigInt < BigInt(amountWei)) {
      console.log('[Swap] Approving token spending...')
      const approveCall = tokenContract.populate('approve', [
        poolAddress,
        toUint256(amountWei)
      ])
      
      const approveTx = await account.execute(approveCall)
      console.log('[Swap] Approval tx:', approveTx.transaction_hash)
      
      // Wait for approval confirmation
      await account.waitForTransaction(approveTx.transaction_hash)
      console.log('[Swap] Approval confirmed')
    }
    
    // Deposit to pool
    console.log('[Swap] Depositing to pool...')
    const depositCall = poolContract.populate('deposit', [
      tokenAddress,
      commitment,
      toUint256(amountWei)
    ])
    
    const depositTx = await account.execute(depositCall)
    console.log('[Swap] Deposit tx:', depositTx.transaction_hash)
    txHash = depositTx.transaction_hash
    
    // Wait for deposit confirmation
    await account.waitForTransaction(depositTx.transaction_hash)
    console.log('[Swap] Deposit confirmed')
  } else {
    // For Zcash → Starknet, user creates Zcash HTLC separately
    console.log('[Swap] Zcash → Starknet: User must create Zcash HTLC with hash_lock:', hashLock)
  }
  
  // Initiate swap with relayer
  console.log('[Swap] Initiating swap with relayer...')
  
  // Calculate Zcash amount (for cross-chain swaps, this would come from price oracle)
  const zcashAmount = toToken === 'ZEC' ? amount : '0'
  
  const swapResponse = await initiateSwap({
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
  
  console.log('[Swap] Swap initiated:', swapResponse.swap_id)
  
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
 * Monitor swap status
 */
export async function monitorSwap(swapId: string, onUpdate: (status: any) => void): Promise<void> {
  const pollInterval = 5000 // 5 seconds
  
  const poll = async () => {
    try {
      const status = await getSwapStatus(swapId)
      onUpdate(status)
      
      // Stop polling if swap is in a final state
      if (['redeemed', 'refunded', 'failed'].includes(status.data.status)) {
        return
      }
      
      // Continue polling
      setTimeout(poll, pollInterval)
    } catch (error) {
      console.error('[Swap] Error polling status:', error)
      // Retry after a delay
      setTimeout(poll, pollInterval * 2)
    }
  }
  
  poll()
}

/**
 * Get token contract address
 */
export function getTokenAddress(token: 'STRK' | 'VEIL'): string {
  return token === 'STRK' ? CONTRACTS.STRK_TOKEN : CONTRACTS.VEIL_TOKEN
}

/**
 * Get pool contract address
 */
export function getPoolAddress(poolType: 'fast' | 'standard' = 'fast'): string {
  return poolType === 'fast' ? CONTRACTS.FAST_POOL : CONTRACTS.STANDARD_POOL
}

