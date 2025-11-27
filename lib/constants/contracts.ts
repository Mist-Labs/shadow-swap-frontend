/**
 * Deployed Smart Contract Addresses
 */

export const CONTRACTS = {
  // Pool contracts
  FAST_POOL: '0x01749627bb08da4f8c3df6c55045ac429abdceada025262d4c51430d643db84e',
  STANDARD_POOL: '0x05cf3a281b3932cb4fec5648558c05fe796bd2d1b6e75554e3306c4849b82ed8',
  
  // Token contracts
  VEIL_TOKEN: '0x02e90f89aecddf3f6b15bd52286a33c743b684fa8c17ed1d7ae57713a81459e1',
  STRK_TOKEN: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
} as const

export const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:8080'
export const HMAC_SECRET = process.env.NEXT_PUBLIC_HMAC_SECRET || ''

