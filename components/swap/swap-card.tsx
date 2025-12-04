'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownUp, Settings, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSwapStore } from '@/lib/stores/swap-store'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { TokenSelect } from './token-select'
import { SettingsModal } from './settings-modal'
import { DEFAULT_TOKEN_IN, DEFAULT_TOKEN_OUT } from '@/lib/constants/tokens'
import { getPrice } from '@/lib/api/relayer'

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
    swapStatus,
    swapId,
    txHash,
    currentStatus,
    error,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    setSlippage,
    swapTokens,
    resetSwap
  } = useSwapStore()

  const { isStarknetConnected, isZcashConnected } = useWalletStore()
  const { getFormattedBalance, fetchBalances } = useBalanceStore()

  // Swap page is Starknet-only (STRK ↔ VEIL)
  // Filter out non-Starknet tokens
  const isValidSwap = tokenIn?.chain === 'starknet' && tokenOut?.chain === 'starknet'
  
  // Only need Starknet wallet for swaps
  const isConnected = isStarknetConnected

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

  // Auto-calculate output amount when input amount or tokens change
  useEffect(() => {
    const calculateOutput = async () => {
      if (!amountIn || !tokenIn || !tokenOut || parseFloat(amountIn) <= 0) {
        setAmountOut('')
        return
      }

      try {
        const priceData = await getPrice(
          tokenIn.symbol,
          tokenOut.symbol,
          parseFloat(amountIn)
        )
        
        if (priceData.converted_amount !== undefined) {
          // Format to 6 decimal places max
          const formatted = parseFloat(priceData.converted_amount.toFixed(6))
          setAmountOut(formatted.toString())
        } else if (priceData.rate) {
          const calculated = parseFloat(amountIn) * priceData.rate
          const formatted = parseFloat(calculated.toFixed(6))
          setAmountOut(formatted.toString())
        }
      } catch (error) {
        console.error('[SwapCard] Error fetching price:', error)
        // On error, clear output
        setAmountOut('')
      }
    }

    // Debounce the calculation
    const timeoutId = setTimeout(calculateOutput, 300)
    return () => clearTimeout(timeoutId)
  }, [amountIn, tokenIn, tokenOut, setAmountOut])

  const handleSwap = async () => {
    if (!isConnected || !tokenIn || !tokenOut || !amountIn) return
    
    try {
      await swapTokens()
    } catch (error) {
      console.error('[SwapCard] Swap failed:', error)
      // Error is already handled in the store
    }
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

  const canSwap = isConnected && isValidSwap && tokenIn && tokenOut && amountIn && !isSwapping

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
              {tokenIn && (
                <span className='text-xs text-slate-300 bg-slate-700/60 px-2 py-1 rounded-md mr-2'>
                  {tokenIn.chain === 'starknet' ? '◈ Starknet' : 'Ⓩ Zcash'}
                </span>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (tokenIn && isConnected) {
                    const balance = getFormattedBalance(tokenIn)
                    setAmountIn(balance)
                  }
                }}
                className='text-xs text-slate-200 hover:text-white bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer'
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
              {tokenOut && (
                <span className='text-xs text-slate-300 bg-slate-700/60 px-2 py-1 rounded-md mr-2'>
                  {tokenOut.chain === 'starknet' ? '◈ Starknet' : 'Ⓩ Zcash'}
                </span>
              )}
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
                      <span className='text-slate-200 block mb-1'>Rate</span>
                      <div className='font-semibold text-white'>
                        1 ETH = 3,200 USDC
                      </div>
                    </div>
                    <div>
                      <span className='text-slate-200 block mb-1'>
                        Slippage
                      </span>
                      <div className='font-semibold text-white'>
                        {slippage}%
                      </div>
                    </div>
                    <div>
                      <span className='text-slate-200 block mb-1'>
                        Network Fee
                      </span>
                      <div className='font-semibold text-white'>~$0.50</div>
                    </div>
                    <div>
                      <span className='text-slate-200 block mb-1'>
                        Price Impact
                      </span>
                      <div className='font-semibold text-green-400'>~0.01%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invalid swap warning */}
          {!isValidSwap && tokenIn && tokenOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className='mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl'
            >
              <p className='text-xs text-orange-200'>
                ⚠️ Cross-chain swaps not available here. Use the <a href='/bridge' className='text-indigo-400 hover:text-indigo-300 underline'>Bridge page</a> for STRK/VEIL ↔ ZEC!
              </p>
            </motion.div>
          )}

          {/* Wallet connection status */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className='mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl'
            >
              <p className='text-xs text-orange-200'>
                ⚠️ Connect your Starknet wallet to swap
              </p>
            </motion.div>
          )}

          {/* Swap Status Display */}
          <AnimatePresence>
            {isSwapping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-4 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl'
              >
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-indigo-200'>Swap in Progress</span>
                    <span className='text-xs text-indigo-300 capitalize'>{swapStatus}</span>
                  </div>
                  
                  {/* Status steps */}
                  <div className='space-y-2'>
                    <div className={`flex items-center gap-2 text-xs ${swapStatus === 'approving' ? 'text-indigo-200' : swapStatus === 'depositing' || swapStatus === 'initiating' || swapStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                      {swapStatus === 'approving' ? (
                        <Loader2 size={14} className='animate-spin' />
                      ) : (swapStatus === 'depositing' || swapStatus === 'initiating' || swapStatus === 'monitoring') ? (
                        <CheckCircle size={14} />
                      ) : (
                        <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                      )}
                      <span>Approving token spending</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${swapStatus === 'depositing' ? 'text-indigo-200' : swapStatus === 'initiating' || swapStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                      {swapStatus === 'depositing' ? (
                        <Loader2 size={14} className='animate-spin' />
                      ) : (swapStatus === 'initiating' || swapStatus === 'monitoring') ? (
                        <CheckCircle size={14} />
                      ) : (
                        <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                      )}
                      <span>Depositing to pool</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${swapStatus === 'initiating' ? 'text-indigo-200' : swapStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                      {swapStatus === 'initiating' ? (
                        <Loader2 size={14} className='animate-spin' />
                      ) : swapStatus === 'monitoring' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                      )}
                      <span>Initiating swap</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${swapStatus === 'monitoring' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {swapStatus === 'monitoring' ? (
                        <Loader2 size={14} className='animate-spin' />
                      ) : (
                        <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                      )}
                      <span>Processing swap</span>
                      {currentStatus && (
                        <span className='text-indigo-300 ml-2'>({currentStatus})</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className='w-full bg-slate-700/50 rounded-full h-2 mt-3'>
                    <motion.div
                      className='bg-indigo-500 h-2 rounded-full'
                      initial={{ width: '0%' }}
                      animate={{
                        width: swapStatus === 'approving' ? '25%' :
                               swapStatus === 'depositing' ? '50%' :
                               swapStatus === 'initiating' ? '75%' :
                               swapStatus === 'monitoring' ? '90%' :
                               swapStatus === 'completed' ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  {/* Transaction info */}
                  {(txHash || swapId) && (
                    <div className='pt-2 border-t border-indigo-700/50 space-y-1'>
                      {txHash && (
                        <div className='text-xs text-indigo-300 break-all'>
                          TX: <span className='font-mono'>{txHash.slice(0, 20)}...</span>
                        </div>
                      )}
                      {swapId && (
                        <div className='text-xs text-indigo-300 break-all'>
                          Swap ID: <span className='font-mono'>{swapId.slice(0, 30)}...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {swapStatus === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className='mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-xl'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle size={20} className='text-green-400' />
                    <span className='text-sm font-bold text-green-200'>Swap Completed!</span>
                  </div>
                  <button
                    onClick={resetSwap}
                    className='text-xs text-green-300 hover:text-green-200 underline'
                  >
                    New Swap
                  </button>
                </div>
                <div className='text-sm text-green-300 space-y-2'>
                  <div>
                    Successfully swapped <span className='font-semibold text-white'>{amountIn} {tokenIn?.symbol}</span> → <span className='font-semibold text-white'>{amountOut} {tokenOut?.symbol}</span>
                  </div>
                  {txHash && (
                    <div className='text-xs break-all pt-2 border-t border-green-700/50'>
                      Transaction: <span className='font-mono text-green-200'>{txHash}</span>
                    </div>
                  )}
                  {swapId && (
                    <div className='text-xs break-all'>
                      Swap ID: <span className='font-mono text-green-200'>{swapId}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl'
              >
                <div className='flex items-start gap-2 mb-2'>
                  <XCircle size={18} className='text-red-400 mt-0.5' />
                  <div className='flex-1'>
                    <div className='text-sm text-red-200 font-medium mb-1'>Swap Failed</div>
                    <div className='text-xs text-red-300'>{error}</div>
                  </div>
                </div>
                <button
                  onClick={resetSwap}
                  className='text-xs text-red-300 hover:text-red-200 underline'
                >
                  Try Again
                </button>
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
                'Connect Starknet Wallet'
              ) : !isValidSwap && tokenIn && tokenOut ? (
                'Use Bridge for Cross-Chain'
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
                  {swapStatus === 'approving' ? 'Approving...' :
                   swapStatus === 'depositing' ? 'Depositing...' :
                   swapStatus === 'initiating' ? 'Initiating...' :
                   swapStatus === 'monitoring' ? 'Processing...' :
                   'Swapping...'}
                </>
              ) : swapStatus === 'completed' ? (
                <>
                  <CheckCircle size={18} />
                  Swap Again
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
