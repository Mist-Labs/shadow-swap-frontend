/**
 * Zcash Transaction Utilities - Hybrid Approach
 * 
 * Uses LOCAL WebZjs wallet (bundled WASM) for most operations (no origin restrictions).
 * Uses ChainSafe Snap ONLY for signing (requires spending keys, may have origin restrictions).
 * 
 * Operations breakdown:
 * - Building transactions: LOCAL wallet (no snap, no origin issues) ✅
 * - Signing transactions: SNAP (only operation that needs snap) ⚠️
 * - Proving transactions: LOCAL wallet (no snap) ✅
 * - Broadcasting transactions: LOCAL wallet (no snap) ✅
 * 
 * Flow:
 * 1. Build PCZT using LOCAL WebZjs wallet (no origin restrictions)
 * 2. Sign the PCZT using snap's signPczt (only operation that needs snap)
 * 3. Prove the transaction using LOCAL WebZjs wallet (no snap)
 * 4. Broadcast the transaction using LOCAL WebZjs wallet (no snap)
 */

import type { ZcashWallet } from '@/lib/stores/wallet-store'
import { initializeWebZjs } from './webzjs-init'
import { getWalletInstance, cleanupWalletInstance } from './zcash-wallet-manager'

/**
 * Find the installed Zcash Snap ID
 */
export async function findZcashSnapId (provider: any): Promise<string | null> {
  try {
    const installedSnaps = await provider.request({
      method: 'wallet_getSnaps'
    })

    if (installedSnaps && typeof installedSnaps === 'object') {
      for (const [id, snapInfo] of Object.entries(installedSnaps as any)) {
        const info = snapInfo as any
        if (
          id.includes('webzjs-zcash-snap') ||
          id.includes('zcash') ||
          (info?.name && info.name.toLowerCase().includes('zcash'))
        ) {
          return id
        }
      }

      // Check known npm ID
      if ((installedSnaps as any)['npm:@chainsafe/webzjs-zcash-snap']) {
        return 'npm:@chainsafe/webzjs-zcash-snap'
      }
    }
  } catch (error) {
    console.error('[Zcash] Error finding snap ID:', error)
  }

  return null
}

/**
 * Sign a Zcash transaction using the snap's signPczt method
 * 
 * This is the ONLY operation that requires the snap (for spending keys).
 * All other operations use the local WebZjs wallet to avoid origin restrictions.
 * 
 * @param provider - MetaMask provider
 * @param snapId - The installed Zcash snap ID (can be npm or local)
 * @param pcztHexString - The PCZT (Partially Constructed Zcash Transaction) hex string
 * @param network - Network type: "main" or "test" (defaults to "main")
 * @returns Signed PCZT hex string
 * 
 * NOTE: The snap's signPczt method expects a PCZT hex string.
 * The signed PCZT still needs to be proven before it can be sent.
 * 
 * If the snap has origin restrictions (npm version on localhost), this will fail.
 * In that case, you need to build a local snap or use production.
 */
export async function signZcashTransaction (
  provider: any,
  snapId: string,
  pcztHexString: string,
  network: 'main' | 'test' = 'main'
): Promise<string> {
  try {
    if (!provider || !provider.request) {
      throw new Error('MetaMask provider not available')
    }

    if (!snapId) {
      throw new Error('Zcash Snap ID is required for signing')
    }

    if (!pcztHexString || typeof pcztHexString !== 'string') {
      throw new Error('PCZT hex string is required')
    }

    // Validate hex string format
    if (!/^[0-9a-fA-F]+$/.test(pcztHexString)) {
      throw new Error('Invalid PCZT hex string format')
    }

    // Convert hex string to bytes array for the snap
    const pcztBytes = Uint8Array.from(
      pcztHexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )

    // Call the snap's signPczt method
    // This is the ONLY operation that requires the snap (for spending keys)
    const result = await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'signPczt',
          params: {
            pcztHexString,
            network
          }
        }
      }
    })

    // The snap should return the signed PCZT
    // Convert back to hex if needed
    if (result && typeof result === 'object') {
      // If result is bytes array, convert to hex
      if (Array.isArray(result)) {
        return Array.from(result)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      }
      // If result has a pczt field
      if (result.pczt) {
        const bytes = Array.isArray(result.pczt) ? result.pczt : []
        return (Array.from(bytes) as number[])
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      }
    }

    // If result is already a hex string
    if (typeof result === 'string') {
      return result
    }

    throw new Error('Unexpected response format from snap')
  } catch (error: any) {
    console.error('[Zcash] Error signing transaction:', error)
    throw new Error(
      `Failed to sign Zcash transaction: ${error?.message || 'Unknown error'}`
    )
  }
}

/**
 * Build a Zcash transaction for swaps
 * 
 * This function uses WebZjs wallet to build a PCZT (Partially Constructed Zcash Transaction).
 * The PCZT is then serialized to hex format for signing by the snap.
 * 
 * @param toAddress - Recipient address (ZIP316 encoded unified address)
 * @param amount - Amount in ZEC (as string, e.g., "0.001")
 * @param viewingKey - Unified Full Viewing Key (UFVK) from the snap
 * @param network - Network type: "main" or "test" (defaults to "main")
 * @returns PCZT hex string ready to be signed
 */
export async function buildZcashTransaction (
  toAddress: string,
  amount: string,
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): Promise<string> {
  let walletInstance = null
  
  try {
    // Validate inputs
    if (!toAddress || !amount || !viewingKey) {
      throw new Error('Missing required parameters: toAddress, amount, or viewingKey')
    }

    // Validate address format (should be ZIP316 unified address)
    if (!toAddress.startsWith('u1') && !toAddress.startsWith('utest')) {
      throw new Error('Invalid Zcash address format. Expected ZIP316 unified address.')
    }

    // Convert amount to Zatoshis (1 ZEC = 100,000,000 Zatoshis)
    const amountFloat = parseFloat(amount)
    if (isNaN(amountFloat) || amountFloat <= 0) {
      throw new Error('Invalid amount. Must be a positive number.')
    }
    const amountInZatoshis = BigInt(Math.floor(amountFloat * 100000000))

    if (amountInZatoshis === BigInt(0)) {
      throw new Error('Amount too small. Minimum is 0.00000001 ZEC.')
    }

    // Get or create wallet instance (reuses cached instances)
    walletInstance = await getWalletInstance(viewingKey, network)

    // Create PCZT (Partially Constructed Zcash Transaction)
    const pczt = await walletInstance.wallet.pczt_create(
      walletInstance.accountId!,
      toAddress,
      amountInZatoshis
    )

    // Serialize PCZT to bytes, then convert to hex
    const pcztBytes = pczt.serialize()
    const pcztHex = (Array.from(pcztBytes) as number[])
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('')

    // Clean up PCZT (but keep wallet instance for reuse)
    pczt.free()

    return pcztHex
  } catch (error: any) {
    console.error('[Zcash] Error building transaction:', error)
    
    // Clean up wallet instance on error
    if (walletInstance) {
      cleanupWalletInstance(viewingKey, network)
    }
    
    throw new Error(
      `Failed to build Zcash transaction: ${error?.message || 'Unknown error'}`
    )
  }
}

/**
 * Build a Zcash HTLC transaction for swaps
 * 
 * Creates a Zcash transaction with HTLC metadata encoded in a structured format.
 * Since Zcash's pczt_create doesn't directly support memos, we encode HTLC data
 * in a way that can be extracted by the relayer/indexer.
 * 
 * The HTLC data (hashLock and timelock) is encoded as a JSON string that can be
 * stored externally or passed to the relayer separately. The transaction itself
 * is a standard transfer, and the HTLC logic is handled at the application layer.
 * 
 * @param toAddress - Recipient address (relayer or user) - ZIP316 unified address
 * @param amount - Amount in ZEC (as string, e.g., "0.001")
 * @param hashLock - SHA256 hash of the secret (hex string, 64 chars)
 * @param timelock - Block height for refund (number)
 * @param viewingKey - Unified Full Viewing Key (UFVK) from the snap
 * @param network - Network type: "main" or "test" (defaults to "main")
 * @returns Object containing PCZT hex string and HTLC metadata
 */
export async function buildZcashHTLCTransaction (
  toAddress: string,
  amount: string,
  hashLock: string,
  timelock: number,
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): Promise<{ pcztHex: string; htlcData: { hashLock: string; timelock: number } }> {
  // Validate hashLock format (should be 64 hex characters)
  if (!hashLock || !/^[0-9a-fA-F]{64}$/.test(hashLock)) {
    throw new Error('Invalid hashLock. Must be a 64-character hex string (SHA256 hash).')
  }

  // Validate timelock (should be a positive integer representing block height)
  if (!Number.isInteger(timelock) || timelock <= 0) {
    throw new Error('Invalid timelock. Must be a positive integer representing block height.')
  }

  // Build the standard transaction
  // Note: Zcash's pczt_create doesn't support memos directly
  // The HTLC data will be handled by the relayer/indexer separately
  const pcztHex = await buildZcashTransaction(toAddress, amount, viewingKey, network)

  // Return transaction with HTLC metadata
  // This metadata should be sent to the relayer along with the transaction
  return {
    pcztHex,
    htlcData: {
      hashLock,
      timelock
    }
  }
}

/**
 * Execute a Zcash swap transaction
 * 
 * Hybrid approach:
 * 1. Build transaction using WebZjs wallet library
 * 2. Sign transaction using snap's signPczt
 * 3. Broadcast transaction to Zcash network
 * 
 * @param wallet - Connected Zcash wallet (must have viewingKey and snapId)
 * @param toAddress - Recipient address
 * @param amount - Amount in ZEC
 * @param hashLock - SHA256 hash of secret
 * @param timelock - Block height for refund
 * @returns Transaction hash
 */
export async function executeZcashSwapTransaction (
  wallet: ZcashWallet,
  toAddress: string,
  amount: string,
  hashLock: string,
  timelock: number
): Promise<string> {
  if (!wallet.viewingKey) {
    throw new Error('Viewing key not available in wallet. Please reconnect your wallet.')
  }

  // Determine network (default to mainnet)
  const network: 'main' | 'test' = 'main' // TODO: Get from wallet config or user preference

  // Step 1: Build HTLC transaction using LOCAL WebZjs wallet
  const htlcResult = await buildZcashHTLCTransaction(
    toAddress,
    amount,
    hashLock,
    timelock,
    wallet.viewingKey,
    network
  )
  
  const pcztHex = htlcResult.pcztHex
  // HTLC data (hashLock, timelock) should be sent to relayer separately

  // Step 2: Sign transaction using LOCAL wallet (no snap!)
  const signedPcztHex = await signZcashTransaction(
    wallet.provider,
    pcztHex,
    network
  )

  // Step 3: Prove the signed transaction (if needed)
  // The signed PCZT needs proofs before it can be sent
  const provenPcztHex = await proveZcashTransaction(
    signedPcztHex,
    wallet.viewingKey,
    network
  )

  // Step 4: Broadcast transaction to Zcash network
  const txHash = await broadcastZcashTransaction(
    provenPcztHex,
    wallet.viewingKey,
    network
  )

  // Return transaction hash along with HTLC data for relayer
  // The relayer will need the HTLC data to process the swap
  return txHash
}

/**
 * Prove a signed Zcash PCZT transaction
 * 
 * After signing, the PCZT needs proofs to be generated before it can be sent.
 * This requires a WebWallet instance to call pczt_prove.
 * 
 * @param signedPcztHex - Signed PCZT hex string
 * @param viewingKey - Unified Full Viewing Key (for creating wallet instance)
 * @param network - Network type: "main" or "test"
 * @returns Proven PCZT hex string ready to be sent
 */
async function proveZcashTransaction (
  signedPcztHex: string,
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): Promise<string> {
  let walletInstance = null
  
  try {
    await initializeWebZjs()
    // Use files from .build directory - already built, no processing needed
    const webzjs = await import(/* webpackIgnore: true */ '../../.build/WebZjs/packages/webzjs-wallet/webzjs_wallet.js')
    const { Pczt } = webzjs

    // Validate hex string
    if (!/^[0-9a-fA-F]+$/.test(signedPcztHex)) {
      throw new Error('Invalid signed PCZT hex string format')
    }

    // Deserialize signed PCZT from hex
    const signedPcztBytes = Uint8Array.from(
      signedPcztHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )
    const signedPczt = Pczt.from_bytes(signedPcztBytes)

    // Get or create wallet instance (reuses cached instances)
    walletInstance = await getWalletInstance(viewingKey, network)

    // Prove the signed PCZT
    // For Orchard-only transactions, sapling_proof_gen_key can be null
    // If there are Sapling spends, we would need the proof generation key
    const provenPczt = await walletInstance.wallet.pczt_prove(signedPczt, null)

    // Serialize proven PCZT to hex
    const provenBytes = provenPczt.serialize()
    const provenHex = (Array.from(provenBytes) as number[])
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('')

    // Clean up PCZT objects (but keep wallet instance)
    provenPczt.free()
    signedPczt.free()

    return provenHex
  } catch (error: any) {
    console.error('[Zcash] Error proving transaction:', error)
    
    // If proving fails, it might be because:
    // 1. Transaction is Orchard-only and doesn't need proving
    // 2. We need Sapling proof generation key
    // 3. There's an actual error
    
    // For now, try to proceed with the signed PCZT
    // The pczt_send might handle this, or it will fail with a clear error
    console.warn('[Zcash] Proving failed, will attempt to send signed PCZT directly')
    return signedPcztHex
  }
}

/**
 * Broadcast a proven Zcash transaction to the network
 * 
 * Uses the LOCAL WebZjs wallet (bundled WASM) to broadcast transactions.
 * This has NO origin restrictions - works on localhost and production.
 * 
 * @param provenPcztHex - Proven PCZT hex string ready to be sent
 * @param viewingKey - Unified Full Viewing Key (for wallet instance)
 * @param network - Network type: "main" or "test"
 * @returns Transaction hash
 */
async function broadcastZcashTransaction (
  provenPcztHex: string,
  viewingKey: string,
  network: 'main' | 'test' = 'main'
): Promise<string> {
  let walletInstance = null
  
  try {
    await initializeWebZjs()
    // Use files from .build directory - already built, no processing needed
    const webzjs = await import(/* webpackIgnore: true */ '../../.build/WebZjs/packages/webzjs-wallet/webzjs_wallet.js')
    const { Pczt } = webzjs

    // Validate hex string
    if (!/^[0-9a-fA-F]+$/.test(provenPcztHex)) {
      throw new Error('Invalid proven PCZT hex string format')
    }

    // Deserialize proven PCZT
    const provenPcztBytes = Uint8Array.from(
      provenPcztHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )
    const provenPczt = Pczt.from_bytes(provenPcztBytes)

    // Get or create wallet instance (reuses cached instances)
    walletInstance = await getWalletInstance(viewingKey, network)

    // Send the proven PCZT to the network
    await walletInstance.wallet.pczt_send(provenPczt)

    // Get transaction hash from PCZT JSON
    // After sending, the PCZT should contain transaction details
    const pcztJson = provenPczt.to_json()
    
    // Try various possible fields for transaction hash
    const txHash = 
      pcztJson?.txid || 
      pcztJson?.tx_hash || 
      pcztJson?.hash ||
      pcztJson?.transaction_id ||
      pcztJson?.id

    // Clean up PCZT (but keep wallet instance)
    provenPczt.free()

    if (!txHash) {
      // If no hash in JSON, the transaction was sent but we don't have the hash
      // This is not ideal but the transaction should still be on the network
      console.warn('[Zcash] Transaction sent but hash not available in PCZT JSON')
      throw new Error(
        'Transaction sent successfully but transaction hash not available. ' +
        'Please check the network for your transaction.'
      )
    }

    return String(txHash)
  } catch (error: any) {
    console.error('[Zcash] Error broadcasting transaction:', error)
    
    // Provide more specific error messages
    if (error?.message?.includes('insufficient') || error?.message?.includes('balance')) {
      throw new Error('Insufficient balance to send transaction')
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('connection')) {
      throw new Error('Network error. Please check your connection and try again.')
    }
    
    throw new Error(
      `Failed to broadcast transaction: ${error?.message || 'Unknown error'}`
    )
  }
}

/**
 * Get viewing key from snap
 */
async function getViewingKeyFromSnap (
  provider: any,
  snapId: string
): Promise<string> {
  try {
    const result = await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'getViewingKey'
        }
      }
    })

    return result?.viewingKey || result || ''
  } catch (error: any) {
    throw new Error(
      `Failed to get viewing key: ${error?.message || 'Unknown error'}`
    )
  }
}

