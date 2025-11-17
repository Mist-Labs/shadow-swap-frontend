import { getStarknet } from 'get-starknet-core'
import type { AccountInterface } from 'starknet'

export type WalletType = 'argentx' | 'braavos' | 'cartridge'

export interface WalletConnection {
  account: AccountInterface
  address: string
  walletType: WalletType
}

export async function connectWallet (
  walletType: WalletType
): Promise<WalletConnection> {
  try {
    // Get the starknet object from window
    const windowStarknet = (window as any)?.starknet

    if (!windowStarknet) {
      throw new Error(
        'No Starknet wallet detected. Please install ArgentX, Braavos, or Cartridge.'
      )
    }

    // Enable/connect the wallet
    const result = await windowStarknet.enable({ showModal: true })

    if (!result || result.length === 0) {
      throw new Error('Failed to connect wallet')
    }

    // Get the account and address
    const address = result[0]
    const account = windowStarknet.account as AccountInterface

    if (!account || !address) {
      throw new Error('Failed to get wallet account or address')
    }

    return {
      account,
      address,
      walletType
    }
  } catch (error) {
    console.error('Wallet connection error:', error)
    throw error
  }
}

export async function disconnectWallet (): Promise<void> {
  try {
    // Clear the wallet state - actual disconnection handled by wallet extension
    console.log('Wallet state cleared')
  } catch (error) {
    console.error('Wallet disconnection error:', error)
  }
}
