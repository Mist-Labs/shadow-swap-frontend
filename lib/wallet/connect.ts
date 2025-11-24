import { getStarknet } from 'get-starknet-core'
import type { AccountInterface } from 'starknet'
import type {
  StarknetWallet,
  ZcashWallet,
  StarknetWalletType,
  ZcashWalletType
} from '@/lib/stores/wallet-store'

// ============================================================================
// Starknet Wallet Connection
// ============================================================================

/**
 * Map wallet type to wallet ID used by get-starknet-core
 */
function getWalletId (walletType: StarknetWalletType): string {
  switch (walletType) {
    case 'argentx':
      return 'argentX'
    case 'braavos':
      return 'braavos'
    case 'cartridge':
      return 'cartridge'
    default:
      throw new Error(`Unknown wallet type: ${walletType}`)
  }
}

export async function connectStarknetWallet (
  walletType: StarknetWalletType
): Promise<StarknetWallet> {
  try {
    const starknet = getStarknet()
    const walletId = getWalletId(walletType)

    // Get available wallets
    const availableWallets = await starknet.getAvailableWallets()

    // Find the specific wallet we want to connect to
    const targetWallet = availableWallets.find(wallet => wallet.id === walletId)

    if (!targetWallet) {
      throw new Error(
        `${
          walletType === 'argentx'
            ? 'ArgentX'
            : walletType === 'braavos'
            ? 'Braavos'
            : 'Cartridge'
        } wallet not detected. Please install the wallet extension.`
      )
    }

    // The wallet object from getAvailableWallets should have an enable method
    // If not, we'll use the wallet instance directly
    let wallet = targetWallet

    // Some wallets might need to be accessed differently
    // Try to get the wallet instance if available
    if (
      'getWallet' in starknet &&
      typeof (starknet as any).getWallet === 'function'
    ) {
      try {
        const walletInstance = await (starknet as any).getWallet(walletId)
        if (walletInstance) {
          wallet = walletInstance
        }
      } catch {
        // Fall back to using targetWallet
      }
    }

    // Enable/connect the wallet
    const result = await wallet.enable()

    if (!result || result.length === 0) {
      throw new Error('Failed to connect wallet')
    }

    // Get the account and address
    const address = result[0]
    const account = wallet.account as AccountInterface

    if (!account || !address) {
      throw new Error('Failed to get wallet account or address')
    }

    return {
      account,
      address,
      walletType
    }
  } catch (error) {
    console.error('Starknet wallet connection error:', error)
    throw error
  }
}

// ============================================================================
// Zcash Wallet Connection
// ============================================================================

/**
 * Connect to MetaMask with Zcash Shielded Wallet Snap
 * The snap allows requests from https://webzjs.chainsafe.dev
 * Available methods: getViewingKey, signPczt, getSeedFingerprint, setBirthdayBlock, getSnapStete, setSnapStete
 */
export async function connectZcashWalletMetamask (): Promise<ZcashWallet> {
  try {
    // Check if MetaMask is installed
    if (!(window as any).ethereum) {
      throw new Error(
        'MetaMask not detected. Please install MetaMask and enable the Zcash Shielded Wallet Snap.'
      )
    }

    // Find the actual MetaMask provider
    // MetaMask might be wrapped by other wallet providers, so we need to find the real one
    let ethereum = (window as any).ethereum
    let isMetaMask = ethereum.isMetaMask

    // If ethereum.providers exists, find the MetaMask provider
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const metamaskProvider = ethereum.providers.find(
        (p: any) =>
          p.isMetaMask ||
          p.rdns === 'io.metamask' ||
          p.rdns === 'io.metamask.flask'
      )
      if (metamaskProvider) {
        ethereum = metamaskProvider
        isMetaMask = true
        console.log(
          '[Zcash Snap] Found MetaMask provider in providers array:',
          {
            rdns: ethereum.rdns,
            isMetaMask: ethereum.isMetaMask
          }
        )
      }
    }

    if (!isMetaMask) {
      throw new Error(
        'MetaMask not detected. Please install MetaMask and enable the Zcash Shielded Wallet Snap.'
      )
    }

    // Check if MetaMask supports Snaps
    if (!ethereum.isMetaMask || !ethereum.request) {
      throw new Error(
        'MetaMask Snaps are not supported. Please update MetaMask to the latest version.'
      )
    }

    // Inspect available methods and properties
    const ethereumKeys = Object.keys(ethereum)
    const ethereumMethods = ethereumKeys.filter(
      key => typeof ethereum[key] === 'function'
    )
    const ethereumProperties = ethereumKeys.filter(
      key => typeof ethereum[key] !== 'function'
    )

    console.log('[Zcash Snap] MetaMask Provider Keys:', ethereumKeys)
    console.log('[Zcash Snap] MetaMask Methods:', ethereumMethods)
    console.log('[Zcash Snap] MetaMask Properties:', ethereumProperties)

    // Try to get provider info and version
    let detectedVersion: string | undefined = undefined

    if (ethereum._metamask) {
      const metamaskKeys = Object.keys(ethereum._metamask)
      console.log('[Zcash Snap] _metamask object:', metamaskKeys)

      // Try to get version from _metamask
      if ((ethereum._metamask as any).version) {
        detectedVersion = (ethereum._metamask as any).version
      }
    }

    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const providersInfo = ethereum.providers.map((p: any) => ({
        rdns: p.rdns,
        isMetaMask: p.isMetaMask,
        version: p.version,
        _metamask: p._metamask ? Object.keys(p._metamask) : null
      }))
      console.log('[Zcash Snap] Providers:', providersInfo)

      // Try to get version from providers
      for (const provider of ethereum.providers) {
        if (provider.version) {
          detectedVersion = provider.version
          break
        }
        if (provider._metamask?.version) {
          detectedVersion = provider._metamask.version
          break
        }
      }
    }

    // Try to get version from window.ethereum directly
    if (!detectedVersion && (window as any).ethereum?.version) {
      detectedVersion = (window as any).ethereum.version
    }

    // Try to get version from extension ID or other methods
    if (!detectedVersion) {
      try {
        // Some MetaMask versions expose version in different ways
        const extensionId = (window as any).ethereum?.extensionId
        console.log('[Zcash Snap] Extension ID:', extensionId)
      } catch {
        // Ignore
      }
    }

    // Check MetaMask version and Flask
    // Try multiple ways to detect Flask
    const isFlask =
      ethereum.version?.includes('flask') ||
      ethereum.rdns === 'io.metamask.flask' ||
      ethereum._metamask?.isFlask === true ||
      (window as any).ethereum?.providers?.some(
        (p: any) =>
          p.rdns === 'io.metamask.flask' || p._metamask?.isFlask === true
      )

    // Try to get version from multiple sources
    let finalVersion = detectedVersion || ethereum.version

    // Try to get version by making a request (some versions expose it this way)
    if (!finalVersion || finalVersion === 'unknown') {
      try {
        // Some MetaMask versions expose version in the provider info
        const providerInfo = await ethereum.request({
          method: 'web3_clientVersion'
        })
        if (providerInfo && typeof providerInfo === 'string') {
          // Extract version from client version string (e.g., "MetaMask/v11.0.0")
          const versionMatch = providerInfo.match(
            /MetaMask\/v?(\d+\.\d+\.\d+)/i
          )
          if (versionMatch) {
            finalVersion = versionMatch[1]
            console.log(
              '[Zcash Snap] Detected version from web3_clientVersion:',
              finalVersion
            )
          }
        }
      } catch (e) {
        // Ignore if this fails
        console.log(
          '[Zcash Snap] Could not get version from web3_clientVersion:',
          e
        )
      }
    }

    console.log('[Zcash Snap] MetaMask Info:', {
      version: finalVersion || 'unknown',
      detectedVersion,
      rdns: ethereum.rdns,
      isMetaMask: ethereum.isMetaMask,
      isFlask,
      hasRequest: !!ethereum.request,
      requestType: typeof ethereum.request,
      _metamask: ethereum._metamask ? Object.keys(ethereum._metamask) : null
    })

    // Check if version supports Snaps (11.0.0+)
    const versionSupportsSnaps =
      finalVersion && finalVersion !== 'unknown'
        ? (() => {
            const parts = finalVersion.split('.').map(Number)
            return parts[0] > 11 || (parts[0] === 11 && parts[1] >= 0)
          })()
        : null // Unknown version

    if (versionSupportsSnaps === false) {
      console.warn(
        `[Zcash Snap] ⚠️ MetaMask version ${finalVersion} does not support Snaps. ` +
          `Snaps require MetaMask 11.0.0 or later.`
      )
    }

    // Log what methods we need vs what's available
    const requiredSnapMethods = [
      'wallet_getSnaps',
      'wallet_requestSnaps',
      'wallet_invokeSnap'
    ]
    const availableMethods = ethereumMethods
    const missingMethods = requiredSnapMethods.filter(
      method => !availableMethods.includes(method)
    )
    console.log('[Zcash Snap] Required Snap methods:', requiredSnapMethods)
    console.log('[Zcash Snap] Missing Snap methods:', missingMethods)
    console.log('[Zcash Snap] Available methods:', availableMethods)

    // Try to inspect the request function if possible
    if (ethereum.request) {
      console.log('[Zcash Snap] request function:', {
        name: ethereum.request.name,
        length: ethereum.request.length,
        toString: ethereum.request.toString().substring(0, 200)
      })
    }

    // Check if Snaps methods are available
    let snapsSupported = false
    let hasGetSnaps = false
    let hasRequestSnaps = false

    // According to MetaMask docs: https://docs.metamask.io/snaps/learn/about-snaps/apis/
    // wallet_getSnaps and wallet_requestSnaps are the official API methods
    console.log(
      '[Zcash Snap] Testing wallet_getSnaps (official MetaMask API)...'
    )
    try {
      const getSnapsResult = await ethereum.request({
        method: 'wallet_getSnaps'
      })
      console.log('[Zcash Snap] ✅ wallet_getSnaps success:', getSnapsResult)
      hasGetSnaps = true
      snapsSupported = true
      hasRequestSnaps = true // If getSnaps works, requestSnaps should also work
    } catch (error: any) {
      console.log('[Zcash Snap] ❌ wallet_getSnaps failed:', {
        message: error?.message,
        code: error?.code,
        error
      })

      // Method doesn't exist - this means Snaps aren't supported in this MetaMask version
      if (error?.code === -32601) {
        hasGetSnaps = false
        hasRequestSnaps = false
        snapsSupported = false

        // Log detailed information about what's missing
        console.log(
          '[Zcash Snap] ❌ Snaps not supported - Missing methods:',
          missingMethods
        )
        console.log(
          '[Zcash Snap] Available methods do not include Snap API methods'
        )

        console.log('[Zcash Snap] Detected MetaMask version:', finalVersion)

        // Provide detailed error message based on what we know
        let errorMessage = 'MetaMask Snaps API is not available.\n\n'

        if (versionSupportsSnaps === false) {
          errorMessage += `Your MetaMask version (${finalVersion}) does not support Snaps. `
          errorMessage += `Snaps require MetaMask 11.0.0 or later.\n\n`
          errorMessage += `Please update MetaMask to the latest version:\n`
          errorMessage += `1. Open MetaMask extension\n`
          errorMessage += `2. Click the menu (three dots) > Settings > About\n`
          errorMessage += `3. Check for updates or visit https://metamask.io/download/\n\n`
        } else if (isFlask) {
          errorMessage += `You're using MetaMask Flask, but Snaps are not enabled.\n\n`
          errorMessage += `To enable Snaps in MetaMask Flask:\n`
          errorMessage += `1. Open MetaMask Flask extension\n`
          errorMessage += `2. Click the menu (three dots) > Settings > Advanced\n`
          errorMessage += `3. Enable "Snaps" in Experimental Features\n\n`
        } else {
          errorMessage += `Your MetaMask version (${
            finalVersion || 'unknown'
          }) may not support Snaps.\n\n`
          errorMessage += `To use Snaps, you need:\n`
          errorMessage += `- MetaMask 11.0.0 or later (regular MetaMask), OR\n`
          errorMessage += `- MetaMask Flask (for development)\n\n`
          errorMessage += `If you have MetaMask 11.0.0+:\n`
          errorMessage += `1. Open MetaMask extension\n`
          errorMessage += `2. Click the menu (three dots) > Settings > Advanced\n`
          errorMessage += `3. Enable "Snaps" in Experimental Features\n\n`
          errorMessage += `Note: "Add account Snap" is different from the Snaps API.\n`
          errorMessage += `You need to enable "Snaps" in Experimental Features.\n\n`
        }

        errorMessage += `For more information, see: https://docs.metamask.io/snaps/learn/about-snaps/apis/`

        throw new Error(errorMessage)
      }
    }

    console.log('[Zcash Snap] Snap support status:', {
      snapsSupported,
      hasGetSnaps,
      hasRequestSnaps,
      isFlask
    })

    // Request account access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('Failed to connect to MetaMask')
    }

    // Check for installed Zcash Snap
    // Look for any installed snap that matches the Zcash snap identifier
    // This could be from npm, localhost, or a custom build
    let snapId: string | null = null
    const possibleSnapIds = [
      'npm:@chainsafe/webzjs-zcash-snap', // Published snap
      'local:http://localhost:8080', // Local development
      'local:http://127.0.0.1:8080' // Local development alternative
    ]

    if (hasGetSnaps) {
      try {
        // Get all installed snaps
        const installedSnaps = await ethereum.request({
          method: 'wallet_getSnaps'
        })
        console.log('[Zcash Snap] All installed snaps:', installedSnaps)

        if (installedSnaps && typeof installedSnaps === 'object') {
          // Look for Zcash snap by checking snap IDs and metadata
          for (const [id, snapInfo] of Object.entries(installedSnaps as any)) {
            const info = snapInfo as any
            // Check if this is the Zcash snap by ID or name
            if (
              id.includes('webzjs-zcash-snap') ||
              id.includes('zcash') ||
              info?.name?.toLowerCase().includes('zcash') ||
              info?.version
            ) {
              snapId = id
              console.log('[Zcash Snap] Found installed Zcash snap:', id, info)
              break
            }
          }

          // If not found by pattern, try the known npm ID
          if (
            !snapId &&
            (installedSnaps as any)['npm:@chainsafe/webzjs-zcash-snap']
          ) {
            snapId = 'npm:@chainsafe/webzjs-zcash-snap'
            console.log('[Zcash Snap] Found snap by npm ID')
          }
        }
      } catch (error: any) {
        console.log('[Zcash Snap] Error checking installed snaps:', error)
      }
    }

    // If no snap is found, tell user to install it from MetaMask Snaps store
    if (!snapId) {
      throw new Error(
        'Zcash Shielded Wallet Snap is not installed. ' +
          'Please install it from MetaMask: Settings > Snaps > Browse Snaps, then search for "Zcash Shielded Wallet".'
      )
    }

    console.log('[Zcash Snap] Using installed snap ID:', snapId)

    // Get Zcash viewing key from the snap
    // According to the ChainSafe WebZjs snap source code:
    // https://github.com/ChainSafe/WebZjs/tree/main/packages/snap
    // The snap provides: getViewingKey, signPczt, getSeedFingerprint, setBirthdayBlock, getSnapStete, setSnapStete
    // It does NOT provide getAddress, getUnifiedAddress, or getTransparentAddress methods
    // We need to use the viewing key to derive addresses using @chainsafe/webzjs-wallet library

    console.log('[Zcash Snap] Getting viewing key from snap...')
    let viewingKey: string | null = null
    let zcashAddress: string | null = null

    try {
      const viewingKeyResult = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'getViewingKey'
          }
        }
      })

      console.log('[Zcash Snap] Viewing key result:', viewingKeyResult)

      if (viewingKeyResult) {
        if (typeof viewingKeyResult === 'string') {
          viewingKey = viewingKeyResult
        } else if (typeof viewingKeyResult === 'object') {
          // Try different possible fields
          viewingKey =
            (viewingKeyResult as any).viewingKey ||
            (viewingKeyResult as any).key ||
            (viewingKeyResult as any).vk ||
            (viewingKeyResult as any).value
        }
      }

      if (!viewingKey) {
        throw new Error('Failed to retrieve viewing key from snap')
      }

      console.log('[Zcash Snap] ✅ Viewing key retrieved successfully')

      // TODO: Derive address from viewing key using @chainsafe/webzjs-wallet
      // For now, we'll use a placeholder that indicates we have the viewing key
      // The actual address derivation requires the WebZjs library
      // This is a temporary solution until we integrate the full WebZjs wallet library

      // Check if we can get address from snap state
      try {
        const snapState = await ethereum.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId,
            request: {
              method: 'getSnapStete' // Note: typo in snap source code
            }
          }
        })
        console.log('[Zcash Snap] Snap state:', snapState)

        // The snap state might contain address information
        if (snapState && typeof snapState === 'object') {
          const state = snapState as any
          // Try to find address in state
          zcashAddress =
            state.address || state.unifiedAddress || state.transparentAddress
        }
      } catch (stateError) {
        console.log('[Zcash Snap] Could not get snap state:', stateError)
      }

      // If we still don't have an address, we need to derive it from the viewing key
      // This requires the @chainsafe/webzjs-wallet library
      if (!zcashAddress) {
        console.warn(
          '[Zcash Snap] ⚠️ Address not available from snap. ' +
            'The snap only provides viewing keys. ' +
            'To get addresses, we need to integrate @chainsafe/webzjs-wallet library. ' +
            'Using viewing key as identifier for now.'
        )
        // Use viewing key hash or fingerprint as a temporary identifier
        // In production, this should be replaced with proper address derivation
        zcashAddress = `viewing-key-${viewingKey.slice(0, 16)}...`
      }
    } catch (error: any) {
      console.error('[Zcash Snap] Error getting viewing key:', error)

      // Check if it's a permission/origin error
      const errorMessage = error?.message || ''
      const errorCode = error?.code
      console.log('[Zcash Snap] Error message:', errorMessage)
      console.log('[Zcash Snap] Error code:', errorCode)
      console.log('actual error:::', error)

      if (
        errorCode === -32603 &&
        (errorMessage.includes('not permitted') ||
          errorMessage.includes('allowedOrigins') ||
          errorMessage.includes('origin'))
      ) {
        throw new Error(
          `The Zcash Snap can only be used from https://webzjs.chainsafe.dev. ` +
            `Please ensure you're accessing the application from the correct domain.`
        )
      }

      throw new Error(
        `Failed to retrieve viewing key from snap: ${
          errorMessage || 'Unknown error'
        }. ` +
          `Please ensure the Zcash Shielded Wallet Snap is properly installed and configured.`
      )
    }

    // Validate we have some identifier (viewing key or address)
    if (!viewingKey && !zcashAddress) {
      throw new Error(
        'Failed to retrieve Zcash viewing key or address from snap. ' +
          'Please ensure the Zcash Shielded Wallet Snap is properly installed and configured.'
      )
    }

    return {
      address: zcashAddress,
      walletType: 'metamask',
      provider: ethereum
    }
  } catch (error: any) {
    // Provide helpful error messages
    if (
      error?.message?.includes('does not exist') ||
      error?.message?.includes('not available') ||
      error?.code === -32601
    ) {
      throw new Error(
        'MetaMask Snaps are not enabled. Please update MetaMask and enable Snaps in Settings > Advanced > Experimental Features.'
      )
    }
    console.error('Zcash wallet (MetaMask) connection error:', error)
    throw error
  }
}

/**
 * Connect to Brave Wallet (if using Brave browser)
 * BETA: Some features may not work properly
 */
export async function connectZcashWalletBrave (): Promise<ZcashWallet> {
  try {
    // Check if Brave Wallet is available
    if (!(window as any).braveSolana && !(window as any).ethereum) {
      throw new Error(
        'Brave Wallet not detected. Please use Brave browser with Brave Wallet enabled.'
      )
    }

    const ethereum = (window as any).ethereum

    // Request account access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('Failed to connect to Brave Wallet')
    }

    // BETA: Brave Wallet Zcash support is experimental
    // This may not return a proper Zcash address
    return {
      address: accounts[0],
      walletType: 'brave',
      provider: ethereum
    }
  } catch (error) {
    console.error('Zcash wallet (Brave) connection error:', error)
    throw error
  }
}

/**
 * Connect to Klever Wallet
 * BETA: Some features may not work properly
 */
export async function connectZcashWalletKlever (): Promise<ZcashWallet> {
  try {
    // Check if Klever Wallet is installed
    if (!(window as any).klever) {
      throw new Error(
        'Klever Wallet not detected. Please install the Klever Wallet extension.'
      )
    }

    const klever = (window as any).klever

    // Request connection
    const result = await klever.connect()
    if (!result || !result.address) {
      throw new Error('Failed to connect to Klever Wallet')
    }

    // BETA: Klever Wallet Zcash support is experimental
    return {
      address: result.address,
      walletType: 'klever',
      provider: klever
    }
  } catch (error) {
    console.error('Zcash wallet (Klever) connection error:', error)
    throw error
  }
}

/**
 * Main Zcash wallet connection function
 */
export async function connectZcashWallet (
  walletType: ZcashWalletType
): Promise<ZcashWallet> {
  switch (walletType) {
    case 'metamask':
      return connectZcashWalletMetamask()
    case 'brave':
      return connectZcashWalletBrave()
    case 'klever':
      return connectZcashWalletKlever()
    default:
      throw new Error(`Unsupported Zcash wallet type: ${walletType}`)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function disconnectWallet (): Promise<void> {
  try {
    // Clear the wallet state - actual disconnection handled by wallet extension
    console.log('Wallet state cleared')
  } catch (error) {
    console.error('Wallet disconnection error:', error)
  }
}

/**
 * Check if a wallet extension is installed
 * For Starknet wallets, this is async and needs to check available wallets
 */
export async function isWalletInstalled (
  chain: 'starknet' | 'zcash',
  walletType?: string
): Promise<boolean> {
  if (chain === 'starknet' && walletType) {
    try {
      const starknet = getStarknet()
      const availableWallets = await starknet.getAvailableWallets()
      const walletId = getWalletId(walletType as StarknetWalletType)
      return availableWallets.some(wallet => wallet.id === walletId)
    } catch (error) {
      console.error('Error checking Starknet wallet:', error)
      return false
    }
  }

  if (chain === 'starknet') {
    // Generic check - at least one wallet is available
    return !!(window as any)?.starknet
  }

  if (chain === 'zcash') {
    switch (walletType) {
      case 'metamask':
        return !!(window as any).ethereum?.isMetaMask
      case 'brave':
        return (
          !!(window as any).braveSolana ||
          !!(window as any).ethereum?.isBraveWallet
        )
      case 'klever':
        return !!(window as any).klever
      default:
        return false
    }
  }

  return false
}

/**
 * Synchronous check for wallet availability (for initial render)
 * Returns true if any Starknet wallet is available
 * Safe for SSR - returns false if window is not defined
 */
export function isWalletInstalledSync (
  chain: 'starknet' | 'zcash',
  walletType?: string
): boolean {
  // Guard against SSR - window doesn't exist on server
  if (typeof window === 'undefined') {
    return false
  }

  if (chain === 'starknet') {
    return !!(window as any)?.starknet
  }

  if (chain === 'zcash') {
    switch (walletType) {
      case 'metamask':
        return !!(window as any).ethereum?.isMetaMask
      case 'brave':
        return (
          !!(window as any).braveSolana ||
          !!(window as any).ethereum?.isBraveWallet
        )
      case 'klever':
        return !!(window as any).klever
      default:
        return false
    }
  }

  return false
}
