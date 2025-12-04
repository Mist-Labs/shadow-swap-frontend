/**
 * Mock Backend Configuration
 * Used when backend is not yet implemented
 * Mocks return responses per API documentation
 */

// Mock wallet address for Starknet
export const MOCK_STARKNET_ADDRESS = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

// Mock balances (in wei/smallest unit)
export const MOCK_BALANCES = {
  // STRK token (18 decimals)
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d': '5000000000000000000000', // 5000 STRK
  // VEIL token (18 decimals)
  '0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1': '2500000000000000000000', // 2500 VEIL
  // ETH (18 decimals)
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': '1000000000000000000', // 1 ETH
  // ZEC (8 decimals)
  'zcash': '50000000000' // 500 ZEC
}

// Simulation delays (in milliseconds)
export const SIMULATION_DELAYS = {
  WALLET_CONNECT: 500,
  BALANCE_FETCH: 300,
  APPROVE: 2000,
  DEPOSIT: 3000,
  SWAP_INITIATE: 1000,
  STATUS_UPDATE: 2000
}

// Mock swap IDs
let swapIdCounter = 1
export function generateMockSwapId(): string {
  return `swap_${Date.now()}_${swapIdCounter++}`
}

// Mock transaction hashes
export function generateMockTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
}

