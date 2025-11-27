'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { useWalletStore } from '@/lib/stores/wallet-store'
import {
  connectStarknetWallet,
  connectZcashWallet,
  isWalletInstalled,
  isWalletInstalledSync
} from '@/lib/wallet/connect'
import type {
  StarknetWalletType,
  ZcashWalletType
} from '@/lib/stores/wallet-store'
import { motion } from 'framer-motion'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StarknetWalletOption {
  id: StarknetWalletType
  name: string
  description: string
  icon: string
  chain: 'starknet'
}

interface ZcashWalletOption {
  id: ZcashWalletType
  name: string
  description: string
  icon: string
  chain: 'zcash'
}

const starknetWallets: StarknetWalletOption[] = [
  {
    id: 'argentx',
    name: 'ArgentX',
    description: 'Connect to your ArgentX wallet',
    icon: '🦅',
    chain: 'starknet'
  },
  {
    id: 'braavos',
    name: 'Braavos',
    description: 'Connect to your Braavos wallet',
    icon: '⚔️',
    chain: 'starknet'
  },
  {
    id: 'cartridge',
    name: 'Cartridge',
    description: 'Connect with Cartridge Controller',
    icon: '🎮',
    chain: 'starknet'
  }
]

const zcashWallets: ZcashWalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask + Zcash Snap',
    description:
      'Fully supported - Connect via MetaMask with Zcash Shielded Wallet Snap',
    icon: '🦊',
    chain: 'zcash'
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    description: 'BETA - Some features may not work properly',
    icon: '🦁',
    chain: 'zcash'
  },
  {
    id: 'klever',
    name: 'Klever Wallet',
    description: 'BETA - Some features may not work properly',
    icon: '💎',
    chain: 'zcash'
  }
]

export function WalletModal ({ isOpen, onClose }: WalletModalProps) {
  const {
    setStarknetWallet,
    setZcashWallet,
    setIsConnecting,
    isStarknetConnected,
    isZcashConnected
  } = useWalletStore()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'starknet' | 'zcash'>('starknet')
  const [walletAvailability, setWalletAvailability] = useState<
    Record<string, boolean>
  >({})

  // Check wallet availability when modal opens
  useEffect(() => {
    if (isOpen) {
      const checkWallets = async () => {
        const availability: Record<string, boolean> = {}

        // Check Starknet wallets
        for (const wallet of starknetWallets) {
          try {
            availability[wallet.id] = await isWalletInstalled(
              'starknet',
              wallet.id
            )
          } catch {
            availability[wallet.id] = isWalletInstalledSync(
              'starknet',
              wallet.id
            )
          }
        }

        // Check Zcash wallets
        for (const wallet of zcashWallets) {
          availability[wallet.id] = isWalletInstalledSync('zcash', wallet.id)
        }

        setWalletAvailability(availability)
      }

      checkWallets()
    }
  }, [isOpen])

  const handleConnectStarknet = async (walletType: StarknetWalletType) => {
    try {
      setError(null)
      setIsConnecting(true, 'starknet')
      const connection = await connectStarknetWallet(walletType)
      setStarknetWallet(connection)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Starknet wallet'
      )
    } finally {
      setIsConnecting(false, null)
    }
  }

  const handleConnectZcash = async (walletType: ZcashWalletType) => {
    try {
      setError(null)
      setIsConnecting(true, 'zcash')
      const connection = await connectZcashWallet(walletType)
      setZcashWallet(connection)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Zcash wallet'
      )
    } finally {
      setIsConnecting(false, null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Connect Wallet'>
      <div className='space-y-4'>
        {/* Tab Selector */}
        <div className='flex gap-2 border-b border-slate-600'>
          <button
            onClick={() => setActiveTab('starknet')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'starknet'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Starknet {isStarknetConnected && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('zcash')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'zcash'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Zcash {isZcashConnected && '✓'}
          </button>
        </div>

        {/* Wallet Options */}
        <div className='space-y-3'>
          {activeTab === 'starknet' && (
            <>
              <p className='text-sm text-slate-200 mb-2'>
                Connect your Starknet wallet for swaps
              </p>
              {starknetWallets.map(wallet => {
                const isInstalled =
                  walletAvailability[wallet.id] ??
                  isWalletInstalledSync('starknet', wallet.id)
                return (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnectStarknet(wallet.id)}
                    disabled={!isInstalled}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer ${
                      isInstalled
                        ? 'bg-slate-600/70 hover:bg-slate-500/70'
                        : 'bg-slate-700/50 opacity-50 cursor-not-allowed'
                    }`}
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    <div className='text-2xl'>{wallet.icon}</div>
                    <div className='flex-1 text-left'>
                      <div className='font-semibold text-white'>
                        {wallet.name}
                      </div>
                      <div className='text-sm text-slate-300'>
                        {wallet.description}
                      </div>
                    </div>
                    {!isInstalled && (
                      <span className='text-xs text-slate-500'>
                        Not installed
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {activeTab === 'zcash' && (
            <>
              <div className='mb-4 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg text-center'>
                <p className='text-lg text-orange-200 font-semibold mb-2'>
                  🚧 Zcash Integration Coming Soon
                </p>
                <p className='text-sm text-orange-100'>
                  We're working on bringing Zcash cross-chain swaps to Shadow Swap. 
                  For now, enjoy fast and private swaps on Starknet!
                </p>
              </div>
              <p className='text-sm text-slate-300 mb-2 opacity-70'>
                Connect your Zcash wallet for cross-chain swaps
              </p>
              {zcashWallets.map(wallet => {
                const isInstalled =
                  walletAvailability[wallet.id] ??
                  isWalletInstalledSync('zcash', wallet.id)
                const isBeta = wallet.id !== 'metamask'
                return (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnectZcash(wallet.id)}
                    disabled={true}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer relative ${
                      isInstalled
                        ? 'bg-slate-600/70 hover:bg-slate-500/70'
                        : 'bg-slate-700/50 opacity-50 cursor-not-allowed'
                    }`}
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    {isBeta && (
                      <span className='absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400 rounded border border-orange-500/30'>
                        BETA
                      </span>
                    )}
                    <div className='text-2xl'>{wallet.icon}</div>
                    <div className='flex-1 text-left'>
                      <div className='font-semibold text-white flex items-center gap-2'>
                        {wallet.name}
                        {!isBeta && (
                          <span className='text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30'>
                            ✓
                          </span>
                        )}
                      </div>
                      <div className='text-sm text-slate-300'>
                        {wallet.description}
                      </div>
                    </div>
                    {!isInstalled && (
                      <span className='text-xs text-slate-500'>
                        Not installed
                      </span>
                    )}
                  </button>
                )
              })}
              <div className='mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/50'>
                <p className='text-xs text-blue-300'>
                  <strong>Note:</strong> For MetaMask, install the{' '}
                  <a
                    href='https://snaps.metamask.io/snap/@chainsafe/webzjs-zcash-snap/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:text-blue-200'
                  >
                    Zcash Shielded Wallet Snap
                  </a>{' '}
                  for full shielded transaction support.
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div
            className='p-4 bg-red-900/40 rounded-lg border border-red-800/50'
            style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
          >
            <div className='flex items-start gap-2'>
              <span className='text-red-400 font-bold'>⚠</span>
              <p className='text-red-300 text-sm font-medium flex-1'>{error}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
