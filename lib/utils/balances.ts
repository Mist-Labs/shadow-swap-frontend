import type { AccountInterface } from 'starknet'
import { Contract, RpcProvider, CallData } from 'starknet'
import type { Token } from '@/lib/constants/tokens'
import { TOKENS } from '@/lib/constants/tokens'
import {
  mockFetchStarknetTokenBalance,
  mockFetchStarknetBalances,
  mockFetchZcashBalance
} from '@/lib/simulation/mock-balances'
import { getNetworkConfig } from '@/lib/constants/networks'

// Use mock balances only if explicitly enabled (for demo when blockchain not available)
// Should NOT be used when real wallet is connected
const USE_MOCK_BALANCES = process.env.NEXT_PUBLIC_USE_MOCK_BALANCES === 'true'

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view'
  }
]

/**
 * Fetch Starknet ERC20 token balance
 */
export async function fetchStarknetTokenBalance (
  account: AccountInterface,
  tokenAddress: string
): Promise<string> {
  // Always use real blockchain calls when account is provided
  // Only use mocks if explicitly enabled AND no real account
  if (USE_MOCK_BALANCES && !account) {
    return mockFetchStarknetTokenBalance(account, tokenAddress)
  }
  
  try {
    console.log(`[Balance] Fetching balance for token ${tokenAddress} on account ${account.address}`)
    
    // Use custom provider with Infura RPC to avoid wallet's RPC CORS issues
    const networkConfig = getNetworkConfig()
    const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
    
    // Use callContract for view function with our custom provider
    const balanceCall = {
      contractAddress: tokenAddress,
      entrypoint: 'balanceOf',
      calldata: CallData.compile({
        account: account.address
      })
    }
    
    const result = await customProvider.callContract(balanceCall)
    console.log(`[Balance] Raw result:`, result)

    // Handle response from callContract - returns array [low, high] for Uint256
    if (result && Array.isArray(result) && result.length >= 2) {
      const [low, high] = result as [string, string]
      const lowBigInt = BigInt(low || '0')
      const highBigInt = BigInt(high || '0')
      const shift = BigInt(128)
      const balance = lowBigInt + (highBigInt << shift)
      return balance.toString()
    }
    
    // Fallback: result might be object with low/high
    if (result && typeof result === 'object' && 'low' in result && result.low !== undefined) {
      const resultObj = result as { low: string | number; high?: string | number }
      // Convert Uint256 to BigInt
      const shift = BigInt(128)
      const balance =
        BigInt(resultObj.low) + BigInt(resultObj.high || '0') * BigInt(2) ** shift
      return balance.toString()
    }

    // Fallback if result is already a string or number
    if (result !== null && result !== undefined) {
      return String(result)
    }
    return '0'
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenAddress}:`, error)
    return '0'
  }
}

/**
 * Fetch Starknet ETH balance (native token)
 */
export async function fetchStarknetETHBalance (
  account: AccountInterface
): Promise<string> {
  try {
    // Use custom provider with Infura RPC to avoid wallet's RPC CORS issues
    const networkConfig = getNetworkConfig()
    const customProvider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
    
    // Use getBalance method from RpcProvider (if available) or call ETH token contract
    // ETH token address on Starknet
    const ethTokenAddress =
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
    
    // Use the same balanceOf approach as other tokens
    return await fetchStarknetTokenBalance(account, ethTokenAddress)
  } catch (error) {
    console.error('Error fetching ETH balance:', error)
    return '0'
  }
}

/**
 * Fetch all Starknet token balances for connected account
 */
export async function fetchStarknetBalances (
  account: AccountInterface
): Promise<Record<string, string>> {
  // Always use real blockchain calls when account is provided
  // Only use mocks if explicitly enabled AND no real account
  if (USE_MOCK_BALANCES && !account) {
    return mockFetchStarknetBalances(account)
  }
  
  const balances: Record<string, string> = {}

  try {
    console.log(`[Balance] Fetching balances for account: ${account.address}`)
    
    // Check account provider/chain
    const provider = (account as any).provider
    if (provider) {
      try {
        const chainId = await provider.getChainId()
        console.log(`[Balance] Account chain ID: ${chainId}`)
      } catch (e) {
        console.warn(`[Balance] Could not get chain ID:`, e)
      }
    }
    
    // Fetch balances for all Starknet tokens
    const starknetTokens = TOKENS.filter(token => token.chain === 'starknet')
    console.log(`[Balance] Fetching balances for ${starknetTokens.length} tokens:`, starknetTokens.map(t => t.symbol))

    await Promise.all(
      starknetTokens.map(async token => {
        try {
          console.log(`[Balance] Fetching ${token.symbol} balance from address ${token.address}`)
          let balance: string

          // ETH is the native token, use getBalance
          if (token.symbol === 'ETH') {
            balance = await fetchStarknetETHBalance(account)
          } else {
            balance = await fetchStarknetTokenBalance(account, token.address)
          }

          console.log(`[Balance] ${token.symbol} balance: ${balance}`)
          balances[token.address] = balance
        } catch (error) {
          console.error(`[Balance] Error fetching balance for ${token.symbol}:`, error)
          if (error instanceof Error) {
            console.error(`[Balance] Error details: ${error.message}`)
          }
          balances[token.address] = '0'
        }
      })
    )
    
    console.log(`[Balance] Final balances:`, balances)
  } catch (error) {
    console.error('[Balance] Error fetching Starknet balances:', error)
    if (error instanceof Error) {
      console.error('[Balance] Error details:', error.message, error.stack)
    }
  }

  return balances
}

/**
 * Fetch Zcash balance using MetaMask Zcash Snap
 */
export async function fetchZcashBalance (
  provider: any,
  address: string
): Promise<string> {
  // Always use real provider calls when provider is provided
  // Only use mocks if explicitly enabled AND no real provider
  if (USE_MOCK_BALANCES && !provider) {
    return mockFetchZcashBalance(provider, address)
  }
  
  try {
    // For MetaMask with Zcash Snap
    if (provider && provider.request) {
      try {
        // Try to find the installed Zcash snap
        // First check installed snaps to find the actual snap ID being used
        let snapId = 'npm:@chainsafe/webzjs-zcash-snap' // Default fallback

        try {
          const installedSnaps = await provider.request({
            method: 'wallet_getSnaps'
          })
          if (installedSnaps && typeof installedSnaps === 'object') {
            for (const [id] of Object.entries(installedSnaps as any)) {
              if (id.includes('webzjs-zcash-snap') || id.includes('zcash')) {
                snapId = id
                break
              }
            }
          }
        } catch {
          // Use default if we can't check
        }

        // Try getBalance method
        const balanceResult = await provider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId,
            request: {
              method: 'getBalance'
            }
          }
        })

        // Handle different response formats
        if (balanceResult) {
          if (
            typeof balanceResult === 'string' ||
            typeof balanceResult === 'number'
          ) {
            return balanceResult.toString()
          }
          if (typeof balanceResult === 'object') {
            // Might be { balance: "...", confirmed: "...", pending: "..." }
            const balance =
              (balanceResult as any).balance ||
              (balanceResult as any).confirmed ||
              (balanceResult as any).total ||
              (balanceResult as any).value
            if (balance) {
              return balance.toString()
            }
          }
        }

        // Fallback: Try getAccountInfo which might have balance
        try {
          const accountInfo = await provider.request({
            method: 'wallet_invokeSnap',
            params: {
              snapId,
              request: {
                method: 'getAccountInfo'
              }
            }
          })

          if (accountInfo && typeof accountInfo === 'object') {
            const balance =
              (accountInfo as any).balance ||
              (accountInfo as any).confirmed ||
              (accountInfo as any).total
            if (balance) {
              return balance.toString()
            }
          }
        } catch {
          // Ignore fallback errors
        }
      } catch (snapError) {
        console.warn('Zcash Snap balance fetch failed:', snapError)
      }
    }

    // For other providers (beta), return 0
    return '0'
  } catch (error) {
    console.error('Error fetching Zcash balance:', error)
    return '0'
  }
}

/**
 * Format balance with decimals
 */
export function formatBalance (
  balance: string,
  decimals: number,
  precision: number = 6
): string {
  try {
    const balanceBigInt = BigInt(balance)
    const divisor = BigInt(10) ** BigInt(decimals)
    const wholePart = balanceBigInt / divisor
    const fractionalPart = balanceBigInt % divisor
    const zeroBigInt = BigInt(0)

    if (fractionalPart === zeroBigInt) {
      return wholePart.toString()
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmed = fractionalStr.slice(0, precision).replace(/0+$/, '')

    if (trimmed.length === 0) {
      return wholePart.toString()
    }

    return `${wholePart}.${trimmed}`
  } catch (error) {
    console.error('Error formatting balance:', error)
    return '0'
  }
}

/**
 * Get token balance from balances record
 */
export function getTokenBalance (
  balances: Record<string, string>,
  token: Token
): string {
  return balances[token.address] || '0'
}
