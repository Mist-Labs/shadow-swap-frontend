import { Contract, Account, CallData, RpcProvider } from 'starknet'
import { CONTRACTS } from '@/lib/constants/contracts'
import { getNetworkConfig } from '@/lib/constants/networks'
import fastPoolAbi from '@/lib/abis/fastpoolabi.json'
import standardPoolAbi from '@/lib/abis/standardpoolabi.json'

export type PoolType = 'fast' | 'standard'

export interface DepositParams {
  account: Account
  poolType: PoolType
  tokenAddress: string
  commitment: string
  amount: string // Amount in wei
}

export interface WithdrawParams {
  account: Account
  poolType: PoolType
  tokenAddress: string
  nullifier: string
  recipient: string
  secret?: string
}

export interface PoolBalance {
  token: string
  balance: string
}

/**
 * Convert amount to Uint256 format
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

/**
 * Get pool contract address
 */
export function getPoolAddress(poolType: PoolType): string {
  return poolType === 'fast' ? CONTRACTS.FAST_POOL : CONTRACTS.STANDARD_POOL
}

/**
 * Get pool ABI
 */
export function getPoolAbi(poolType: PoolType): any[] {
  return poolType === 'fast' ? fastPoolAbi : standardPoolAbi
}

/**
 * Deposit tokens into a pool
 */
export async function depositToPool(params: DepositParams): Promise<string> {
  const { account, poolType, tokenAddress, commitment, amount } = params
  
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  const uint256Amount = toUint256(amount)
  
  const depositCall = {
    contractAddress: poolAddress,
    entrypoint: 'deposit',
    calldata: [tokenAddress, commitment, uint256Amount.low, uint256Amount.high]
  }
  
  console.log('[Pool] Depositing to pool:', {
    poolType,
    poolAddress,
    tokenAddress,
    commitment,
    amount
  })
  
  const tx = await account.execute(depositCall)
  await customProvider.waitForTransaction(tx.transaction_hash)
  
  return tx.transaction_hash
}

/**
 * Withdraw tokens from a pool
 */
export async function withdrawFromPool(params: WithdrawParams): Promise<string> {
  const { account, poolType, tokenAddress, nullifier, recipient, secret } = params
  
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  // Secret is optional (Option<felt252>)
  // In Starknet, Option is represented as [Some(value)] or [None]
  const secretCalldata = secret ? [1, secret] : [0]
  
  const withdrawCall = {
    contractAddress: poolAddress,
    entrypoint: 'withdraw',
    calldata: [tokenAddress, nullifier, recipient, ...secretCalldata]
  }
  
  console.log('[Pool] Withdrawing from pool:', {
    poolType,
    poolAddress,
    tokenAddress,
    nullifier,
    recipient,
    hasSecret: !!secret
  })
  
  const tx = await account.execute(withdrawCall)
  await customProvider.waitForTransaction(tx.transaction_hash)
  
  return tx.transaction_hash
}

/**
 * Get pool balance for a token
 */
export async function getPoolBalance(
  poolType: PoolType,
  tokenAddress: string
): Promise<string> {
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  const balanceCall = {
    contractAddress: poolAddress,
    entrypoint: 'get_balance',
    calldata: [tokenAddress]
  }
  
  const result = await customProvider.callContract(balanceCall)
  
  // Handle Uint256 response [low, high]
  if (result && Array.isArray(result) && result.length >= 2) {
    const [low, high] = result as [string, string]
    const lowBigInt = BigInt(low || '0')
    const highBigInt = BigInt(high || '0')
    const shift = BigInt(128)
    const balance = lowBigInt + (highBigInt << shift)
    return balance.toString()
  }
  
  return '0'
}

/**
 * Get current merkle root
 */
export async function getCurrentRoot(poolType: PoolType): Promise<string> {
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  const rootCall = {
    contractAddress: poolAddress,
    entrypoint: 'get_current_root',
    calldata: []
  }
  
  const result = await customProvider.callContract(rootCall)
  
  if (result && Array.isArray(result) && result.length > 0) {
    return result[0] as string
  }
  
  return '0x0'
}

/**
 * Get next leaf index
 */
export async function getNextLeafIndex(poolType: PoolType): Promise<number> {
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  const indexCall = {
    contractAddress: poolAddress,
    entrypoint: 'get_next_leaf_index',
    calldata: []
  }
  
  const result = await customProvider.callContract(indexCall)
  
  if (result && Array.isArray(result) && result.length > 0) {
    return Number(result[0])
  }
  
  return 0
}

/**
 * Check if token is supported
 */
export async function isTokenSupported(
  poolType: PoolType,
  tokenAddress: string
): Promise<boolean> {
  const poolAddress = getPoolAddress(poolType)
  const networkConfig = getNetworkConfig()
  const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
  
  const checkCall = {
    contractAddress: poolAddress,
    entrypoint: 'is_token_supported',
    calldata: [tokenAddress]
  }
  
  const result = await customProvider.callContract(checkCall)
  
  // Bool is represented as [0] for False or [1] for True
  if (result && Array.isArray(result) && result.length > 0) {
    return Number(result[0]) === 1
  }
  
  return false
}

/**
 * Get all pool balances for supported tokens
 */
export async function getAllPoolBalances(
  poolType: PoolType,
  tokenAddresses: string[]
): Promise<PoolBalance[]> {
  const balances: PoolBalance[] = []
  
  for (const tokenAddress of tokenAddresses) {
    try {
      const isSupported = await isTokenSupported(poolType, tokenAddress)
      if (isSupported) {
        const balance = await getPoolBalance(poolType, tokenAddress)
        balances.push({ token: tokenAddress, balance })
      }
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenAddress}:`, error)
    }
  }
  
  return balances
}

/**
 * Get pool statistics
 */
export interface PoolStats {
  currentRoot: string
  nextLeafIndex: number
  balances: PoolBalance[]
}

export async function getPoolStats(
  poolType: PoolType,
  tokenAddresses: string[]
): Promise<PoolStats> {
  const [currentRoot, nextLeafIndex, balances] = await Promise.all([
    getCurrentRoot(poolType),
    getNextLeafIndex(poolType),
    getAllPoolBalances(poolType, tokenAddresses)
  ])
  
  return {
    currentRoot,
    nextLeafIndex,
    balances
  }
}

