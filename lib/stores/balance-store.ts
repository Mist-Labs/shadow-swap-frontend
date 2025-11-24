import { create } from 'zustand'
import type { Token } from '@/lib/constants/tokens'
import { TOKENS } from '@/lib/constants/tokens'
import {
  fetchStarknetBalances,
  fetchZcashBalance,
  formatBalance,
  getTokenBalance
} from '@/lib/utils/balances'
import { useWalletStore } from './wallet-store'

interface BalanceState {
  // Token balances: tokenAddress -> balance (raw string)
  balances: Record<string, string>
  isLoading: boolean
  lastUpdated: number | null

  // Actions
  fetchBalances: () => Promise<void>
  getBalance: (token: Token) => string
  getFormattedBalance: (token: Token, precision?: number) => string
  clearBalances: () => void
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
  balances: {},
  isLoading: false,
  lastUpdated: null,

  fetchBalances: async () => {
    const { starknetAccount, zcashWallet } = useWalletStore.getState()

    set({ isLoading: true })

    try {
      const newBalances: Record<string, string> = {}

      // Fetch Starknet balances
      if (starknetAccount) {
        const starknetBalances = await fetchStarknetBalances(starknetAccount)
        Object.assign(newBalances, starknetBalances)
      }

      // Fetch Zcash balance
      if (zcashWallet && zcashWallet.provider) {
        try {
          const zecBalance = await fetchZcashBalance(
            zcashWallet.provider,
            zcashWallet.address
          )
          // Find ZEC token and use its address
          const zecToken = TOKENS.find(
            t => t.symbol === 'ZEC' && t.chain === 'zcash'
          )
          if (zecToken) {
            newBalances[zecToken.address] = zecBalance
          }
        } catch (error) {
          console.error('Error fetching Zcash balance:', error)
        }
      }

      set({
        balances: newBalances,
        isLoading: false,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error('Error fetching balances:', error)
      set({ isLoading: false })
    }
  },

  getBalance: (token: Token) => {
    const { balances } = get()
    return getTokenBalance(balances, token)
  },

  getFormattedBalance: (token: Token, precision: number = 6) => {
    const balance = get().getBalance(token)
    return formatBalance(balance, token.decimals, precision)
  },

  clearBalances: () => {
    set({
      balances: {},
      lastUpdated: null
    })
  }
}))
