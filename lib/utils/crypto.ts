/**
 * Cryptographic utilities for Shadow Swap
 * Handles commitment generation, hash locks, and secrets
 */

import { hash } from 'starknet'

/**
 * Generate a random 32-byte value
 */
export function generateRandom32Bytes(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return '0x' + Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate SHA256 hash (for hash_lock - cross-chain compatibility)
 */
export async function sha256(data: string): Promise<string> {
  // Remove 0x prefix if present
  const cleanData = data.startsWith('0x') ? data.slice(2) : data
  
  // Convert hex string to bytes
  const bytes = new Uint8Array(
    cleanData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  )
  
  // Hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  
  // Convert to hex string (no 0x prefix for cross-chain compatibility)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate Poseidon hash commitment for Starknet
 * commitment = PoseidonHash(amount, blinding_factor)
 */
export function generateCommitment(amount: string, blindingFactor: string): string {
  // Use Starknet's Poseidon hash
  // Note: This is a simplified version - you may need to adjust based on your contract's implementation
  return hash.computePoseidonHashOnElements([amount, blindingFactor])
}

/**
 * Generate all privacy parameters for a swap
 */
export async function generateSwapParameters(amount: string): Promise<{
  secret: string
  blindingFactor: string
  commitment: string
  hashLock: string
}> {
  const secret = generateRandom32Bytes()
  const blindingFactor = generateRandom32Bytes()
  const commitment = generateCommitment(amount, blindingFactor)
  const hashLock = await sha256(secret)
  
  return {
    secret,
    blindingFactor,
    commitment,
    hashLock,
  }
}

/**
 * Verify a secret matches a hash lock
 */
export async function verifySecret(secret: string, hashLock: string): Promise<boolean> {
  const computedHash = await sha256(secret)
  return computedHash === hashLock
}

/**
 * Convert amount to wei (18 decimals)
 */
export function toWei(amount: string | number): string {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount
  const [whole, decimal = ''] = amountStr.split('.')
  
  // Pad decimals to 18 places
  const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18)
  
  return (whole + paddedDecimal).replace(/^0+/, '') || '0'
}

/**
 * Convert wei to human-readable amount
 */
export function fromWei(wei: string, decimals: number = 18): string {
  const weiStr = wei.padStart(decimals + 1, '0')
  const whole = weiStr.slice(0, -decimals) || '0'
  const decimal = weiStr.slice(-decimals)
  
  // Remove trailing zeros
  const trimmedDecimal = decimal.replace(/0+$/, '')
  
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole
}

