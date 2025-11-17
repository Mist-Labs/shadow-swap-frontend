'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { motion } from 'framer-motion'

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Settings'>
      <div className='space-y-6'>
        {/* Slippage Tolerance */}
        <div className='space-y-4'>
          <div>
            <label className='block text-base font-semibold text-white mb-2'>
              Slippage Tolerance
            </label>
            <p className='text-sm text-slate-400 mb-3'>
              Your transaction will revert if the price changes unfavorably by
              more than this percentage.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className='grid grid-cols-3 gap-2'>
            {PRESET_SLIPPAGES.map(value => (
              <button
                key={value}
                onClick={() => handlePresetClick(value)}
                className={`py-2.5 px-3 rounded-lg font-semibold transition-all duration-200 ${
                  slippage === value
                    ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:shadow-sm'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-slate-300'>
              Custom Slippage
            </label>
            <div className='relative'>
              <input
                type='text'
                value={customSlippage}
                onChange={e => handleCustomChange(e.target.value)}
                placeholder='0.5'
                className='w-full px-3 py-2 bg-linear-to-br from-slate-700/80 to-slate-600/60 border border-slate-500/60 rounded-lg text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all backdrop-blur-sm'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium'>
                %
              </span>
            </div>
          </div>

          {/* Warning */}
          {parseFloat(customSlippage) > 5 && (
            <div className='p-3 bg-linear-to-br from-amber-900/80 to-orange-900/60 border border-amber-700/60 rounded-lg backdrop-blur-sm'>
              <div className='flex items-start gap-2'>
                <span className='text-amber-400'>⚠️</span>
                <div>
                  <h4 className='font-semibold text-amber-300 text-sm'>
                    High Slippage Warning
                  </h4>
                  <p className='text-xs text-amber-400'>
                    High slippage tolerance may result in unfavorable trades.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className='p-4 bg-linear-to-br from-slate-700/60 to-slate-600/40 border border-slate-500/60 rounded-xl backdrop-blur-sm'>
          <div className='flex items-start gap-3'>
            <div className='w-6 h-6 bg-slate-600 rounded-md flex items-center justify-center shrink-0'>
              <span className='text-slate-400 text-xs'>💡</span>
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white mb-1'>
                What is Slippage?
              </h4>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Slippage is the difference between expected and actual trade
                price. Lower slippage means more precise trades but may fail in
                volatile markets.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings (Future) */}
        <div className='p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium text-white text-sm'>
                Advanced Settings
              </h4>
              <p className='text-xs text-slate-400'>
                Transaction deadline, gas price
              </p>
            </div>
            <span className='text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full'>
              Soon
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
