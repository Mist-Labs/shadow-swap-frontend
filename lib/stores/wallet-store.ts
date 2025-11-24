import { create } from 'zustand'
import { AccountInterface } from 'starknet'

export type StarknetWalletType = 'argentx' | 'braavos' | 'cartridge'
export type ZcashWalletType = 'metamask' | 'brave' | 'klever'

export interface StarknetWallet {
  account: AccountInterface
  address: string
  walletType: StarknetWalletType
}

export interface ZcashWallet {
  address: string // Shielded or transparent address
  walletType: ZcashWalletType
  provider: any // Wallet provider instance
}

interface WalletState {
  // Starknet wallet
  starknetAccount: AccountInterface | null
  starknetAddress: string | null
  starknetWalletType: StarknetWalletType | null
  isStarknetConnected: boolean

  // Zcash wallet
  zcashWallet: ZcashWallet | null
  isZcashConnected: boolean

  // Connection state
  isConnecting: boolean
  connectingChain: 'starknet' | 'zcash' | null

  // Actions
  setStarknetWallet: (wallet: StarknetWallet | null) => void
  setZcashWallet: (wallet: ZcashWallet | null) => void
  setIsConnecting: (
    isConnecting: boolean,
    chain?: 'starknet' | 'zcash' | null
  ) => void
  disconnectStarknet: () => void
  disconnectZcash: () => void
  disconnectAll: () => void
}

export const useWalletStore = create<WalletState>(set => ({
  // Starknet state
  starknetAccount: null,
  starknetAddress: null,
  starknetWalletType: null,
  isStarknetConnected: false,

  // Zcash state
  zcashWallet: null,
  isZcashConnected: false,

  // Connection state
  isConnecting: false,
  connectingChain: null,

  // Actions
  setStarknetWallet: wallet => {
    set({
      starknetAccount: wallet?.account || null,
      starknetAddress: wallet?.address || null,
      starknetWalletType: wallet?.walletType || null,
      isStarknetConnected: !!wallet,
      isConnecting: false,
      connectingChain: null
    })
    // Fetch balances when wallet connects
    if (wallet) {
      import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
        useBalanceStore.getState().fetchBalances()
      })
    } else {
      import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
        useBalanceStore.getState().clearBalances()
      })
    }
  },
  setZcashWallet: wallet => {
    set({
      zcashWallet: wallet,
      isZcashConnected: !!wallet,
      isConnecting: false,
      connectingChain: null
    })
    // Fetch balances when wallet connects
    if (wallet) {
      import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
        useBalanceStore.getState().fetchBalances()
      })
    } else {
      import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
        useBalanceStore.getState().clearBalances()
      })
    }
  },
  setIsConnecting: (isConnecting, chain = null) =>
    set({ isConnecting, connectingChain: chain }),
  disconnectStarknet: () => {
    set({
      starknetAccount: null,
      starknetAddress: null,
      starknetWalletType: null,
      isStarknetConnected: false
    })
    import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
      useBalanceStore.getState().clearBalances()
    })
  },
  disconnectZcash: () => {
    set({
      zcashWallet: null,
      isZcashConnected: false
    })
    import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
      useBalanceStore.getState().clearBalances()
    })
  },
  disconnectAll: () => {
    set({
      starknetAccount: null,
      starknetAddress: null,
      starknetWalletType: null,
      isStarknetConnected: false,
      zcashWallet: null,
      isZcashConnected: false
    })
    import('@/lib/stores/balance-store').then(({ useBalanceStore }) => {
      useBalanceStore.getState().clearBalances()
    })
  }
}))
