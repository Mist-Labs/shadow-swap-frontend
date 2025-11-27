'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Lock, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TOKENS, type Token } from '@/lib/constants/tokens'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { useWalletStore } from '@/lib/stores/wallet-store'

interface TokenSelectProps {
  token: Token | null
  onSelect: (token: Token) => void
  excludeToken?: Token | null
  forceDirection?: 'up' | 'down'
  filterByChain?: 'starknet' | 'zcash' | null // Filter tokens by chain
}

export function TokenSelect ({
  token,
  onSelect,
  excludeToken,
  forceDirection,
  filterByChain
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down')
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
  }>({ left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const { getFormattedBalance } = useBalanceStore()
  const { isStarknetConnected, isZcashConnected } = useWalletStore()
  const isConnected = isStarknetConnected || isZcashConnected

  useEffect(() => {
    setMounted(true)
  }, [])

  const availableTokens = TOKENS.filter(t => {
    // Filter by excluded token
    if (excludeToken && t.address === excludeToken.address) return false
    
    // Filter by chain if specified
    if (filterByChain && t.chain !== filterByChain) return false
    
    return true
  })

  const filteredTokens = availableTokens.filter(
    t =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate drop direction and position when opening or scrolling
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownHeight = 400
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        // Determine direction
        let direction: 'up' | 'down' = 'down'
        if (forceDirection) {
          direction = forceDirection
        } else if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          direction = 'up'
        }

        setDropDirection(direction)

        // Calculate position for fixed positioning (portal)
        if (direction === 'up') {
          setDropdownPosition({
            bottom: window.innerHeight - rect.top + 8,
            left: rect.left,
            width: rect.width
          })
        } else {
          setDropdownPosition({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width
          })
        }
      }
    }

    if (isOpen) {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)

      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true)
        window.removeEventListener('resize', updateDropdownPosition)
      }
    }
  }, [isOpen, forceDirection])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)

      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div ref={containerRef} className='relative z-[100]'>
      {/* Trigger Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2.5 px-4 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl transition-all duration-200 cursor-pointer min-w-[140px]'
        style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
      >
        {token ? (
          <>
            <span className='text-2xl'>
              {token.symbol === 'ETH' ? '⟠' : '💎'}
            </span>
            <span className='font-bold text-white text-sm'>{token.symbol}</span>
          </>
        ) : (
          <span className='text-slate-200 font-medium text-sm'>
            Select Token
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className='text-slate-200 ml-auto' />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu - Rendered via Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <div
                  className='fixed inset-0 bg-black/20 backdrop-blur-sm'
                  style={{ zIndex: 9998 }}
                  onClick={() => {
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                />

                {/* Dropdown */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: dropDirection === 'down' ? -10 : 10,
                    scale: 0.95
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: dropDirection === 'down' ? -10 : 10,
                    scale: 0.95
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className='fixed bg-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden'
                  style={{
                    zIndex: 9999,
                    boxShadow:
                      'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    maxHeight: '400px',
                    minWidth: '320px',
                    maxWidth: '360px',
                    width: dropdownPosition.width || 'auto',
                    top: dropdownPosition.top,
                    bottom: dropdownPosition.bottom,
                    left: dropdownPosition.left,
                    transform: 'translateX(0)'
                  }}
                  onWheel={e => e.stopPropagation()}
                >
                  {/* Search Bar */}
                  <div className='p-4 border-b border-slate-700/50'>
                    <div className='relative'>
                      <Search
                        size={18}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-300'
                      />
                      <input
                        ref={searchInputRef}
                        type='text'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder='Search tokens...'
                        className='w-full pl-10 pr-4 py-2.5 bg-slate-700/60 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all'
                        style={{
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Token List */}
                  <div
                    className='p-2 space-y-1 max-h-80 overflow-y-auto'
                    onScroll={e => e.stopPropagation()}
                  >
                    {filteredTokens.length === 0 ? (
                      <div className='p-8 text-center'>
                        <p className='text-slate-200 text-sm'>
                          No tokens found
                        </p>
                      </div>
                    ) : (
                      filteredTokens.map((t, index) => (
                        <motion.button
                          key={t.address}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onSelect(t)
                            setIsOpen(false)
                            setSearchQuery('')
                          }}
                          className='w-full flex items-center gap-3 p-3 hover:bg-slate-700/80 rounded-xl transition-all duration-200 text-left cursor-pointer group'
                        >
                          <span className='text-2xl group-hover:scale-110 transition-transform'>
                            {t.symbol === 'ETH' ? '⟠' : '💎'}
                          </span>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
                              <div className='font-bold text-white text-sm'>
                                {t.symbol}
                              </div>
                              {t.isPrivate && (
                                <Lock
                                  size={12}
                                  className='text-slate-300 shrink-0'
                                />
                              )}
                            </div>
                            <div className='text-xs text-slate-300 truncate'>
                              {t.name}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-medium text-slate-100 text-sm'>
                              {isConnected
                                ? getFormattedBalance(t, 4)
                                : '0.00'}
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
