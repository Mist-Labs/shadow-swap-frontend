/**
 * Zcash Wallet Manager
 * 
 * Manages WebZjs wallet instances to avoid creating new wallets for each transaction.
 * Reuses wallet instances and handles account management.
 */

import { initializeWebZjs } from './webzjs-init'

interface WalletInstance {
  wallet: any // WebWallet instance
  network: 'main' | 'test'
  accountId: number | null
  viewingKey: string
  lightwalletdUrl: string
}

// Cache wallet instances by viewing key and network
const walletCache = new Map<string, WalletInstance>()

/**
 * Get or create a WebWallet instance for a viewing key
 */
export async function getWalletInstance (
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): Promise<WalletInstance> {
  const cacheKey = `${network}:${viewingKey}`
  
  if (walletCache.has(cacheKey)) {
    return walletCache.get(cacheKey)!
  }

  await initializeWebZjs()
  // Use files from .build directory - already built, no processing needed
  const webzjs = await import(/* webpackIgnore: true */ '../../.build/WebZjs/packages/webzjs-wallet/webzjs_wallet.js')
  const { WebWallet } = webzjs

  const lightwalletdUrl = network === 'main' 
    ? 'https://zcash-mainnet.chainsafe.dev'
    : 'https://zcash-testnet.chainsafe.dev'

  const wallet = new WebWallet(network, lightwalletdUrl, 1) // min_confirmations = 1

  // Import the viewing key as a view-only account
  const accountId = await wallet.create_account_view_ufvk(
    `swap-account-${Date.now()}`,
    viewingKey,
    null // birthday_height - null means scan from beginning
  )

  const instance: WalletInstance = {
    wallet,
    network,
    accountId,
    viewingKey,
    lightwalletdUrl
  }

  walletCache.set(cacheKey, instance)
  return instance
}

/**
 * Clean up a wallet instance
 */
export function cleanupWalletInstance (
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): void {
  const cacheKey = `${network}:${viewingKey}`
  const instance = walletCache.get(cacheKey)
  
  if (instance) {
    try {
      instance.wallet.free()
    } catch (error) {
      console.warn('[Zcash] Error freeing wallet:', error)
    }
    walletCache.delete(cacheKey)
  }
}

/**
 * Clear all wallet instances
 */
export function clearAllWalletInstances (): void {
  for (const [key, instance] of walletCache.entries()) {
    try {
      instance.wallet.free()
    } catch (error) {
      console.warn('[Zcash] Error freeing wallet:', error)
    }
  }
  walletCache.clear()
}

