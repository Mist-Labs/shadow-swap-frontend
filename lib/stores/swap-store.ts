import { create } from 'zustand'
import type { Token } from '@/lib/constants/tokens'
import { useWalletStore } from './wallet-store'
import { executeSwap, monitorSwap } from '@/lib/services/swap'
import { useTransactionStore } from './transaction-store'
import { Account } from 'starknet'

interface SwapState {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  slippage: number
  isSwapping: boolean
  swapStatus: 'idle' | 'approving' | 'depositing' | 'initiating' | 'monitoring' | 'completed' | 'failed'
  swapId: string | null
  txHash: string | null
  currentStatus: string | null // Current swap status from API (initiated, locked, redeemed, etc.)
  error: string | null
  setTokenIn: (token: Token | null) => void
  setTokenOut: (token: Token | null) => void
  setAmountIn: (amount: string) => void
  setAmountOut: (amount: string) => void
  setSlippage: (slippage: number) => void
  setIsSwapping: (isSwapping: boolean) => void
  swapTokens: () => Promise<void>
  resetSwap: () => void
}

export const useSwapStore = create<SwapState>((set, get) => ({
  tokenIn: null,
  tokenOut: null,
  amountIn: '',
  amountOut: '',
  slippage: 0.5,
  isSwapping: false,
  swapStatus: 'idle',
  swapId: null,
  txHash: null,
  currentStatus: null,
  error: null,
  
  setTokenIn: token => set({ tokenIn: token }),
  setTokenOut: token => set({ tokenOut: token }),
  setAmountIn: amount => set({ amountIn: amount }),
  setAmountOut: amount => set({ amountOut: amount }),
  setSlippage: slippage => set({ slippage }),
  setIsSwapping: isSwapping => set({ isSwapping }),
  
  swapTokens: async () => {
    const state = get()
    const { tokenIn, tokenOut, amountIn } = state
    
    if (!tokenIn || !tokenOut || !amountIn) {
      set({ error: 'Missing required swap parameters' })
      return
    }
    
    // Get wallet state
    const walletState = useWalletStore.getState()
    const { starknetAccount, starknetAddress } = walletState
    
    if (!starknetAccount || !starknetAddress) {
      set({ error: 'Starknet wallet not connected' })
      return
    }
    
    try {
      set({ isSwapping: true, swapStatus: 'approving', error: null, currentStatus: null })
      
      // Determine swap direction
      let swapDirection: 'starknet_to_zcash' | 'zcash_to_starknet' | 'starknet_internal'
      
      if (tokenIn.chain === 'zcash' && tokenOut.chain === 'starknet') {
        swapDirection = 'zcash_to_starknet'
      } else if (tokenIn.chain === 'starknet' && tokenOut.chain === 'zcash') {
        swapDirection = 'starknet_to_zcash'
      } else {
        swapDirection = 'starknet_internal'
      }
      
      // Execute the swap - always uses real smart contract calls
      // Only backend API calls are mocked (handled in relayer.ts)
      set({ swapStatus: 'approving' })
      
      const result = await executeSwap({
        fromToken: tokenIn.symbol as 'STRK' | 'VEIL' | 'ZEC',
        toToken: tokenOut.symbol as 'STRK' | 'VEIL' | 'ZEC',
        amount: amountIn,
        userAddress: starknetAddress,
        account: starknetAccount as Account,
        swapDirection,
        onStatusUpdate: (status) => {
          set({ swapStatus: status })
        }
      })
      
      set({ 
        swapId: result.swapId,
        txHash: result.txHash,
        swapStatus: 'monitoring',
        currentStatus: 'initiated'
      })
      
      // Monitor swap status
      monitorSwap(result.swapId, (status) => {
        console.log('[SwapStore] Swap status update:', status)
        
        const apiStatus = status.data.status
        set({ currentStatus: apiStatus })
        
        if (apiStatus === 'redeemed') {
          set({ 
            swapStatus: 'completed', 
            isSwapping: false,
            currentStatus: 'redeemed'
          })
          
          // Update transaction status
          if (get().swapId) {
            useTransactionStore.getState().updateTransaction(
              get().swapId!,
              { status: 'completed' }
            )
          }
          
          // Refresh balances
          import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
            useBalanceStore.getState().fetchBalances()
          })
        } else if (apiStatus === 'failed' || apiStatus === 'refunded') {
          set({ 
            swapStatus: 'failed', 
            isSwapping: false,
            currentStatus: apiStatus,
            error: `Swap ${apiStatus}`
          })
        } else if (apiStatus === 'locked') {
          // Update status for locked
          set({ currentStatus: 'locked' })
          // Update transaction status
          if (get().swapId) {
            useTransactionStore.getState().updateTransaction(
              get().swapId!,
              { status: 'pending' } // Still pending until redeemed
            )
          }
        } else {
          // Update status for initiated, etc.
          set({ currentStatus: apiStatus })
        }
      })
      
    } catch (error: any) {
      console.error('[SwapStore] Swap error:', error)
      set({ 
        isSwapping: false, 
        swapStatus: 'failed',
        error: error.message || 'Swap failed'
      })
      
      // Update transaction status if we have a swapId
      if (get().swapId) {
        useTransactionStore.getState().updateTransaction(
          get().swapId!,
          { status: 'failed' }
        )
      }
    }
  },
  
  resetSwap: () => set({
    isSwapping: false,
    swapStatus: 'idle',
    swapId: null,
    txHash: null,
    currentStatus: null,
    error: null,
    amountIn: '',
    amountOut: ''
  })
}))
