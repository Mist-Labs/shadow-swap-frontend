'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, Settings, Info, ChevronDown, Copy, Check, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { useTransactionStore } from '@/lib/stores/transaction-store'
import { executeSwap, monitorSwap } from '@/lib/services/swap'
import { TOKENS } from '@/lib/constants/tokens'
import { Account } from 'starknet'

type BridgeDirection = 'starknet_to_zcash' | 'zcash_to_starknet'

// Bridgeable tokens (tokens that can be bridged to/from ZEC)
// Note: VEIL price == STRK price, so both can bridge to ZEC
const BRIDGEABLE_TOKENS = [
  { symbol: 'STRK', name: 'Starknet Token', icon: '◈' },
  { symbol: 'VEIL', name: 'Veil Token', icon: '◉' },
]

export default function BridgePage() {
  const { isStarknetConnected, isZcashConnected, starknetAccount, starknetAddress, zcashWallet } = useWalletStore()
  const { getFormattedBalance } = useBalanceStore()
  const { addTransaction } = useTransactionStore()
  
  const [direction, setDirection] = useState<BridgeDirection>('starknet_to_zcash')
  const [selectedToken, setSelectedToken] = useState(BRIDGEABLE_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  const [isBridging, setIsBridging] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [addressError, setAddressError] = useState('')
  // Bridge status tracking (similar to swap)
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'approving' | 'depositing' | 'initiating' | 'monitoring' | 'completed' | 'failed'>('idle')
  const [bridgeSwapId, setBridgeSwapId] = useState<string | null>(null)
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null)
  const [bridgeCurrentStatus, setBridgeCurrentStatus] = useState<string | null>(null)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  
  // Validate Zcash address
  const validateZcashAddress = (addr: string) => {
    if (!addr) {
      setAddressError('')
      return false
    }
    
    // Basic Zcash address validation
    const isUnified = addr.startsWith('u1') && addr.length >= 40
    const isTransparent = (addr.startsWith('t1') || addr.startsWith('t3')) && addr.length >= 34
    const isShielded = (addr.startsWith('zs1') || addr.startsWith('zc')) && addr.length >= 40
    
    if (isUnified || isTransparent || isShielded) {
      setAddressError('')
      return true
    } else {
      setAddressError('Invalid Zcash address. Must start with u1, t1, t3, zs1, or zc')
      return false
    }
  }
  
  // Validate address on change
  const handleAddressChange = (addr: string) => {
    setCustomAddress(addr)
    if (needsManualAddress && addr.length > 0) {
      validateZcashAddress(addr)
    } else {
      setAddressError('')
    }
  }
  
  // Get the actual token objects from TOKENS array
  const sourceToken = TOKENS.find(
    t => t.symbol === selectedToken.symbol && 
    t.chain === (direction === 'starknet_to_zcash' ? 'starknet' : 'zcash')
  )
  
  // For cross-chain bridge, destination is always ZEC when going to Zcash, or source token when going to Starknet
  const destToken = direction === 'starknet_to_zcash'
    ? TOKENS.find(t => t.symbol === 'ZEC' && t.chain === 'zcash') // Bridge to ZEC
    : TOKENS.find(t => t.symbol === selectedToken.symbol && t.chain === 'starknet') // Bridge from ZEC to selected token
  
  // Auto-set destination address from connected wallet (if available)
  const autoDestinationAddress = direction === 'starknet_to_zcash'
    ? zcashWallet?.address || ''
    : starknetAccount?.address || ''
  
  const displayDestinationAddress = useCustomAddress ? customAddress : autoDestinationAddress
  
  // Check if user can bridge
  const sourceConnected = direction === 'starknet_to_zcash' ? isStarknetConnected : isZcashConnected
  const destConnected = direction === 'starknet_to_zcash' ? isZcashConnected : isStarknetConnected
  
  // For Zcash destination, always require manual address (since wallet not available)
  const needsManualAddress = direction === 'starknet_to_zcash'
  const hasValidDestinationAddress = needsManualAddress 
    ? (customAddress.length > 0 && !addressError) 
    : (destConnected || customAddress.length > 0)
  
  const canBridge = sourceConnected && amount && hasValidDestinationAddress && sourceToken && destToken && parseFloat(amount) > 0
  
  const handleFlipDirection = () => {
    setDirection(prev => 
      prev === 'starknet_to_zcash' ? 'zcash_to_starknet' : 'starknet_to_zcash'
    )
    setAmount('')
    setCustomAddress('')
    // Reset bridge state when flipping
    if (bridgeStatus !== 'idle') {
      resetBridge()
    }
  }
  
  const resetBridge = () => {
    setIsBridging(false)
    setBridgeStatus('idle')
    setBridgeSwapId(null)
    setBridgeTxHash(null)
    setBridgeCurrentStatus(null)
    setBridgeError(null)
    setAmount('')
  }
  
  const handleBridge = async () => {
    // Validate all required fields
    if (!canBridge) {
      console.log('[Bridge] Cannot bridge - validation failed:', {
        sourceConnected,
        amount,
        hasValidDestinationAddress,
        sourceToken: !!sourceToken,
        destToken: !!destToken,
        starknetAccount: !!starknetAccount,
        starknetAddress: !!starknetAddress
      })
      return
    }
    
    if (!sourceToken || !destToken || !starknetAccount || !starknetAddress) {
      console.error('[Bridge] Missing required parameters:', {
        sourceToken: !!sourceToken,
        destToken: !!destToken,
        starknetAccount: !!starknetAccount,
        starknetAddress: !!starknetAddress
      })
      setBridgeError('Missing required parameters. Please check your wallet connection and try again.')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setBridgeError('Please enter a valid amount greater than 0')
      return
    }
    
    setIsBridging(true)
    setBridgeStatus('approving')
    setBridgeError(null)
    
    try {
      console.log('[Bridge] Starting bridge:', {
        direction,
        amount,
        destinationAddress: displayDestinationAddress,
        sourceToken: sourceToken.symbol,
        destToken: destToken.symbol,
        sourceTokenAddress: sourceToken.address,
        destTokenAddress: destToken.address
      })
      
      // Use the swap service for cross-chain bridging - same as swap page
      const result = await executeSwap({
        fromToken: sourceToken.symbol as 'STRK' | 'VEIL' | 'ZEC',
        toToken: destToken.symbol as 'STRK' | 'VEIL' | 'ZEC',
        amount,
        userAddress: starknetAddress,
        account: starknetAccount as Account,
        swapDirection: direction,
        onStatusUpdate: (status) => {
          console.log('[Bridge] Status update:', status)
          setBridgeStatus(status as any)
        }
      })
      
      console.log('[Bridge] Swap executed, swapId:', result.swapId, 'txHash:', result.txHash)
      
      setBridgeSwapId(result.swapId)
      setBridgeTxHash(result.txHash)
      setBridgeStatus('monitoring')
      
      // Add transaction to history
      addTransaction({
        type: 'bridge',
        fromToken: sourceToken.symbol,
        toToken: destToken.symbol,
        amount,
        status: 'pending',
        txHash: result.txHash || undefined,
        swapId: result.swapId,
        direction
      })
      
      // Monitor swap status - same as swap page
      monitorSwap(result.swapId, (status) => {
        console.log('[Bridge] Swap status update:', status)
        const apiStatus = status.data?.status
        setBridgeCurrentStatus(apiStatus)
        const { updateTransaction } = useTransactionStore.getState()
        
        if (apiStatus === 'redeemed') {
          setBridgeStatus('completed')
          setIsBridging(false)
          updateTransaction(result.swapId, { status: 'completed' })
          // Refresh balances
          useBalanceStore.getState().fetchBalances()
        } else if (apiStatus === 'failed' || apiStatus === 'refunded') {
          setBridgeStatus('failed')
          setIsBridging(false)
          setBridgeError(`Bridge ${apiStatus}. Please try again.`)
          updateTransaction(result.swapId, { status: 'failed' })
        } else if (apiStatus === 'locked') {
          // Update to show it's locked
          updateTransaction(result.swapId, { status: 'pending' })
        }
      })
    } catch (error: any) {
      console.error('[Bridge] Bridge error:', error)
      setBridgeStatus('failed')
      setBridgeError(error.message || 'Bridge failed. Please try again.')
      setIsBridging(false)
    }
  }
  
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }
  
  const formatAddress = (addr: string) => {
    if (!addr) return ''
    if (addr.length <= 12) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <PageTransition>
      <div className='min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-12'>
        <div className='max-w-2xl mx-auto px-4'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-8'
          >
            <h1 className='text-4xl font-bold mb-3'>
              <span className='bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent'>
                Cross-Chain Bridge
              </span>
            </h1>
            <p className='text-slate-300'>
              Bridge assets between Starknet and Zcash with privacy
            </p>
            <p className='text-xs text-slate-400 mt-2'>
              💡 Bridge STRK or VEIL to ZEC (1:1 value). Want to swap STRK ↔ VEIL? Use the <a href='/' className='text-indigo-400 hover:text-indigo-300'>Swap page</a>!
            </p>
          </motion.div>

          {/* Bridge Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700'
          >
            {/* Source Chain */}
            <div className='mb-2'>
              <label className='text-sm text-slate-300 mb-2 block'>From</label>
              <div className='bg-slate-700/60 rounded-2xl p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-linear-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold'>
                      {direction === 'starknet_to_zcash' ? '◈' : 'Ⓩ'}
                    </div>
                    <div>
                      <div className='font-semibold text-white'>
                        {direction === 'starknet_to_zcash' ? 'Starknet' : 'Zcash'}
                      </div>
                      {/* Token selector */}
                      <select
                        value={selectedToken.symbol}
                        onChange={(e) => {
                          const token = BRIDGEABLE_TOKENS.find(t => t.symbol === e.target.value)
                          if (token) setSelectedToken(token)
                        }}
                        className='text-xs text-slate-300 bg-slate-600/60 rounded px-2 py-1 outline-none cursor-pointer'
                      >
                        {BRIDGEABLE_TOKENS.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.icon} {token.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {sourceConnected ? (
                    <div className='flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full'>
                      <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                      Connected
                    </div>
                  ) : (
                    <div className='text-xs text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-full'>
                      Not Connected
                    </div>
                  )}
                </div>
                
                <input
                  type='number'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='0.0'
                  className='w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-slate-500'
                  disabled={!sourceConnected}
                />
                
                {sourceConnected && sourceToken && (
                  <div className='text-xs text-slate-300 mt-2'>
                    Balance: {getFormattedBalance(sourceToken, 4)} {selectedToken.symbol}
                  </div>
                )}
              </div>
            </div>

            {/* Flip Button */}
            <div className='relative flex justify-center my-4'>
              <motion.button
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFlipDirection}
                className='p-3 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg cursor-pointer z-10'
              >
                <ArrowRightLeft size={20} className='text-white' />
              </motion.button>
            </div>

            {/* Destination Chain */}
            <div className='mb-4'>
              <label className='text-sm text-slate-300 mb-2 block'>To</label>
              <div className='bg-slate-700/60 rounded-2xl p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-linear-to-br from-violet-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold'>
                      {direction === 'starknet_to_zcash' ? 'Ⓩ' : '◈'}
                    </div>
                    <div>
                      <div className='font-semibold text-white'>
                        {direction === 'starknet_to_zcash' ? 'Zcash' : 'Starknet'}
                      </div>
                      <div className='text-xs text-slate-300'>
                        {selectedToken.icon} {selectedToken.symbol}
                      </div>
                    </div>
                  </div>
                  {destConnected ? (
                    <div className='flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full'>
                      <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                      Connected
                    </div>
                  ) : (
                    <div className='text-xs text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-full'>
                      Not Connected
                    </div>
                  )}
                </div>
                
                <div className='text-3xl font-bold text-white'>
                  {amount || '0.0'}
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm text-slate-300'>
                  Destination Address
                  {needsManualAddress && <span className='text-orange-400 ml-1'>*</span>}
                </label>
                {!needsManualAddress && destConnected && (
                  <button
                    onClick={() => setUseCustomAddress(!useCustomAddress)}
                    className='text-xs text-indigo-400 hover:text-indigo-300 transition-colors'
                  >
                    {useCustomAddress ? 'Use Connected Wallet' : 'Use Custom Address'}
                  </button>
                )}
              </div>
              
              {needsManualAddress ? (
                // Always show input for Zcash destination (wallet not available)
                <div>
                  <input
                    type='text'
                    value={customAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder='Enter Zcash address (u1..., t1..., or zs1...)'
                    className={`w-full bg-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:ring-2 transition-all font-mono text-sm ${
                      addressError ? 'ring-2 ring-red-500/50' : 'focus:ring-indigo-500/50'
                    }`}
                  />
                  {addressError ? (
                    <p className='text-xs text-red-400 mt-2'>
                      ⚠️ {addressError}
                    </p>
                  ) : customAddress && !addressError ? (
                    <p className='text-xs text-green-400 mt-2'>
                      ✓ Valid Zcash address
                    </p>
                  ) : (
                    <p className='text-xs text-slate-400 mt-2'>
                      💡 Enter your Zcash unified (u1...), transparent (t1...), or shielded (zs1...) address
                    </p>
                  )}
                </div>
              ) : (
                // For Starknet destination, allow wallet or custom
                <AnimatePresence mode='wait'>
                  {useCustomAddress ? (
                    <motion.div
                      key='custom'
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type='text'
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder='Enter Starknet address'
                        className='w-full bg-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm'
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key='auto'
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='bg-slate-700/60 rounded-xl px-4 py-3 flex items-center justify-between'
                    >
                      {autoDestinationAddress ? (
                        <>
                          <span className='text-white font-mono text-sm'>
                            {formatAddress(autoDestinationAddress)}
                          </span>
                          <button
                            onClick={() => copyAddress(autoDestinationAddress)}
                            className='p-2 hover:bg-slate-600 rounded-lg transition-colors'
                          >
                            {copiedAddress ? (
                              <Check size={16} className='text-green-400' />
                            ) : (
                              <Copy size={16} className='text-slate-300' />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className='text-slate-400 text-sm'>
                          Connect Starknet wallet
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Info Banner */}
            <div className='mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl'>
              <div className='flex gap-3'>
                <Info size={20} className='text-indigo-400 shrink-0 mt-0.5' />
                <div className='text-sm text-indigo-200'>
                  <p className='font-semibold mb-1'>How Cross-Chain Bridge Works</p>
                  <p className='text-indigo-300/80'>
                    {direction === 'starknet_to_zcash' ? (
                      <>Your <span className='font-semibold'>{selectedToken.symbol}</span> is locked on Starknet and you receive <span className='font-semibold'>ZEC</span> on Zcash (1:1 value).</>
                    ) : (
                      <>Your <span className='font-semibold'>ZEC</span> is locked on Zcash and you receive <span className='font-semibold'>{selectedToken.symbol}</span> on Starknet (1:1 value).</>
                    )}
                    {' '}Secured by HTLCs for atomic swaps.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className='mb-6'>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className='flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors'
              >
                <Settings size={16} />
                Advanced Settings
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='mt-4 space-y-3'
                  >
                    <div>
                      <label className='text-xs text-slate-300 mb-1 block'>
                        Slippage Tolerance
                      </label>
                      <input
                        type='number'
                        defaultValue='0.5'
                        step='0.1'
                        className='w-full bg-slate-700/60 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50'
                      />
                    </div>
                    <div>
                      <label className='text-xs text-slate-300 mb-1 block'>
                        Transaction Deadline (minutes)
                      </label>
                      <input
                        type='number'
                        defaultValue='20'
                        className='w-full bg-slate-700/60 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50'
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bridge Status Display */}
            <AnimatePresence>
              {isBridging && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='mb-4 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl'
                >
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-indigo-200'>Bridge in Progress</span>
                      <span className='text-xs text-indigo-300 capitalize'>{bridgeStatus}</span>
                    </div>
                    
                    {/* Status steps */}
                    <div className='space-y-2'>
                      <div className={`flex items-center gap-2 text-xs ${bridgeStatus === 'approving' ? 'text-indigo-200' : bridgeStatus === 'depositing' || bridgeStatus === 'initiating' || bridgeStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                        {bridgeStatus === 'approving' ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (bridgeStatus === 'depositing' || bridgeStatus === 'initiating' || bridgeStatus === 'monitoring') ? (
                          <CheckCircle size={14} />
                        ) : (
                          <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                        )}
                        <span>Approving token spending</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${bridgeStatus === 'depositing' ? 'text-indigo-200' : bridgeStatus === 'initiating' || bridgeStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                        {bridgeStatus === 'depositing' ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (bridgeStatus === 'initiating' || bridgeStatus === 'monitoring') ? (
                          <CheckCircle size={14} />
                        ) : (
                          <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                        )}
                        <span>Depositing to pool</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${bridgeStatus === 'initiating' ? 'text-indigo-200' : bridgeStatus === 'monitoring' ? 'text-green-300' : 'text-slate-400'}`}>
                        {bridgeStatus === 'initiating' ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : bridgeStatus === 'monitoring' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                        )}
                        <span>Initiating bridge</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${bridgeStatus === 'monitoring' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {bridgeStatus === 'monitoring' ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (
                          <div className='w-3.5 h-3.5 rounded-full border-2 border-slate-500' />
                        )}
                        <span>Processing bridge</span>
                        {bridgeCurrentStatus && (
                          <span className='text-indigo-300 ml-2'>({bridgeCurrentStatus})</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className='w-full bg-slate-700/50 rounded-full h-2 mt-3'>
                      <motion.div
                        className='bg-indigo-500 h-2 rounded-full'
                        initial={{ width: '0%' }}
                        animate={{
                          width: bridgeStatus === 'approving' ? '25%' :
                                 bridgeStatus === 'depositing' ? '50%' :
                                 bridgeStatus === 'initiating' ? '75%' :
                                 bridgeStatus === 'monitoring' ? '90%' :
                                 bridgeStatus === 'completed' ? '100%' : '0%'
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    {/* Transaction info */}
                    {(bridgeTxHash || bridgeSwapId) && (
                      <div className='pt-2 border-t border-indigo-700/50 space-y-1'>
                        {bridgeTxHash && (
                          <div className='text-xs text-indigo-300 break-all'>
                            TX: <span className='font-mono'>{bridgeTxHash.slice(0, 20)}...</span>
                          </div>
                        )}
                        {bridgeSwapId && (
                          <div className='text-xs text-indigo-300 break-all'>
                            Swap ID: <span className='font-mono'>{bridgeSwapId.slice(0, 30)}...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {bridgeStatus === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className='mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-xl'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle size={20} className='text-green-400' />
                      <span className='text-sm font-bold text-green-200'>Bridge Completed!</span>
                    </div>
                    <button
                      onClick={resetBridge}
                      className='text-xs text-green-300 hover:text-green-200 underline'
                    >
                      New Bridge
                    </button>
                  </div>
                  <div className='text-sm text-green-300 space-y-2'>
                    <div>
                      Successfully bridged <span className='font-semibold text-white'>{amount} {sourceToken?.symbol}</span> → <span className='font-semibold text-white'>{amount} {destToken?.symbol}</span>
                    </div>
                    {bridgeTxHash && (
                      <div className='text-xs break-all pt-2 border-t border-green-700/50'>
                        Transaction: <span className='font-mono text-green-200'>{bridgeTxHash}</span>
                      </div>
                    )}
                    {bridgeSwapId && (
                      <div className='text-xs break-all'>
                        Swap ID: <span className='font-mono text-green-200'>{bridgeSwapId}</span>
                      </div>
                    )}
                    {displayDestinationAddress && (
                      <div className='text-xs break-all pt-2 border-t border-green-700/50'>
                        Destination: <span className='font-mono text-green-200'>{displayDestinationAddress}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {bridgeError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl'
                >
                  <div className='flex items-start gap-2 mb-2'>
                    <XCircle size={18} className='text-red-400 mt-0.5' />
                    <div className='flex-1'>
                      <div className='text-sm text-red-200 font-medium mb-1'>Bridge Failed</div>
                      <div className='text-xs text-red-300'>{bridgeError}</div>
                    </div>
                  </div>
                  <button
                    onClick={resetBridge}
                    className='text-xs text-red-300 hover:text-red-200 underline'
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bridge Button */}
            <motion.button
              whileHover={{ scale: canBridge && !isBridging ? 1.02 : 1 }}
              whileTap={{ scale: canBridge && !isBridging ? 0.98 : 1 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[Bridge] Button clicked:', { canBridge, isBridging, sourceToken: !!sourceToken, destToken: !!destToken })
                if (canBridge && !isBridging) {
                  handleBridge()
                } else {
                  console.log('[Bridge] Button disabled - cannot bridge:', {
                    canBridge,
                    isBridging,
                    sourceConnected,
                    amount,
                    hasValidDestinationAddress,
                    sourceToken: !!sourceToken,
                    destToken: !!destToken
                  })
                }
              }}
              disabled={!canBridge || isBridging || bridgeStatus === 'completed'}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                canBridge && !isBridging && bridgeStatus !== 'completed'
                  ? 'bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isBridging ? (
                <>
                  <Loader2 size={20} className='animate-spin' />
                  {bridgeStatus === 'approving' ? 'Approving...' :
                   bridgeStatus === 'depositing' ? 'Depositing...' :
                   bridgeStatus === 'initiating' ? 'Initiating...' :
                   bridgeStatus === 'monitoring' ? 'Processing...' :
                   'Bridging...'}
                </>
              ) : bridgeStatus === 'completed' ? (
                <>
                  <CheckCircle size={20} />
                  Bridge Again
                </>
              ) : !sourceConnected ? (
                `Connect ${direction === 'starknet_to_zcash' ? 'Starknet' : 'Zcash'} Wallet`
              ) : !amount ? (
                'Enter Amount'
              ) : !hasValidDestinationAddress ? (
                needsManualAddress 
                  ? (addressError ? 'Invalid Zcash Address' : 'Enter Zcash Address')
                  : 'Enter Destination Address'
              ) : (
                'Bridge Assets'
              )}
            </motion.button>

            {/* Warnings */}
            {needsManualAddress && !customAddress && (
              <div className='mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg'>
                <p className='text-xs text-orange-200'>
                  ⚠️ Zcash wallet integration coming soon! Please enter your Zcash address manually to receive funds.
                </p>
              </div>
            )}
            {!needsManualAddress && !destConnected && !useCustomAddress && (
              <div className='mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg'>
                <p className='text-xs text-orange-200'>
                  💡 Tip: Connect your Starknet wallet or provide a custom address to receive funds
                </p>
              </div>
            )}
          </motion.div>

          {/* Bridge Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='mt-8 grid grid-cols-3 gap-4'
          >
            {[
              { label: 'Bridge Fee', value: '0.1%' },
              { label: 'Est. Time', value: '~5 min' },
              { label: 'Min. Amount', value: '0.01' }
            ].map((stat, index) => (
              <div
                key={stat.label}
                className='bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700'
              >
                <div className='text-lg font-bold text-white mb-1'>{stat.value}</div>
                <div className='text-xs text-slate-300'>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
