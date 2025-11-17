'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { connectWallet, WalletType } from '@/lib/wallet/connect'
import { motion } from 'framer-motion'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WalletOption {
  id: WalletType
  name: string
  description: string
  icon: string
}

const walletOptions: WalletOption[] = [
  {
    id: 'argentx',
    name: 'ArgentX',
    description: 'Connect to your ArgentX wallet',
    icon: '🦅'
  },
  {
    id: 'braavos',
    name: 'Braavos',
    description: 'Connect to your Braavos wallet',
    icon: '⚔️'
  },
  {
    id: 'cartridge',
    name: 'Cartridge',
    description: 'Connect with Cartridge Controller',
    icon: '🎮'
  }
]

export function WalletModal ({ isOpen, onClose }: WalletModalProps) {
  const { setAccount, setIsConnecting } = useWalletStore()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (walletType: WalletType) => {
    try {
      setError(null)
      setIsConnecting(true)
      const connection = await connectWallet(walletType)
      setAccount(connection.account, connection.address, connection.walletType)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Connect Wallet'>
      <div className='space-y-3'>
        <p className='text-sm text-slate-400 mb-4'>
          Choose your preferred wallet to connect
        </p>
        {walletOptions.map(wallet => (
          <button
            key={wallet.id}
            onClick={() => handleConnect(wallet.id)}
            className='w-full flex items-center gap-4 p-4 bg-slate-600/70 hover:bg-slate-500/70 rounded-lg transition-colors cursor-pointer'
            style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
          >
            <div className='text-2xl'>{wallet.icon}</div>
            <div className='flex-1 text-left'>
              <div className='font-semibold text-white'>{wallet.name}</div>
              <div className='text-sm text-slate-400'>{wallet.description}</div>
            </div>
          </button>
        ))}
        {error && (
          <div
            className='p-4 bg-red-900/40 rounded-lg text-red-300 text-sm font-medium'
            style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
          >
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
