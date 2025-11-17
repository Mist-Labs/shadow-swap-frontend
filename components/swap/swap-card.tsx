'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, Settings } from 'lucide-react'
import { useSwapStore } from '@/lib/stores/swap-store'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { TokenSelect } from './token-select'
import { SettingsModal } from './settings-modal'
import { DEFAULT_TOKEN_IN, DEFAULT_TOKEN_OUT } from '@/lib/constants/tokens'

export function SwapCard () {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    slippage,
    isSwapping,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    setSlippage,
    swapTokens
  } = useSwapStore()

  const { isConnected } = useWalletStore()

  useEffect(() => {
    if (!tokenIn) setTokenIn(DEFAULT_TOKEN_IN)
    if (!tokenOut) setTokenOut(DEFAULT_TOKEN_OUT)
  }, [tokenIn, tokenOut, setTokenIn, setTokenOut])

  const handleSwap = async () => {
    if (!isConnected || !tokenIn || !tokenOut || !amountIn) return
    // Swap logic will be implemented here
    console.log('Swap:', { tokenIn, tokenOut, amountIn })
  }

  return (
    <div className='w-full max-w-2xl bg-slate-800/90 backdrop-blur-xl border border-slate-600/60 rounded-xl p-4 shadow-xl relative overflow-hidden'>
      {/* Subtle noise/glassy background */}
      <div className='absolute inset-0 bg-linear-to-br from-slate-700/20 via-slate-800/10 to-slate-700/20 rounded-xl' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%)] rounded-xl' />

      {/* Content */}
      <div className='relative z-10'>
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-lg font-bold text-white'>Swap</h2>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className='p-1.5 hover:bg-slate-700/80 rounded-md transition-all duration-200'
          >
            <Settings size={16} className='text-slate-400' />
          </button>
        </div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          slippage={slippage}
          onSlippageChange={setSlippage}
        />

        {/* From Token */}
        <div className='mb-2'>
          <div className='flex items-center justify-between mb-1'>
            <label className='text-xs font-medium text-slate-300'>From</label>
            <div className='text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full'>
              Balance: 0.00
            </div>
          </div>
          <div className='bg-linear-to-br from-slate-700/60 to-slate-600/40 border border-slate-500/60 rounded-lg p-2 backdrop-blur-sm'>
            <div className='flex items-center justify-between mb-1'>
              <TokenSelect
                token={tokenIn}
                onSelect={setTokenIn}
                excludeToken={tokenOut}
              />
              <button className='px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs font-medium rounded transition-colors'>
                Max
              </button>
            </div>
            <input
              type='text'
              value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              placeholder='0.0'
              className='w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-400'
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className='flex justify-center my-1'>
          <button
            onClick={swapTokens}
            className='group p-1.5 bg-slate-700/80 hover:bg-slate-600 border border-slate-500 hover:border-slate-400 rounded-md transition-all duration-200 hover:shadow-md backdrop-blur-sm'
          >
            <ArrowDownUp
              size={14}
              className='text-slate-400 group-hover:text-slate-300 transition-colors'
            />
          </button>
        </div>

        {/* To Token */}
        <div className='mb-2'>
          <div className='flex items-center justify-between mb-1'>
            <label className='text-xs font-medium text-slate-300'>To</label>
            <div className='text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full'>
              Balance: 0.00
            </div>
          </div>
          <div className='bg-linear-to-br from-slate-700/60 to-slate-600/40 border border-slate-500/60 rounded-lg p-2 backdrop-blur-sm'>
            <div className='flex items-center justify-between mb-1'>
              <TokenSelect
                token={tokenOut}
                onSelect={setTokenOut}
                excludeToken={tokenIn}
              />
            </div>
            <input
              type='text'
              value={amountOut}
              onChange={e => setAmountOut(e.target.value)}
              placeholder='0.0'
              className='w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-400'
              readOnly
            />
          </div>
        </div>

        {/* Swap Info - Compact */}
        {amountIn && (
          <div className='bg-linear-to-br from-slate-700/40 to-slate-600/30 border border-slate-500/60 rounded-md p-2 mb-2 backdrop-blur-sm'>
            <div className='grid grid-cols-2 gap-1 text-xs'>
              <div>
                <span className='text-slate-400'>Rate:</span>
                <div className='font-semibold text-white'>
                  1 ETH = 3,200 USDC
                </div>
              </div>
              <div>
                <span className='text-slate-400'>Slippage:</span>
                <div className='font-semibold text-white'>{slippage}%</div>
              </div>
              <div>
                <span className='text-slate-400'>Fee:</span>
                <div className='font-semibold text-white'>~$0.50</div>
              </div>
              <div>
                <span className='text-slate-400'>Impact:</span>
                <div className='font-semibold text-green-400'>~0.01%</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSwap}
          disabled={
            !isConnected || !tokenIn || !tokenOut || !amountIn || isSwapping
          }
          className={`w-full py-2 px-3 rounded-md font-semibold text-sm transition-all duration-200 ${
            !isConnected
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : !tokenIn || !tokenOut || !amountIn
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 shadow-lg hover:shadow-xl'
          }`}
        >
          {!isConnected
            ? 'Connect Wallet'
            : isSwapping
            ? 'Swapping...'
            : !tokenIn || !tokenOut
            ? 'Select Tokens'
            : !amountIn
            ? 'Enter Amount'
            : 'Swap'}
        </button>
      </div>
    </div>
  )
}
