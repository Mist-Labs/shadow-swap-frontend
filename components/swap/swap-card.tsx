'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownUp, Settings, Zap } from 'lucide-react'
import { useSwapStore } from '@/lib/stores/swap-store'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { TokenSelect } from './token-select'
import { SettingsModal } from './settings-modal'
import { DEFAULT_TOKEN_IN, DEFAULT_TOKEN_OUT } from '@/lib/constants/tokens'

export function SwapCard () {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)

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

  const { isStarknetConnected, isZcashConnected } = useWalletStore()
  const { getFormattedBalance, fetchBalances } = useBalanceStore()

  // Check if the required wallet is connected based on swap direction
  const isConnected =
    tokenIn?.chain === 'starknet' || tokenOut?.chain === 'starknet'
      ? isStarknetConnected
      : tokenIn?.chain === 'zcash' || tokenOut?.chain === 'zcash'
      ? isZcashConnected
      : isStarknetConnected || isZcashConnected

  useEffect(() => {
    if (!tokenIn) setTokenIn(DEFAULT_TOKEN_IN)
    if (!tokenOut) setTokenOut(DEFAULT_TOKEN_OUT)
  }, [tokenIn, tokenOut, setTokenIn, setTokenOut])

  // Fetch balances when wallet connects or tokens change
  useEffect(() => {
    if (isConnected) {
      fetchBalances()
    }
  }, [isConnected, tokenIn, tokenOut, fetchBalances])

  const handleSwap = async () => {
    if (!isConnected || !tokenIn || !tokenOut || !amountIn) return
    // Swap logic will be implemented here
    console.log('Swap:', { tokenIn, tokenOut, amountIn })
  }

  const handleFlipTokens = () => {
    setIsFlipping(true)
    const tempToken = tokenIn
    const tempAmount = amountIn
    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut || '')
    setAmountOut(tempAmount || '')
    setTimeout(() => setIsFlipping(false), 300)
  }

  const canSwap = isConnected && tokenIn && tokenOut && amountIn && !isSwapping

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className='w-2/3 mx-auto'
    >
      <div
        className='relative bg-slate-700/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl overflow-visible'
        style={{
          boxShadow:
            'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Animated background gradient */}
        <div className='absolute inset-0 bg-linear-to-br from-slate-700/40 via-slate-800/20 to-slate-700/40 rounded-3xl' />
        <motion.div
          className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)] rounded-3xl'
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Content */}
        <div className='relative '>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='flex items-center justify-between mb-6'
          >
            <h2 className='text-2xl font-bold text-white'>Swap</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)}
              className='p-2.5 hover:bg-slate-600/60 rounded-xl transition-all duration-200 cursor-pointer'
              style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)' }}
            >
              <Settings size={18} className='text-slate-300' />
            </motion.button>
          </motion.div>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            slippage={slippage}
            onSlippageChange={setSlippage}
          />

          {/* From Token Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className='mb-4'
          >
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-slate-300'>From</label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (tokenIn && isConnected) {
                    const balance = getFormattedBalance(tokenIn)
                    setAmountIn(balance)
                  }
                }}
                className='text-xs text-slate-400 hover:text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer'
                style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Balance:{' '}
                {tokenIn && isConnected ? getFormattedBalance(tokenIn) : '0.00'}
              </motion.button>
            </div>
            <motion.div
              whileFocus={{ scale: 1.01 }}
              className='relative bg-slate-800/60 rounded-2xl p-4 transition-all duration-300 backdrop-blur-sm overflow-visible'
              style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              <div className='flex items-center justify-between mb-3 relative z-[100]'>
                <TokenSelect
                  token={tokenIn}
                  onSelect={setTokenIn}
                  excludeToken={tokenOut}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (tokenIn && isConnected) {
                      const balance = getFormattedBalance(tokenIn)
                      setAmountIn(balance)
                    }
                  }}
                  className='px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer'
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  Max
                </motion.button>
              </div>
              <input
                type='text'
                value={amountIn}
                onChange={e => setAmountIn(e.target.value)}
                placeholder='0.0'
                className='w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-slate-500 focus:placeholder:text-slate-600 transition-colors'
              />
            </motion.div>
          </motion.div>

          {/* Swap Arrow Button */}
          <div className='flex justify-center -my-2 relative '>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFlipTokens}
              className='p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-full transition-all duration-300 cursor-pointer border-4 border-slate-900/50'
              style={{
                boxShadow:
                  'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <motion.div
                animate={{ rotate: isFlipping ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowDownUp size={20} className='text-slate-300' />
              </motion.div>
            </motion.button>
          </div>

          {/* To Token Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className='mb-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-slate-300'>To</label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='text-xs text-slate-400 hover:text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer z-0'
                style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Balance:{' '}
                {tokenOut && isConnected
                  ? getFormattedBalance(tokenOut)
                  : '0.00'}
              </motion.button>
            </div>
            <motion.div
              whileFocus={{ scale: 1.01 }}
              className='relative bg-slate-800/60 rounded-2xl p-4 backdrop-blur-sm transition-all duration-300 overflow-visible'
              style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              <div className='flex items-center justify-between mb-3 relative z-[100]'>
                <TokenSelect
                  token={tokenOut}
                  onSelect={setTokenOut}
                  excludeToken={tokenIn}
                  forceDirection='up'
                />
              </div>
              <input
                type='text'
                value={amountOut}
                onChange={e => setAmountOut(e.target.value)}
                placeholder='0.0'
                className='w-full bg-transparent text-2xl font-bold text-white outline-none  placeholder:text-slate-500 focus:placeholder:text-slate-600 transition-colors'
                readOnly
              />
            </motion.div>
          </motion.div>

          {/* Swap Info */}
          <AnimatePresence>
            {amountIn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className='mb-4 overflow-hidden'
              >
                <div
                  className='bg-slate-800/70 rounded-xl p-3 backdrop-blur-sm'
                  style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
                >
                  <div className='grid grid-cols-2 gap-3 text-xs'>
                    <div>
                      <span className='text-slate-400 block mb-1'>Rate</span>
                      <div className='font-semibold text-white'>
                        1 ETH = 3,200 USDC
                      </div>
                    </div>
                    <div>
                      <span className='text-slate-400 block mb-1'>
                        Slippage
                      </span>
                      <div className='font-semibold text-white'>
                        {slippage}%
                      </div>
                    </div>
                    <div>
                      <span className='text-slate-400 block mb-1'>
                        Network Fee
                      </span>
                      <div className='font-semibold text-white'>~$0.50</div>
                    </div>
                    <div>
                      <span className='text-slate-400 block mb-1'>
                        Price Impact
                      </span>
                      <div className='font-semibold text-green-400'>~0.01%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swap Button */}
          <motion.button
            whileHover={canSwap ? { scale: 1.02 } : {}}
            whileTap={canSwap ? { scale: 0.98 } : {}}
            onClick={handleSwap}
            disabled={!canSwap}
            className={`w-full py-4 px-6 rounded-2xl font-bold z-0 text-base transition-all duration-300 relative overflow-hidden ${
              canSwap
                ? 'bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 cursor-pointer'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canSwap && (
              <motion.div
                className='absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent'
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            <span className='relative z-10 flex items-center justify-center gap-2'>
              {!isConnected ? (
                'Connect Wallet'
              ) : isSwapping ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  >
                    <Zap size={18} />
                  </motion.div>
                  Swapping...
                </>
              ) : !tokenIn || !tokenOut ? (
                'Select Tokens'
              ) : !amountIn ? (
                'Enter Amount'
              ) : (
                <>
                  <Zap size={18} />
                  Swap
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
