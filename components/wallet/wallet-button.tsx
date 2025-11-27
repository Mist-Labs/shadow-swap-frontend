'use client'

import { useState } from 'react'
import { Wallet, LogOut, ChevronDown, Copy, Check } from 'lucide-react'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { WalletModal } from './wallet-modal'
import { motion, AnimatePresence } from 'framer-motion'

export function WalletButton () {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const {
    starknetAddress,
    isStarknetConnected,
    zcashWallet,
    isZcashConnected,
    disconnectStarknet,
    disconnectZcash,
    disconnectAll
  } = useWalletStore()

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    // Handle Zcash unified addresses (u1... - very long)
    if (addr.startsWith('u1')) {
      return `${addr.slice(0, 10)}...${addr.slice(-8)}`
    }
    // Handle Zcash shielded addresses (zs1..., zreg1...)
    if (addr.startsWith('zs') || addr.startsWith('zreg')) {
      return `${addr.slice(0, 8)}...${addr.slice(-6)}`
    }
    // Handle Zcash transparent addresses (t1...)
    if (addr.startsWith('t1')) {
      return `${addr.slice(0, 8)}...${addr.slice(-6)}`
    }
    // Handle Ethereum/Starknet addresses (0x...)
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyToClipboard = async (
    address: string,
    type: 'starknet' | 'zcash'
  ) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const isAnyConnected = isStarknetConnected || isZcashConnected

  if (isAnyConnected) {
    return (
      <div className='relative flex items-center gap-3'>
        {/* Connected Wallets Display */}
        <div className='hidden sm:flex items-center gap-2'>
          {isStarknetConnected && starknetAddress && (
            <div
              className='group flex items-center gap-2 px-3 py-1.5 bg-purple-900/40 rounded-lg hover:bg-purple-900/60 transition-colors cursor-pointer'
              style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
              onClick={() => copyToClipboard(starknetAddress, 'starknet')}
              title={starknetAddress}
            >
              <div className='w-2 h-2 bg-purple-400 rounded-full' />
              <span className='text-xs text-purple-300 font-medium'>STK</span>
              <span className='text-sm font-medium text-purple-300'>
                {formatAddress(starknetAddress)}
              </span>
              {copiedAddress === 'starknet' ? (
                <Check size={14} className='text-green-400' />
              ) : (
                <Copy
                  size={14}
                  className='text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity'
                />
              )}
            </div>
          )}
          {isZcashConnected && zcashWallet && (
            <div
              className='group flex items-center gap-2 px-3 py-1.5 bg-yellow-900/40 rounded-lg hover:bg-yellow-900/60 transition-colors cursor-pointer'
              style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
              onClick={() => copyToClipboard(zcashWallet.address, 'zcash')}
              title={zcashWallet.address}
            >
              <div className='w-2 h-2 bg-yellow-400 rounded-full' />
              <span className='text-xs text-yellow-300 font-medium'>ZEC</span>
              <span className='text-sm font-medium text-yellow-300'>
                {formatAddress(zcashWallet.address)}
              </span>
              {copiedAddress === 'zcash' ? (
                <Check size={14} className='text-green-400' />
              ) : (
                <Copy
                  size={14}
                  className='text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity'
                />
              )}
            </div>
          )}
        </div>

        {/* Mobile: Show single connected indicator */}
        <div className='sm:hidden flex items-center gap-2 px-3 py-1.5 bg-green-900/40 rounded-lg'>
          <div className='w-2 h-2 bg-green-400 rounded-full' />
          <span className='text-sm font-medium text-green-300'>
            {isStarknetConnected && isZcashConnected
              ? 'Both Connected'
              : isStarknetConnected
              ? 'STK'
              : 'ZEC'}
          </span>
        </div>

        {/* Dropdown Menu */}
        <div className='relative'>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer'
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showDropdown ? 'rotate-180' : ''
              }`}
            />
            <span className='hidden sm:inline'>Manage</span>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50'
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
              >
                <div className='p-2'>
                  {isStarknetConnected && starknetAddress && (
                    <>
                      <div className='px-3 py-2 mb-2 border-b border-slate-700'>
                        <div className='text-xs text-slate-300 mb-1'>
                          Starknet
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-slate-300 font-mono'>
                            {formatAddress(starknetAddress)}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              copyToClipboard(starknetAddress, 'starknet')
                            }}
                            className='p-1 hover:bg-slate-700 rounded transition-colors'
                            title='Copy address'
                          >
                            {copiedAddress === 'starknet' ? (
                              <Check size={14} className='text-green-400' />
                            ) : (
                              <Copy size={14} className='text-slate-300' />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {isZcashConnected && zcashWallet && (
                    <>
                      <div className='px-3 py-2 mb-2 border-b border-slate-700'>
                        <div className='text-xs text-slate-300 mb-1'>Zcash</div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-slate-300 font-mono'>
                            {formatAddress(zcashWallet.address)}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              copyToClipboard(zcashWallet.address, 'zcash')
                            }}
                            className='p-1 hover:bg-slate-700 rounded transition-colors'
                            title='Copy address'
                          >
                            {copiedAddress === 'zcash' ? (
                              <Check size={14} className='text-green-400' />
                            ) : (
                              <Copy size={14} className='text-slate-300' />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsModalOpen(true)
                      setShowDropdown(false)
                    }}
                    className='w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors'
                  >
                    Connect More Wallets
                  </button>
                  {isStarknetConnected && (
                    <button
                      onClick={() => {
                        disconnectStarknet()
                        setShowDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded transition-colors'
                    >
                      Disconnect Starknet
                    </button>
                  )}
                  {isZcashConnected && (
                    <button
                      onClick={() => {
                        disconnectZcash()
                        setShowDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded transition-colors'
                    >
                      Disconnect Zcash
                    </button>
                  )}
                  {(isStarknetConnected || isZcashConnected) && (
                    <>
                      <div className='my-1 border-t border-slate-700' />
                      <button
                        onClick={() => {
                          disconnectAll()
                          setShowDropdown(false)
                        }}
                        className='w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded transition-colors font-medium'
                      >
                        Disconnect All
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className='fixed inset-0 z-40'
            onClick={() => setShowDropdown(false)}
          />
        )}

        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
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
