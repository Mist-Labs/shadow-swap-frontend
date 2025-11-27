export type TokenChain = 'starknet' | 'zcash'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chain: TokenChain
  logoUrl?: string
  isPrivate?: boolean // For Zcash and privacy tokens
}

// Supported tokens for Shadow Swap
export const TOKENS: Token[] = [
  // Starknet tokens
  {
    address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    symbol: 'STRK',
    name: 'Starknet Token',
    decimals: 18,
    chain: 'starknet',
    logoUrl: '/tokens/strk.svg'
  },
  {
    address: '0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1',
    symbol: 'VEIL',
    name: 'Veil Token',
    decimals: 18,
    chain: 'starknet',
    logoUrl: '/tokens/veil.svg'
  },
  // Zcash (cross-chain)
  {
    address: 'zcash',
    symbol: 'ZEC',
    name: 'Zcash',
    decimals: 8,
    chain: 'zcash',
    isPrivate: true,
    logoUrl: '/tokens/zec.svg'
  }
]

// Default tokens for Swap page (Starknet-only)
export const DEFAULT_TOKEN_IN = TOKENS[0] // STRK
export const DEFAULT_TOKEN_OUT = TOKENS[1] // VEIL

// Note: Swap page is for STRK ↔ VEIL only
// Bridge page is for STRK/VEIL ↔ ZEC cross-chain

// Privacy tokens
export const PRIVACY_TOKENS = TOKENS.filter(token => token.isPrivate)
