/**
 * Swap Service
 * Orchestrates the complete swap flow: deposit → initiate → monitor
 */

import { Contract, Account, CallData, RpcProvider } from 'starknet'
import { CONTRACTS } from '@/lib/constants/contracts'
import { generateSwapParameters, toWei } from '@/lib/utils/crypto'
import { initiateSwap, getSwapStatus } from '@/lib/api/relayer'
import { getNetworkConfig } from '@/lib/constants/networks'

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
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view'
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
  
  // Uint256 max value: 2^256 - 1
  const maxUint256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
  if (amountBigInt > maxUint256) {
    throw new Error(`Amount ${amount} exceeds Uint256 maximum value`)
  }
  
  const low = amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
  const high = amountBigInt >> BigInt(128)
  
  // Ensure low and high are within u128 range
  const maxU128 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
  if (low > maxU128 || high > maxU128) {
    throw new Error('Uint256 conversion error: low or high exceeds u128')
  }
  
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
  onStatusUpdate?: (status: 'approving' | 'depositing' | 'initiating') => void // Optional callback for status updates
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
  // Always use real smart contract calls
  // Only backend API calls are mocked (handled in relayer.ts)
  
  if (!params.account) {
    throw new Error('Starknet account required for swap execution')
  }
  
  const { fromToken, toToken, amount, userAddress, account, swapDirection, onStatusUpdate } = params
  
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
  
  // Validate and convert amount to wei
  if (!amount || amount === '0' || parseFloat(amount) <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  // Ensure amount is a valid number string
  const amountNum = parseFloat(amount)
  if (isNaN(amountNum) || !isFinite(amountNum)) {
    throw new Error('Invalid amount format')
  }
  
  // Convert to wei (18 decimals)
  const amountWei = toWei(amount)
  
  // Validate wei amount is not zero
  if (BigInt(amountWei) === BigInt(0)) {
    throw new Error('Amount converted to zero wei. Please use a larger amount.')
  }
  
  console.log('[Swap] Amount validation:', {
    original: amount,
    amountNum,
    amountWei,
    amountWeiBigInt: BigInt(amountWei).toString()
  })
  
  // Generate privacy parameters
  console.log('[Swap] Generating privacy parameters...')
  const { secret, blindingFactor, commitment, hashLock } = 
    await generateSwapParameters(amountWei)
  
  console.log('[Swap] Privacy parameters:', {
    commitment,
    hashLock: hashLock.slice(0, 16) + '...'
  })
  
  let txHash = ''
  
  // Create a custom RPC provider with our configured RPC URL
  // This ensures we use the correct RPC endpoint instead of the wallet's default
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  // Only do deposit for Starknet → Zcash or Starknet internal swaps
  if (swapDirection !== 'zcash_to_starknet') {
    // Get token contract address
    const tokenAddress = fromToken === 'STRK' ? CONTRACTS.STRK_TOKEN : CONTRACTS.VEIL_TOKEN
    const poolAddress = CONTRACTS.FAST_POOL // or STANDARD_POOL based on user preference
    
    // Check user balance first to prevent overflow errors
    console.log('[Swap] Checking user balance...')
    const balanceCall = {
      contractAddress: tokenAddress,
      entrypoint: 'balanceOf',
      calldata: CallData.compile({
        account: userAddress
      })
    }
    
    const balanceResponse = await customProvider.callContract(balanceCall)
    let balanceBigInt: bigint = BigInt(0)
    
    if (balanceResponse && Array.isArray(balanceResponse) && balanceResponse.length >= 2) {
      const [low, high] = balanceResponse
      const lowBigInt = BigInt(low || '0')
      const highBigInt = BigInt(high || '0')
      balanceBigInt = lowBigInt + (highBigInt << BigInt(128))
    }
    
    console.log('[Swap] User balance:', balanceBigInt.toString(), 'Required:', amountWei)
    
    if (balanceBigInt < BigInt(amountWei)) {
      throw new Error(`Insufficient balance. You have ${balanceBigInt.toString()} but need ${amountWei}`)
    }
    
    // Check and approve if needed
    console.log('[Swap] Checking token allowance...')
    
    // Use callContract for view function with our custom provider
    const allowanceCall = {
      contractAddress: tokenAddress,
      entrypoint: 'allowance',
      calldata: CallData.compile({
        owner: userAddress,
        spender: poolAddress
      })
    }
    
    const allowanceResponse = await customProvider.callContract(allowanceCall)
    console.log('[Swap] Allowance response:', allowanceResponse)
    
    // Handle the response structure from callContract
    // Response format: [low, high] array for Uint256
    let allowanceBigInt: bigint = BigInt(0)
    
    if (allowanceResponse && Array.isArray(allowanceResponse)) {
      // Result is an array [low, high] for Uint256
      const [low, high] = allowanceResponse
      const lowBigInt = BigInt(low || '0')
      const highBigInt = BigInt(high || '0')
      allowanceBigInt = lowBigInt + (highBigInt << BigInt(128))
      console.log('[Swap] Parsed allowance - low:', low, 'high:', high, 'total:', allowanceBigInt.toString())
    } else {
      console.warn('[Swap] Unexpected allowance response format:', allowanceResponse)
      // Default to 0 if we can't parse it
      allowanceBigInt = BigInt(0)
    }
    
    console.log('[Swap] Current allowance:', allowanceBigInt.toString(), 'Required:', amountWei)
    
    if (allowanceBigInt < BigInt(amountWei)) {
      onStatusUpdate?.('approving')
      console.log('[Swap] Approving token spending...')
      const uint256Amount = toUint256(amountWei)
      // Uint256 is passed as [low, high] in calldata
      const approveCall = {
        contractAddress: tokenAddress,
        entrypoint: 'approve',
        calldata: [poolAddress, uint256Amount.low, uint256Amount.high]
      }
      
      const approveTx = await account.execute(approveCall)
      console.log('[Swap] Approval tx:', approveTx.transaction_hash)
      
      // Wait for approval confirmation using our custom provider (avoids wallet's RPC SSL issues)
      await customProvider.waitForTransaction(approveTx.transaction_hash)
      console.log('[Swap] Approval confirmed')
      
      // Verify allowance was set correctly after approval
      const verifyAllowanceCall = {
        contractAddress: tokenAddress,
        entrypoint: 'allowance',
        calldata: CallData.compile({
          owner: userAddress,
          spender: poolAddress
        })
      }
      
      const verifyAllowanceResponse = await customProvider.callContract(verifyAllowanceCall)
      let verifyAllowanceBigInt: bigint = BigInt(0)
      
      if (verifyAllowanceResponse && Array.isArray(verifyAllowanceResponse)) {
        const [low, high] = verifyAllowanceResponse
        const lowBigInt = BigInt(low || '0')
        const highBigInt = BigInt(high || '0')
        verifyAllowanceBigInt = lowBigInt + (highBigInt << BigInt(128))
      }
      
      console.log('[Swap] Verified allowance after approval:', verifyAllowanceBigInt.toString(), 'Required:', amountWei)
      
      if (verifyAllowanceBigInt < BigInt(amountWei)) {
        throw new Error(`Approval failed. Allowance is ${verifyAllowanceBigInt.toString()} but need ${amountWei}`)
      }
    }
    
    // Double-check balance and allowance right before deposit
    console.log('[Swap] Final balance and allowance check before deposit...')
    const finalBalanceCall = {
      contractAddress: tokenAddress,
      entrypoint: 'balanceOf',
      calldata: CallData.compile({
        account: userAddress
      })
    }
    
    const finalBalanceResponse = await customProvider.callContract(finalBalanceCall)
    let finalBalanceBigInt: bigint = BigInt(0)
    
    if (finalBalanceResponse && Array.isArray(finalBalanceResponse) && finalBalanceResponse.length >= 2) {
      const [low, high] = finalBalanceResponse
      const lowBigInt = BigInt(low || '0')
      const highBigInt = BigInt(high || '0')
      finalBalanceBigInt = lowBigInt + (highBigInt << BigInt(128))
    }
    
    const finalAllowanceCall = {
      contractAddress: tokenAddress,
      entrypoint: 'allowance',
      calldata: CallData.compile({
        owner: userAddress,
        spender: poolAddress
      })
    }
    
    const finalAllowanceResponse = await customProvider.callContract(finalAllowanceCall)
    let finalAllowanceBigInt: bigint = BigInt(0)
    
    if (finalAllowanceResponse && Array.isArray(finalAllowanceResponse)) {
      const [low, high] = finalAllowanceResponse
      const lowBigInt = BigInt(low || '0')
      const highBigInt = BigInt(high || '0')
      finalAllowanceBigInt = lowBigInt + (highBigInt << BigInt(128))
    }
    
    console.log('[Swap] Final check - Balance:', finalBalanceBigInt.toString(), 'Allowance:', finalAllowanceBigInt.toString(), 'Required:', amountWei)
    
    if (finalBalanceBigInt < BigInt(amountWei)) {
      throw new Error(`Insufficient balance right before deposit. You have ${finalBalanceBigInt.toString()} but need ${amountWei}`)
    }
    
    if (finalAllowanceBigInt < BigInt(amountWei)) {
      throw new Error(`Insufficient allowance right before deposit. Allowance is ${finalAllowanceBigInt.toString()} but need ${amountWei}`)
    }
    
    // Deposit to pool
    onStatusUpdate?.('depositing')
    console.log('[Swap] Depositing to pool...')
    console.log('[Swap] Deposit parameters:', {
      poolAddress,
      tokenAddress,
      commitment,
      amountWei,
      amountLow: toUint256(amountWei).low,
      amountHigh: toUint256(amountWei).high
    })
    
    const uint256Amount = toUint256(amountWei)
    // Uint256 is passed as [low, high] in calldata
    const depositCall = {
      contractAddress: poolAddress,
      entrypoint: 'deposit',
      calldata: [tokenAddress, commitment, uint256Amount.low, uint256Amount.high]
    }
    
    const depositTx = await account.execute(depositCall)
    console.log('[Swap] Deposit tx:', depositTx.transaction_hash)
    txHash = depositTx.transaction_hash
    
    // Wait for deposit confirmation using our custom provider (avoids wallet's RPC SSL issues)
    await customProvider.waitForTransaction(depositTx.transaction_hash)
    console.log('[Swap] Deposit confirmed')
  } else {
    // For Zcash → Starknet, user creates Zcash HTLC separately
    console.log('[Swap] Zcash → Starknet: User must create Zcash HTLC with hash_lock:', hashLock)
  }
  
  // Initiate swap with relayer (this will use mock if backend not ready)
  onStatusUpdate?.('initiating')
  console.log('[Swap] Initiating swap with relayer...')
  
  // Calculate Zcash amount (for cross-chain swaps, this would come from price oracle)
  const zcashAmount = toToken === 'ZEC' ? amount : '0'
  
  // For internal swaps, we still need to initiate with the relayer
  // Map internal swaps to a direction (use starknet_to_zcash as default for internal)
  const relayerSwapDirection: 'starknet_to_zcash' | 'zcash_to_starknet' = 
    swapDirection === 'starknet_internal' ? 'starknet_to_zcash' : swapDirection
  
  const swapResponse = await initiateSwap({
    user_address: userAddress,
    swap_direction: relayerSwapDirection,
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
  // getSwapStatus already handles mocking via USE_MOCK_BACKEND in relayer.ts
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

