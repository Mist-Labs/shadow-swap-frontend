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

// Starknet Mainnet Token Addresses
export const TOKENS: Token[] = [
  {
    address:
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chain: 'starknet',
    logoUrl: '/tokens/eth.svg'
  },
  {
    address:
      '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chain: 'starknet',
    logoUrl: '/tokens/usdc.svg'
  },
  {
    address:
      '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chain: 'starknet',
    logoUrl: '/tokens/usdt.svg'
  },
  {
    address:
      '0x042b8f0484674ca266ac5d08e4ac6a3fe65bd3129795def2dca5c34ecc5f96d2',
    symbol: 'STRK',
    name: 'Starknet Token',
    decimals: 18,
    chain: 'starknet',
    logoUrl: '/tokens/strk.svg'
  },
  {
    address:
      '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chain: 'starknet',
    logoUrl: '/tokens/dai.svg'
  },
  {
    address: 'zs1...', // Zcash shielded address placeholder
    symbol: 'ZEC',
    name: 'Zcash',
    decimals: 8,
    chain: 'zcash',
    isPrivate: true,
    logoUrl: '/tokens/zec.svg'
  }
]

export const DEFAULT_TOKEN_IN = TOKENS[0] // ETH
export const DEFAULT_TOKEN_OUT = TOKENS[1] // USDC

// Privacy tokens
export const PRIVACY_TOKENS = TOKENS.filter(token => token.isPrivate)
