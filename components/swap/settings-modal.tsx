'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  slippage: number
  onSlippageChange: (slippage: number) => void
}

const PRESET_SLIPPAGES = [0.1, 0.5, 1.0]

export function SettingsModal ({
  isOpen,
  onClose,
  slippage,
  onSlippageChange
}: SettingsModalProps) {
  const [customSlippage, setCustomSlippage] = useState(slippage.toString())

  const handlePresetClick = (value: number) => {
    onSlippageChange(value)
    setCustomSlippage(value.toString())
  }

  const handleCustomChange = (value: string) => {
    setCustomSlippage(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      onSlippageChange(numValue)
    }
  }

  const isHighSlippage = parseFloat(customSlippage) > 5

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Transaction Settings'>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className='space-y-6'
      >
        {/* Slippage Tolerance */}
        <div className='space-y-4'>
          <div>
            <label className='block text-base font-semibold text-white mb-2'>
              Slippage Tolerance
            </label>
            <p className='text-sm text-slate-200 leading-relaxed'>
              Your transaction will revert if the price changes unfavorably by
              more than this percentage.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className='grid grid-cols-3 gap-3'>
            {PRESET_SLIPPAGES.map((value, index) => (
              <motion.button
                key={value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePresetClick(value)}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                  slippage === value
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:shadow-md'
                }`}
                style={{
                  boxShadow:
                    slippage === value
                      ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                {value}%
              </motion.button>
            ))}
          </div>

          {/* Custom Input */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-slate-300'>
              Custom Slippage (%)
            </label>
            <div className='relative'>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type='text'
                value={customSlippage}
                onChange={e => handleCustomChange(e.target.value)}
                placeholder='0.5'
                className='w-full px-4 py-3 bg-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200'
                style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)' }}
              />
              <span className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 font-medium'>
                %
              </span>
            </div>
          </div>

          {/* Warning */}
          <AnimatePresence>
            {isHighSlippage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className='overflow-hidden'
              >
                <div
                  className='p-4 bg-amber-900/40 rounded-xl backdrop-blur-sm border border-amber-700/30'
                  style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
                >
                  <div className='flex items-start gap-3'>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <AlertTriangle
                        size={20}
                        className='text-amber-400 shrink-0 mt-0.5'
                      />
                    </motion.div>
                    <div>
                      <h4 className='font-semibold text-amber-300 text-sm mb-1'>
                        High Slippage Warning
                      </h4>
                      <p className='text-xs text-amber-400/90 leading-relaxed'>
                        High slippage tolerance may result in unfavorable
                        trades. Consider using a lower value for better price
                        protection.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='p-4 bg-slate-700/60 rounded-xl backdrop-blur-sm'
          style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
        >
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 bg-slate-600/80 rounded-lg flex items-center justify-center shrink-0'>
              <Info size={16} className='text-slate-300' />
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white mb-1.5'>
                What is Slippage?
              </h4>
              <p className='text-xs text-slate-200 leading-relaxed'>
                Slippage is the difference between the expected price of a trade
                and the actual price at which it executes. Lower slippage means
                more precise trades but may fail in volatile markets. Higher
                slippage increases success rate but may result in less favorable
                prices.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Advanced Settings (Future) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='p-4 bg-slate-800/50 rounded-xl border border-slate-700/50'
          style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium text-white text-sm mb-1'>
                Advanced Settings
              </h4>
              <p className='text-xs text-slate-400'>
                Transaction deadline, gas price optimization
              </p>
            </div>
            <span className='text-xs text-slate-400 bg-slate-700/80 px-2.5 py-1 rounded-full'>
              Coming Soon
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Modal>
  )
}
