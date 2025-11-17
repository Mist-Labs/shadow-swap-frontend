'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TOKENS } from '@/lib/constants/tokens'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
}

interface TokenSelectProps {
  token: Token | null
  onSelect: (token: Token) => void
  excludeToken?: Token | null
}

export function TokenSelect ({
  token,
  onSelect,
  excludeToken
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const availableTokens = TOKENS.filter(
    t => !excludeToken || t.address !== excludeToken.address
  )

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      // Calculate position - show above if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const dropdownHeight = 320 // max-h-80 = 320px

      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

      setPosition({
        top: showAbove
          ? rect.top + scrollY - dropdownHeight - 4
          : rect.bottom + scrollY + 4,
        left: rect.left + scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const scrollY = window.scrollY
        const scrollX = window.scrollX
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownHeight = 320

        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

        setPosition({
          top: showAbove
            ? rect.top + scrollY - dropdownHeight - 4
            : rect.bottom + scrollY + 4,
          left: rect.left + scrollX,
          width: rect.width
        })
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  return (
    <>
      <div className='relative'>
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 hover:border-slate-500 transition-all shadow-sm'
        >
          {token ? (
            <>
              <span className='text-2xl'>
                {token.symbol === 'ETH' ? '⟠' : '💎'}
              </span>
              <span className='font-bold text-white'>{token.symbol}</span>
            </>
          ) : (
            <span className='text-slate-400 font-medium'>Select</span>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </motion.button>
      </div>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='fixed inset-0 z-40'
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className='fixed z-50 w-80 bg-slate-800 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl overflow-hidden'
                  style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`
                  }}
                >
                  <div className='p-2 space-y-1 max-h-80 overflow-y-auto'>
                    {availableTokens.map((t, index) => (
                      <motion.button
                        key={t.address}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          onSelect(t)
                          setIsOpen(false)
                        }}
                        className='w-full flex items-center gap-3 p-4 hover:bg-slate-700 rounded-xl transition-all text-left border border-transparent hover:border-slate-500'
                      >
                        <span className='text-3xl'>
                          {t.symbol === 'ETH' ? '⟠' : '💎'}
                        </span>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <div className='font-bold text-white'>
                              {t.symbol}
                            </div>
                            {t.isPrivate && (
                              <Lock size={12} className='text-slate-400' />
                            )}
                          </div>
                          <div className='text-xs text-slate-400'>{t.name}</div>
                        </div>
                        <div className='text-right text-sm'>
                          <div className='font-medium text-slate-300'>0.00</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
