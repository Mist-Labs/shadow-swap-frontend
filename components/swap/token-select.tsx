'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Lock, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TOKENS } from '@/lib/constants/tokens'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
  isPrivate?: boolean
}

interface TokenSelectProps {
  token: Token | null
  onSelect: (token: Token) => void
  excludeToken?: Token | null
  forceDirection?: 'up' | 'down'
}

export function TokenSelect ({
  token,
  onSelect,
  excludeToken,
  forceDirection
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down')
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const availableTokens = TOKENS.filter(
    t => !excludeToken || t.address !== excludeToken.address
  )

  const filteredTokens = availableTokens.filter(
    t =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate drop direction when opening
  useEffect(() => {
    if (isOpen) {
      // If forceDirection is provided, use it
      if (forceDirection) {
        setDropDirection(forceDirection)
      } else if (buttonRef.current) {
        // Otherwise, calculate based on available space
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownHeight = 400
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        // If not enough space below but more space above, drop up
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropDirection('up')
        } else {
          setDropDirection('down')
        }
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
    <div ref={containerRef} className='relative'>
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
          <span className='text-slate-400 font-medium text-sm'>
            Select Token
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className='text-slate-400 ml-auto' />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 bg-black/20 backdrop-blur-sm z-99999999999999999'
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
              className={`absolute w-full min-w-[320px] max-w-[360px] bg-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ${
                dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}
              style={{
                zIndex: 9999,
                boxShadow:
                  'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                maxHeight: '400px'
              }}
              onWheel={e => e.stopPropagation()}
            >
              {/* Search Bar */}
              <div className='p-4 border-b border-slate-700/50'>
                <div className='relative'>
                  <Search
                    size={18}
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                  />
                  <input
                    ref={searchInputRef}
                    type='text'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder='Search tokens...'
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-700/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all'
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
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
                    <p className='text-slate-400 text-sm'>No tokens found</p>
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
                              className='text-slate-400 shrink-0'
                            />
                          )}
                        </div>
                        <div className='text-xs text-slate-400 truncate'>
                          {t.name}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium text-slate-300 text-sm'>
                          0.00
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
