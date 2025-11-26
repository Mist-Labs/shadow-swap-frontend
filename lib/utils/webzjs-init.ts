/**
 * WebZjs WASM Initialization
 * 
 * This module handles initialization of the WebZjs WebAssembly module.
 * Must be called once per page load before using WebZjs wallet functionality.
 */

let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize WebZjs WASM module and thread pool
 * This must be called exactly once per page load
 */
export async function initializeWebZjs (): Promise<void> {
  if (isInitialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // Use runtime path resolution to prevent build-time processing
      // This ensures WASM files are only loaded at runtime, not during build
      if (typeof window === 'undefined') {
        throw new Error('WebZjs can only be initialized in the browser')
      }
      
      // Use files from .build directory - already built, no processing needed
      const webzjsModule = await import(
        /* webpackIgnore: true */
        /* @ts-ignore */
        '../../build/WebZjs/packages/webzjs-wallet/webzjs_wallet.js'
      )
      
      // Initialize WASM module
      if (typeof webzjsModule.default === 'function') {
        await webzjsModule.default()
      }
      
      // Initialize thread pool (use hardware concurrency or default to 4)
      const numThreads = typeof navigator !== 'undefined' 
        ? navigator.hardwareConcurrency || 4 
        : 4
      
      if (typeof webzjsModule.initThreadPool === 'function') {
        await webzjsModule.initThreadPool(numThreads)
      }
      
      isInitialized = true
      console.log('[WebZjs] ✅ Initialized successfully with', numThreads, 'threads')
    } catch (error) {
      console.error('[WebZjs] ❌ Initialization failed:', error)
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * Check if WebZjs is initialized
 */
export function isWebZjsInitialized (): boolean {
  return isInitialized
}

