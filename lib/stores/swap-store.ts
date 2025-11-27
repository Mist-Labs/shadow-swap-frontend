import { create } from 'zustand'
import type { Token } from '@/lib/constants/tokens'
import { useWalletStore } from './wallet-store'
import { executeSwap, monitorSwap } from '@/lib/services/swap'
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
    const { starknetWallet } = walletState
    
    if (!starknetWallet || !starknetWallet.account || !starknetWallet.address) {
      set({ error: 'Starknet wallet not connected' })
      return
    }
    
    try {
      set({ isSwapping: true, swapStatus: 'approving', error: null })
      
      // Determine swap direction
      let swapDirection: 'starknet_to_zcash' | 'zcash_to_starknet' | 'starknet_internal'
      
      if (tokenIn.chain === 'zcash' && tokenOut.chain === 'starknet') {
        swapDirection = 'zcash_to_starknet'
      } else if (tokenIn.chain === 'starknet' && tokenOut.chain === 'zcash') {
        swapDirection = 'starknet_to_zcash'
      } else {
        swapDirection = 'starknet_internal'
      }
      
      // Execute the swap
      const result = await executeSwap({
        fromToken: tokenIn.symbol as 'STRK' | 'VEIL' | 'ZEC',
        toToken: tokenOut.symbol as 'STRK' | 'VEIL' | 'ZEC',
        amount: amountIn,
        userAddress: starknetWallet.address,
        account: starknetWallet.account as Account,
        swapDirection
      })
      
      set({ 
        swapId: result.swapId,
        swapStatus: 'monitoring'
      })
      
      // Monitor swap status
      monitorSwap(result.swapId, (status) => {
        console.log('[SwapStore] Swap status update:', status)
        
        if (status.data.status === 'redeemed') {
          set({ swapStatus: 'completed', isSwapping: false })
          // Refresh balances
          // TODO: Trigger balance refresh
        } else if (status.data.status === 'failed' || status.data.status === 'refunded') {
          set({ 
            swapStatus: 'failed', 
            isSwapping: false,
            error: `Swap ${status.data.status}`
          })
        }
      })
      
    } catch (error: any) {
      console.error('[SwapStore] Swap error:', error)
      set({ 
        isSwapping: false, 
        swapStatus: 'failed',
        error: error.message || 'Swap failed'
      })
    }
  },
  
  resetSwap: () => set({
    isSwapping: false,
    swapStatus: 'idle',
    swapId: null,
    error: null,
    amountIn: '',
    amountOut: ''
  })
}))
