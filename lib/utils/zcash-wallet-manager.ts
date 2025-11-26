/**
 * Zcash Wallet Manager
 * 
 * Placeholder for managing WebWallet instances.
 * This will be implemented once the local wallet is properly integrated.
 */

interface WalletInstance {
  wallet: any
  accountId: number | null
  lastUsed: number
}

const walletCache: Map<string, WalletInstance> = new Map()

/**
 * Get or create a WebWallet instance
 * 
 * TODO: Implement once WebZjs wallet is bundled
 */
export async function getWalletInstance (
  viewingKey: string,
  network: 'main' | 'test'
): Promise<WalletInstance> {
  throw new Error(
    'WebWallet instances are not yet available. ' +
    'This feature requires the WebZjs wallet to be properly integrated.'
  )
}

/**
 * Cleanup a wallet instance
 */
export function cleanupWalletInstance (
  viewingKey: string,
  network: 'main' | 'test'
): void {
  const cacheKey = `${viewingKey}-${network}`
  const instance = walletCache.get(cacheKey)
  if (instance && instance.wallet?.free) {
    instance.wallet.free()
    walletCache.delete(cacheKey)
    console.log('[WebZjs Wallet Manager] Cleaned up wallet instance.')
  }
}

/**
 * Start periodic cleanup of old wallet instances
 */
export function startWalletCleanupInterval (intervalMs: number = 5 * 60 * 1000): void {
  if (typeof window === 'undefined') {
    return
  }

  setInterval(() => {
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000
    for (const [key, instance] of walletCache.entries()) {
      if (now - instance.lastUsed > thirtyMinutes) {
        if (instance.wallet?.free) {
          instance.wallet.free()
        }
        walletCache.delete(key)
        console.log('[WebZjs Wallet Manager] Auto-cleaned up old wallet instance.')
      }
    }
  }, intervalMs)
}

// Start cleanup when module is loaded (browser only)
if (typeof window !== 'undefined') {
  startWalletCleanupInterval()
}
