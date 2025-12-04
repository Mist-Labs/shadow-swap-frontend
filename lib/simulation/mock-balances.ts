/**
 * Mock Balance Fetching
 * Returns balances when blockchain not available
 */

import { MOCK_BALANCES } from './config'
import type { AccountInterface } from 'starknet'

/**
 * Mock fetch Starknet token balance
 */
export async function mockFetchStarknetTokenBalance(
  account: AccountInterface,
  tokenAddress: string
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return MOCK_BALANCES[tokenAddress as keyof typeof MOCK_BALANCES] || '0'
}

/**
 * Mock fetch all Starknet balances
 */
export async function mockFetchStarknetBalances(
  account: AccountInterface
): Promise<Record<string, string>> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const balances: Record<string, string> = {}
  
  // STRK
  balances['0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'] = 
    MOCK_BALANCES['0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d']
  
  // VEIL
  balances['0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1'] = 
    MOCK_BALANCES['0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1']
  
  // ETH
  balances['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'] = 
    MOCK_BALANCES['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7']
  
  return balances
}

/**
 * Mock fetch Zcash balance
 */
export async function mockFetchZcashBalance(
  provider: any,
  address: string
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return MOCK_BALANCES.zcash || '0'
}

