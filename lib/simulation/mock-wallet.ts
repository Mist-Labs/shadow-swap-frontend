/**
 * Mock Starknet Wallet Implementation
 * Used when real wallet connection fails (for demo purposes)
 */

import type { AccountInterface } from 'starknet'
import { MOCK_STARKNET_ADDRESS } from './config'
import { DEFAULT_NETWORK, getNetworkConfig } from '@/lib/constants/networks'

/**
 * Mock Account Interface for simulation
 */
class MockAccount implements AccountInterface {
  address: string = MOCK_STARKNET_ADDRESS
  
  // Add provider property for testnet
  get provider() {
    const networkConfig = getNetworkConfig(DEFAULT_NETWORK)
    // Return a mock provider that uses testnet RPC
    return {
      getChainId: async () => networkConfig.chainId,
      getBlock: async () => ({}),
      getBlockNumber: async () => 0,
      getClassHashAt: async () => '',
      getContractVersion: async () => ({}),
      getNonce: async () => '0x0',
      getStorageAt: async () => '0x0',
      getTransaction: async () => ({}),
      getTransactionReceipt: async () => ({}),
      callContract: async () => ({}),
      getBalance: async () => '0x0',
      getCode: async () => [],
      getClass: async () => ({}),
      getClassAt: async () => ({}),
      estimateFee: async () => ({}),
      waitForTransaction: async () => ({}),
      getTransactionTrace: async () => ({}),
      getSimulateTransaction: async () => ({}),
      getStateUpdate: async () => ({}),
      chainId: networkConfig.chainId
    }
  }
  
  async execute(calls: any): Promise<any> {
    // Simulate transaction execution
    return {
      transaction_hash: `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`
    }
  }
  
  async waitForTransaction(txHash: string): Promise<void> {
    // Simulate waiting for transaction
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Add other required AccountInterface methods as needed
  async getNonce(): Promise<string> {
    return '0x0'
  }
  
  async estimateFee(): Promise<any> {
    return {
      overall_fee: '0x0',
      gas_consumed: '0x0',
      gas_price: '0x0'
    }
  }
  
  async verifyMessage(): Promise<boolean> {
    return true
  }
  
  async verifyMessageHash(): Promise<boolean> {
    return true
  }
  
  async signMessage(): Promise<any> {
    return {
      signature: ['0x0', '0x0']
    }
  }
  
  async hashMessage(): Promise<string> {
    return '0x0'
  }
  
  async verifyMessageHashSignature(): Promise<boolean> {
    return true
  }
  
  async verifyMessageSignature(): Promise<boolean> {
    return true
  }
}

/**
 * Mock wallet connection (for demo when real wallet not available)
 */
export function createMockStarknetWallet() {
  return {
    account: new MockAccount() as AccountInterface,
    address: MOCK_STARKNET_ADDRESS,
    walletType: 'argentx' as const
  }
}

