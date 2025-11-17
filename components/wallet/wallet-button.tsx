'use client'

import { useState } from 'react'
import { Wallet, LogOut } from 'lucide-react'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { WalletModal } from './wallet-modal'
import { motion } from 'framer-motion'

export function WalletButton () {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { address, isConnected, disconnect } = useWalletStore()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className='flex items-center gap-3'>
        <div
          className='hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-900/40 rounded-lg'
          style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
        >
          <div className='w-2 h-2 bg-green-400 rounded-full' />
          <span className='text-sm font-medium text-green-300'>
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className='flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer'
        >
          <LogOut size={16} />
          <span className='hidden sm:inline'>Disconnect</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer'
      >
        <Wallet size={16} />
        <span>Connect Wallet</span>
      </button>
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
