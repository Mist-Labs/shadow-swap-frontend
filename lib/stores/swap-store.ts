import { create } from 'zustand';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

interface SwapState {
  tokenIn: Token | null;
  tokenOut: Token | null;
  amountIn: string;
  amountOut: string;
  slippage: number;
  isSwapping: boolean;
  setTokenIn: (token: Token | null) => void;
  setTokenOut: (token: Token | null) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  setIsSwapping: (isSwapping: boolean) => void;
  swapTokens: () => void;
}

export const useSwapStore = create<SwapState>((set, get) => ({
  tokenIn: null,
  tokenOut: null,
  amountIn: '',
  amountOut: '',
  slippage: 0.5,
  isSwapping: false,
  setTokenIn: (token) => set({ tokenIn: token }),
  setTokenOut: (token) => set({ tokenOut: token }),
  setAmountIn: (amount) => set({ amountIn: amount }),
  setAmountOut: (amount) => set({ amountOut: amount }),
  setSlippage: (slippage) => set({ slippage }),
  setIsSwapping: (isSwapping) => set({ isSwapping }),
  swapTokens: () => {
    const state = get();
    set({ tokenIn: state.tokenOut, tokenOut: state.tokenIn });
  },
}));

