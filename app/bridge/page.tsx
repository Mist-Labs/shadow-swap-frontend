'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, Settings, Info, ChevronDown, Copy, Check } from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { TOKENS } from '@/lib/constants/tokens'

type BridgeDirection = 'starknet_to_zcash' | 'zcash_to_starknet'

// Bridgeable tokens (tokens that can be bridged to/from ZEC)
// Note: VEIL price == STRK price, so both can bridge to ZEC
const BRIDGEABLE_TOKENS = [
  { symbol: 'STRK', name: 'Starknet Token', icon: '◈' },
  { symbol: 'VEIL', name: 'Veil Token', icon: '◉' },
]

export default function BridgePage() {
  const { isStarknetConnected, isZcashConnected, starknetAccount, zcashWallet } = useWalletStore()
  
  const [direction, setDirection] = useState<BridgeDirection>('starknet_to_zcash')
  const [selectedToken, setSelectedToken] = useState(BRIDGEABLE_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  const [isBridging, setIsBridging] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [addressError, setAddressError] = useState('')
  
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
  
  const destToken = TOKENS.find(
    t => t.symbol === selectedToken.symbol && 
    t.chain === (direction === 'starknet_to_zcash' ? 'zcash' : 'starknet')
  )
  
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
  
  const canBridge = sourceConnected && amount && hasValidDestinationAddress
  
  const handleFlipDirection = () => {
    setDirection(prev => 
      prev === 'starknet_to_zcash' ? 'zcash_to_starknet' : 'starknet_to_zcash'
    )
    setAmount('')
    setCustomAddress('')
  }
  
  const handleBridge = async () => {
    if (!canBridge) return
    
    setIsBridging(true)
    try {
      // TODO: Implement bridge logic using relayer API
      console.log('Bridging:', {
        direction,
        amount,
        destinationAddress: displayDestinationAddress,
        sourceToken: sourceToken?.symbol,
        destToken: destToken?.symbol
      })
      
      // This will use the same swap logic but with cross-chain direction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Bridge initiated! Check your destination wallet.')
    } catch (error) {
      console.error('Bridge error:', error)
      alert('Bridge failed. Please try again.')
    } finally {
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
                
                {sourceConnected && (
                  <div className='text-xs text-slate-300 mt-2'>
                    Balance: 0.00 {selectedToken.symbol}
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

            {/* Bridge Button */}
            <motion.button
              whileHover={{ scale: canBridge ? 1.02 : 1 }}
              whileTap={{ scale: canBridge ? 0.98 : 1 }}
              onClick={handleBridge}
              disabled={!canBridge || isBridging}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                canBridge
                  ? 'bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isBridging ? (
                <>
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Bridging...
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
