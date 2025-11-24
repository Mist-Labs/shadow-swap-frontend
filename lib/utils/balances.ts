import type { AccountInterface } from 'starknet'
import { Contract } from 'starknet'
import type { Token } from '@/lib/constants/tokens'
import { TOKENS } from '@/lib/constants/tokens'

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
  try {
    const contract = new Contract(ERC20_ABI, tokenAddress, account)
    const result = await contract.balanceOf(account.address)

    // result is a Uint256 object with low and high fields
    if (result && typeof result === 'object' && 'low' in result) {
      // Convert Uint256 to BigInt
      const shift = BigInt(128)
      const balance =
        BigInt(result.low) + BigInt(result.high) * BigInt(2) ** shift
      return balance.toString()
    }

    // Fallback if result is already a string or number
    return result?.toString() || '0'
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
    // Use the provider to get balance
    const provider = (account as any).provider
    if (provider && provider.getBalance) {
      const balance = await provider.getBalance(account.address)
      return balance.toString()
    }

    // Fallback: try calling the ETH token contract directly
    const ethTokenAddress =
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
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
  const balances: Record<string, string> = {}

  try {
    // Fetch balances for all Starknet tokens
    const starknetTokens = TOKENS.filter(token => token.chain === 'starknet')

    await Promise.all(
      starknetTokens.map(async token => {
        try {
          let balance: string

          // ETH is the native token, use getBalance
          if (token.symbol === 'ETH') {
            balance = await fetchStarknetETHBalance(account)
          } else {
            balance = await fetchStarknetTokenBalance(account, token.address)
          }

          balances[token.address] = balance
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error)
          balances[token.address] = '0'
        }
      })
    )
  } catch (error) {
    console.error('Error fetching Starknet balances:', error)
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
