'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, Lock, ArrowDownUp, Loader2, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/layout/page-transition'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { useTransactionStore } from '@/lib/stores/transaction-store'
import { CONTRACTS } from '@/lib/constants/contracts'
import { TOKENS } from '@/lib/constants/tokens'
import { getPoolBalance, getAllPoolBalances, depositToPool, getCurrentRoot, getNextLeafIndex, getPoolStats, type PoolType, type PoolStats } from '@/lib/services/pool'
import { generateSwapParameters, toWei, fromWei } from '@/lib/utils/crypto'
import { Account } from 'starknet'

export default function PoolsPage () {
  const { isStarknetConnected, starknetAccount, starknetAddress } = useWalletStore()
  const { getFormattedBalance, fetchBalances } = useBalanceStore()
  const { addTransaction, getRecentTransactions } = useTransactionStore()
  
  const [selectedPool, setSelectedPool] = useState<PoolType>('fast')
  const [selectedToken, setSelectedToken] = useState<'STRK' | 'VEIL'>('STRK')
  const [amount, setAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [poolBalances, setPoolBalances] = useState<Record<string, string>>({})
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  // Store balances for both pools separately - must be declared before use
  const [fastPoolBalances, setFastPoolBalances] = useState<Record<string, string>>({})
  const [standardPoolBalances, setStandardPoolBalances] = useState<Record<string, string>>({})
  // Store pool stats
  const [fastPoolStats, setFastPoolStats] = useState<PoolStats | null>(null)
  const [standardPoolStats, setStandardPoolStats] = useState<PoolStats | null>(null)
  
  // Fetch pool balances for both pools
  useEffect(() => {
    if (isStarknetConnected) {
      fetchAllPoolBalances()
    }
  }, [isStarknetConnected])
  
  // Debug: Log transactions when component mounts or updates
  useEffect(() => {
    const allTransactions = getRecentTransactions(1000)
    console.log('[Pools] All transactions from store:', allTransactions)
    const deposits = allTransactions.filter(tx => tx.type === 'deposit')
    console.log('[Pools] Deposit transactions:', deposits)
  }, [getRecentTransactions])
  
  const fetchAllPoolBalances = async () => {
    setIsLoadingBalances(true)
    try {
      const tokenAddresses = [CONTRACTS.STRK_TOKEN, CONTRACTS.VEIL_TOKEN]
      
      // Fetch full stats for both pools (includes balances, root, leaf index)
      const [fastStats, standardStats] = await Promise.all([
        getPoolStats('fast', tokenAddresses),
        getPoolStats('standard', tokenAddresses)
      ])
      
      // Store stats
      setFastPoolStats(fastStats)
      setStandardPoolStats(standardStats)
      
      // Store balances separately for each pool
      const fastMap: Record<string, string> = {}
      const standardMap: Record<string, string> = {}
      
      fastStats.balances.forEach(b => {
        fastMap[b.token] = b.balance
      })
      
      standardStats.balances.forEach(b => {
        standardMap[b.token] = b.balance
      })
      
      setFastPoolBalances(fastMap)
      setStandardPoolBalances(standardMap)
      
      // Set current pool's balances for display
      setPoolBalances(selectedPool === 'fast' ? fastMap : standardMap)
    } catch (error) {
      console.error('Error fetching pool balances:', error)
    } finally {
      setIsLoadingBalances(false)
    }
  }
  
  // Update displayed balances when pool selection changes
  useEffect(() => {
    if (selectedPool === 'fast') {
      setPoolBalances(fastPoolBalances)
    } else {
      setPoolBalances(standardPoolBalances)
    }
  }, [selectedPool, fastPoolBalances, standardPoolBalances])
  
  const handleDeposit = async () => {
    if (!starknetAccount || !starknetAddress || !amount) return
    
    setIsDepositing(true)
    try {
      const tokenAddress = selectedToken === 'STRK' ? CONTRACTS.STRK_TOKEN : CONTRACTS.VEIL_TOKEN
      const amountWei = toWei(amount)
      
      // Generate privacy parameters
      const { commitment } = await generateSwapParameters(amountWei)
      
      // Deposit to pool
      const txHash = await depositToPool({
        account: starknetAccount as Account,
        poolType: selectedPool,
        tokenAddress,
        commitment,
        amount: amountWei
      })
      
      // Add transaction
      const txId = addTransaction({
        type: 'deposit',
        fromToken: selectedToken,
        toToken: selectedToken,
        amount,
        status: 'completed',
        txHash
      })
      console.log('[Pools] Added deposit transaction:', { txId, amount, selectedToken, selectedPool })
      
      // Refresh balances
      await fetchBalances()
      await fetchAllPoolBalances()
      
      setShowModal(false)
      setAmount('')
      alert('Deposit successful!')
    } catch (error: any) {
      console.error('Deposit error:', error)
      alert(`Deposit failed: ${error.message || 'Please try again.'}`)
    } finally {
      setIsDepositing(false)
    }
  }
  
  const formatBalance = (balance: string): string => {
    // Balance is in wei (18 decimals), convert to human-readable
    const humanReadable = fromWei(balance, 18)
    const num = parseFloat(humanReadable)
    if (num === 0) return '0'
    if (num < 0.0001) return '< 0.0001'
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }
  
  const getTokenSymbol = (address: string): string => {
    if (address === CONTRACTS.STRK_TOKEN) return 'STRK'
    if (address === CONTRACTS.VEIL_TOKEN) return 'VEIL'
    return 'Unknown'
  }
  
  // Format root for display
  const formatRoot = (root: string): string => {
    if (!root || root === '0x0') return 'No deposits yet'
    return `${root.slice(0, 10)}...${root.slice(-8)}`
  }
  
  // Calculate TVL for each pool separately (total from all users)
  const getPoolTVL = (poolType: PoolType): string => {
    if (isLoadingBalances) return 'Loading...'
    
    // Use the correct pool's balances (in wei)
    const balances = poolType === 'fast' ? fastPoolBalances : standardPoolBalances
    const strkBalanceWei = balances[CONTRACTS.STRK_TOKEN] || '0'
    const veilBalanceWei = balances[CONTRACTS.VEIL_TOKEN] || '0'
    
    // Check if balances are > 0 (in wei)
    const strkBigInt = BigInt(strkBalanceWei)
    const veilBigInt = BigInt(veilBalanceWei)
    
    if (strkBigInt === BigInt(0) && veilBigInt === BigInt(0)) {
      return '0'
    }
    
    // Show actual token amounts, not USD
    const parts: string[] = []
    if (strkBigInt > BigInt(0)) {
      parts.push(`${formatBalance(strkBalanceWei)} STRK`)
    }
    if (veilBigInt > BigInt(0)) {
      parts.push(`${formatBalance(veilBalanceWei)} VEIL`)
    }
    
    return parts.length > 0 ? parts.join(' + ') : '0'
  }
  
  // Calculate user's individual liquidity (their deposits only)
  const getUserLiquidity = (poolType: PoolType): string => {
    if (!isStarknetConnected || !starknetAddress) return '0'
    
    try {
      // Get all deposit transactions for this user
      const allTransactions = getRecentTransactions(1000) // Get all transactions
      console.log('[Pools] All transactions:', allTransactions)
      
      const userDeposits = allTransactions.filter(tx => 
        tx.type === 'deposit' && 
        tx.status === 'completed'
      )
      
      console.log('[Pools] User deposits:', userDeposits)
      
      // Note: In a real implementation, we'd need to track which pool each deposit went to
      // For now, we'll sum all deposits. In the future, we could add a poolType field to transactions
      const strkDeposits = userDeposits
        .filter(tx => tx.fromToken === 'STRK')
        .reduce((sum, tx) => {
          const amount = parseFloat(tx.amount || '0')
          console.log('[Pools] STRK deposit:', tx.amount, 'parsed:', amount)
          return sum + amount
        }, 0)
      
      const veilDeposits = userDeposits
        .filter(tx => tx.fromToken === 'VEIL')
        .reduce((sum, tx) => {
          const amount = parseFloat(tx.amount || '0')
          console.log('[Pools] VEIL deposit:', tx.amount, 'parsed:', amount)
          return sum + amount
        }, 0)
      
      console.log('[Pools] Total STRK deposits:', strkDeposits, 'Total VEIL deposits:', veilDeposits)
      
      if (strkDeposits === 0 && veilDeposits === 0) {
        return '0'
      }
      
      const parts: string[] = []
      if (strkDeposits > 0) {
        parts.push(`${strkDeposits.toLocaleString(undefined, { maximumFractionDigits: 4 })} STRK`)
      }
      if (veilDeposits > 0) {
        parts.push(`${veilDeposits.toLocaleString(undefined, { maximumFractionDigits: 4 })} VEIL`)
      }
      
      return parts.length > 0 ? parts.join(' + ') : '0'
    } catch (error) {
      console.error('[Pools] Error calculating user liquidity:', error)
      return '0'
    }
  }
  
  const pools = [
    {
      name: 'Fast Pool',
      type: 'fast' as PoolType,
      description: 'Fast settlement with lower privacy guarantees',
      tvl: getPoolTVL('fast'),
      fee: '0.1%',
      balances: fastPoolBalances,
      stats: fastPoolStats
    },
    {
      name: 'Standard Pool',
      type: 'standard' as PoolType,
      description: 'Standard settlement with full privacy guarantees',
      tvl: getPoolTVL('standard'),
      fee: '0.3%',
      balances: standardPoolBalances,
      stats: standardPoolStats
    }
  ]

  return (
    <PageTransition>
      <div className='min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-12'>
        <div className='max-w-7xl mx-auto px-4'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8 flex items-center justify-between'
          >
            <div>
              <h1 className='text-4xl font-bold text-white mb-2'>
                Liquidity Pools
              </h1>
              <p className='text-slate-400'>
                Provide liquidity to privacy pools and earn fees
              </p>
            </div>
            {isStarknetConnected && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab('deposit')
                  setShowModal(true)
                }}
                className='flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30'
              >
                <Plus size={20} />
                Add Liquidity
              </motion.button>
            )}
          </motion.div>

          {/* Single Pool Card with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-slate-600/50'
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Pool Selection Tabs */}
            <div className='flex gap-2 mb-6 bg-slate-700/50 rounded-xl p-1'>
              {pools.map((pool) => (
                <button
                  key={pool.type}
                  onClick={() => setSelectedPool(pool.type)}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    selectedPool === pool.type
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <span className='text-lg'>{pool.type === 'fast' ? '⚡' : '🔒'}</span>
                  <div className='text-left'>
                    <div className='font-bold'>{pool.name}</div>
                    <div className='text-xs opacity-80'>{pool.fee}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Pool Content */}
            <AnimatePresence mode='wait'>
              {pools
                .filter(pool => pool.type === selectedPool)
                .map((pool) => (
                  <motion.div
                    key={pool.type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className='space-y-4'
                  >
                    {/* Pool Description */}
                    <div className='flex items-center gap-2 mb-4'>
                      <Lock size={14} className='text-slate-400' />
                      <span className='text-sm text-slate-400'>
                        {pool.description}
                      </span>
                    </div>

                    {/* Total Value Locked (All Users) */}
                    <div className='bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 rounded-xl p-4 mb-4'>
                      <div className='text-xs text-slate-400 mb-2 flex items-center gap-1'>
                        <TrendingUp size={12} />
                        Total Value Locked
                      </div>
                      <div className='text-2xl font-bold text-white'>
                        {isLoadingBalances ? (
                          <Loader2 size={20} className='animate-spin inline' />
                        ) : (
                          <span className='break-words'>{pool.tvl}</span>
                        )}
                      </div>
                      <div className='text-xs text-slate-400 mt-1'>
                        Total from all users
                      </div>
                    </div>

                    {/* Your Liquidity (User's Individual Deposits) */}
                    {isStarknetConnected && (
                      <div className='bg-gradient-to-br from-violet-500/20 to-pink-600/20 border border-violet-500/30 rounded-xl p-4 mb-4'>
                        <div className='text-xs text-slate-400 mb-2 flex items-center gap-1'>
                          <Wallet size={12} />
                          Your Liquidity
                        </div>
                        <div className='text-xl font-bold text-white'>
                          {getUserLiquidity(pool.type)}
                        </div>
                        <div className='text-xs text-slate-400 mt-1'>
                          Your deposits to this pool
                        </div>
                      </div>
                    )}
                    
                    {/* Pool Stats Grid */}
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='bg-slate-600/40 rounded-lg p-3 border border-slate-500/30'>
                        <div className='text-xs text-slate-400 mb-1'>Total Deposits</div>
                        <div className='text-lg font-bold text-white'>
                          {isLoadingBalances ? (
                            <Loader2 size={16} className='animate-spin inline' />
                          ) : (
                            pool.stats?.nextLeafIndex ?? 0
                          )}
                        </div>
                      </div>
                      <div className='bg-slate-600/40 rounded-lg p-3 border border-slate-500/30'>
                        <div className='text-xs text-slate-400 mb-1'>Fee</div>
                        <div className='text-lg font-bold text-indigo-400'>
                          {pool.fee}
                        </div>
                      </div>
                    </div>
                    
                    {/* Merkle Root */}
                    {pool.stats && (
                      <div className='bg-slate-600/40 rounded-lg p-3 border border-slate-500/30'>
                        <div className='text-xs text-slate-400 mb-1 flex items-center gap-1'>
                          <Lock size={10} />
                          Merkle Root
                        </div>
                        <div className='text-xs font-mono text-slate-300 break-all'>
                          {formatRoot(pool.stats.currentRoot)}
                        </div>
                      </div>
                    )}
                    
                    {/* Token Balances */}
                    <div className='pt-3 border-t border-slate-600'>
                      <div className='text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between'>
                        <span>Token Balances</span>
                        {pool.stats && (
                          <span className='text-xs text-slate-400 font-normal'>
                            {pool.stats.balances.length} {pool.stats.balances.length === 1 ? 'token' : 'tokens'}
                          </span>
                        )}
                      </div>
                      <div className='space-y-2'>
                        {[CONTRACTS.STRK_TOKEN, CONTRACTS.VEIL_TOKEN].map(tokenAddress => {
                          const balanceWei = pool.balances[tokenAddress] || '0'
                          const symbol = getTokenSymbol(tokenAddress)
                          // Check if balance > 0 in wei
                          const balanceBigInt = BigInt(balanceWei)
                          const hasBalance = balanceBigInt > BigInt(0)
                          
                          return (
                            <div key={tokenAddress} className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                              hasBalance ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-600/30'
                            }`}>
                              <div className='flex items-center gap-2'>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                                  hasBalance 
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600' 
                                    : 'bg-slate-600'
                                }`}>
                                  {symbol[0]}
                                </div>
                                <span className='text-sm font-medium text-slate-200'>{symbol}</span>
                              </div>
                              <span className='text-sm font-bold text-white'>
                                {isLoadingBalances ? (
                                  <Loader2 size={14} className='animate-spin inline' />
                                ) : hasBalance ? (
                                  formatBalance(balanceWei)
                                ) : (
                                  <span className='text-slate-500'>0</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className='pt-4 border-t border-slate-600'>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTab('deposit')
                          setShowModal(true)
                        }}
                        disabled={!isStarknetConnected}
                        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                          isStarknetConnected
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus size={18} />
                        {isStarknetConnected ? 'Deposit to Pool' : 'Connect Wallet'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
          
          {/* Pool Actions Modal */}
          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
                onClick={() => !isDepositing && setShowModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className='bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700'
                >
                  {/* Pool Selection Tabs */}
                  <div className='flex gap-2 mb-4 bg-slate-700/50 rounded-xl p-1'>
                    <button
                      onClick={() => setSelectedPool('fast')}
                      disabled={isDepositing}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        selectedPool === 'fast'
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>⚡</span>
                      Fast Pool
                    </button>
                    <button
                      onClick={() => setSelectedPool('standard')}
                      disabled={isDepositing}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        selectedPool === 'standard'
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>🔒</span>
                      Standard Pool
                    </button>
                  </div>

                  {/* Action Tabs (Deposit/Withdraw) */}
                  <div className='flex gap-2 mb-6 bg-slate-700/50 rounded-xl p-1'>
                    <button
                      onClick={() => setActiveTab('deposit')}
                      disabled={isDepositing}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'deposit'
                          ? 'bg-violet-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => setActiveTab('withdraw')}
                      disabled={isDepositing}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'withdraw'
                          ? 'bg-violet-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode='wait'>
                    {activeTab === 'deposit' ? (
                      <motion.div
                        key='deposit'
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2 className='text-2xl font-bold text-white mb-4'>
                          Deposit to {selectedPool === 'fast' ? 'Fast Pool' : 'Standard Pool'}
                        </h2>
                        
                        <div className='space-y-4'>
                          <div>
                            <label className='text-sm text-slate-300 mb-2 block'>Token</label>
                            <select
                              value={selectedToken}
                              onChange={(e) => setSelectedToken(e.target.value as 'STRK' | 'VEIL')}
                              className='w-full bg-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500'
                              disabled={isDepositing}
                            >
                              <option value='STRK'>STRK</option>
                              <option value='VEIL'>VEIL</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className='text-sm text-slate-300 mb-2 block'>Amount</label>
                            <input
                              type='number'
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder='0.0'
                              className='w-full bg-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500'
                              disabled={isDepositing}
                            />
                            {isStarknetConnected && (
                              <div className='text-xs text-slate-400 mt-1'>
                                Balance: {getFormattedBalance(
                                  TOKENS.find(t => t.symbol === selectedToken && t.chain === 'starknet')!,
                                  4
                                )} {selectedToken}
                              </div>
                            )}
                          </div>
                          
                          <div className='flex gap-3 pt-4'>
                            <button
                              onClick={() => setShowModal(false)}
                              disabled={isDepositing}
                              className='flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-colors disabled:opacity-50'
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeposit}
                              disabled={!amount || isDepositing || !isStarknetConnected}
                              className='flex-1 px-4 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                            >
                              {isDepositing ? (
                                <>
                                  <Loader2 size={20} className='animate-spin' />
                                  Depositing...
                                </>
                              ) : (
                                'Deposit'
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key='withdraw'
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2 className='text-2xl font-bold text-white mb-4'>
                          Withdraw from {selectedPool === 'fast' ? 'Fast Pool' : 'Standard Pool'}
                        </h2>
                        
                        <div className='space-y-4'>
                          <div>
                            <label className='text-sm text-slate-300 mb-2 block'>Token</label>
                            <select
                              value={selectedToken}
                              onChange={(e) => setSelectedToken(e.target.value as 'STRK' | 'VEIL')}
                              className='w-full bg-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500'
                              disabled={isDepositing}
                            >
                              <option value='STRK'>STRK</option>
                              <option value='VEIL'>VEIL</option>
                            </select>
                          </div>
                          
                          <div className='p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl'>
                            <p className='text-sm text-indigo-200'>
                              💡 Withdrawal functionality requires nullifier and merkle proof. This feature will be available soon.
                            </p>
                          </div>
                          
                          <div className='flex gap-3 pt-4'>
                            <button
                              onClick={() => setShowModal(false)}
                              disabled={isDepositing}
                              className='flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-colors disabled:opacity-50'
                            >
                              Cancel
                            </button>
                            <button
                              disabled={true}
                              className='flex-1 px-4 py-3 bg-slate-600 text-slate-400 rounded-xl font-semibold cursor-not-allowed'
                            >
                              Coming Soon
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
