import { create } from 'zustand';
import { AccountInterface } from 'starknet';

interface WalletState {
  account: AccountInterface | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletType: 'argentx' | 'braavos' | 'cartridge' | null;
  setAccount: (account: AccountInterface | null, address: string | null, walletType: 'argentx' | 'braavos' | 'cartridge' | null) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  account: null,
  address: null,
  isConnected: false,
  isConnecting: false,
  walletType: null,
  setAccount: (account, address, walletType) =>
    set({
      account,
      address,
      isConnected: !!account,
      walletType,
      isConnecting: false,
    }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  disconnect: () =>
    set({
      account: null,
      address: null,
      isConnected: false,
      walletType: null,
    }),
}));

