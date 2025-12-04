'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp, History, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useBalanceStore } from '@/lib/stores/balance-store'
import { useTransactionStore } from '@/lib/stores/transaction-store'
import { TOKENS } from '@/lib/constants/tokens'
import { PageTransition } from '@/components/layout/page-transition'

export default function PortfolioPage () {
  const {
    isStarknetConnected,
    isZcashConnected,
    starknetAddress,
    zcashWallet
  } = useWalletStore()
  const { getFormattedBalance, fetchBalances } = useBalanceStore()
  const { getRecentTransactions } = useTransactionStore()
  const isConnected = isStarknetConnected || isZcashConnected
  const [isPrivate, setIsPrivate] = useState(true)
  
  // Get real transaction history
  const transactions = getRecentTransactions(20).map(tx => {
    const timeAgo = getTimeAgo(tx.timestamp)
    return {
      type: tx.type === 'swap' ? 'Swap' : tx.type === 'bridge' ? 'Bridge' : tx.type === 'deposit' ? 'Deposit' : 'Withdraw',
      from: tx.fromToken,
      to: tx.toToken,
      amount: parseFloat(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 4 }),
      time: timeAgo,
      status: tx.status === 'completed' ? 'Completed' : tx.status === 'failed' ? 'Failed' : 'Pending',
      txHash: tx.txHash,
      swapId: tx.swapId
    }
  })

  // Fetch balances when component mounts or wallet connects
  useEffect(() => {
    if (isConnected) {
      fetchBalances()
    }
  }, [isConnected, fetchBalances])

  // Get tokens with balances - show actual amounts, no fake USD values
  const tokens = TOKENS.map(token => {
    const amount = isConnected ? getFormattedBalance(token, 4) : '0'
    return {
      token,
      symbol: token.symbol,
      amount,
      chain: token.chain
    }
  }).filter(t => parseFloat(t.amount) > 0 || !isConnected) // Show all if not connected, only non-zero if connected

  // Helper function to format time ago
  function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    const weeks = Math.floor(days / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  
  // Calculate total portfolio value - just sum of all token amounts (no fake USD)
  const totalTokens = tokens.reduce((sum, tokenData) => {
    const amount = parseFloat(tokenData.amount) || 0
    return sum + amount
  }, 0)

  if (!isConnected) {
    return (
      <PageTransition>
        <div className='min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='text-center p-8 bg-slate-700/80 backdrop-blur-sm rounded-2xl shadow-lg'
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Wallet size={48} className='mx-auto mb-4 text-slate-400' />
            <h2 className='text-2xl font-bold text-white mb-2'>
              Connect Your Wallet
            </h2>
            <p className='text-slate-400'>
              Connect your wallet to view your portfolio
            </p>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

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
              <h1 className='text-4xl font-bold text-white mb-2'>Portfolio</h1>
              <p className='text-slate-400'>
                Manage your assets and track your performance
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPrivate(!isPrivate)}
              className='flex items-center gap-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl transition-colors cursor-pointer'
              style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
            >
              {isPrivate ? (
                <EyeOff size={20} className='text-slate-300' />
              ) : (
                <Eye size={20} className='text-slate-300' />
              )}
              <span className='font-medium text-slate-300'>
                {isPrivate ? 'Show' : 'Hide'}
              </span>
            </motion.button>
          </motion.div>

          {/* Total Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-linear-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 mb-8 text-white shadow-xl'
          >
            <div className='text-sm opacity-90 mb-2'>Total Assets</div>
            <div className='text-5xl font-bold mb-2'>
              {isPrivate ? '••••••' : `${totalTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens`}
            </div>
            <div className='flex items-center gap-2 text-sm opacity-90'>
              <Wallet size={16} />
              <span>{tokens.length} {tokens.length === 1 ? 'asset' : 'assets'}</span>
            </div>
          </motion.div>

          {/* Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-700/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8'
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h2 className='text-2xl font-bold text-white mb-6'>Your Assets</h2>
            <div className='space-y-4'>
              {tokens.length === 0 ? (
                <div className='text-center py-8 text-slate-400'>
                  {isConnected
                    ? 'No tokens found in your wallet'
                    : 'Connect your wallet to view balances'}
                </div>
              ) : (
                tokens.map((tokenData, index) => (
                  <motion.div
                    key={tokenData.token.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className='flex items-center justify-between p-4 bg-slate-600/50 rounded-xl hover:bg-slate-500/50 transition-colors cursor-pointer'
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold'>
                        {tokenData.symbol[0]}
                      </div>
                      <div>
                        <div className='font-bold text-white'>
                          {tokenData.symbol}
                        </div>
                        <div className='text-xs text-slate-400'>
                          {tokenData.chain}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-bold text-white'>
                        {isPrivate ? '•••' : tokenData.amount}
                      </div>
                      <div className='text-sm text-slate-400'>
                        {tokenData.symbol}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-slate-700/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg'
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className='flex items-center gap-2 mb-6'>
              <History size={24} className='text-slate-400' />
              <h2 className='text-2xl font-bold text-white'>
                Transaction History
              </h2>
            </div>
            <div className='space-y-3'>
              {transactions.length === 0 ? (
                <div className='text-center py-8 text-slate-400'>
                  No transactions yet
                </div>
              ) : (
                transactions.map((tx, index) => (
                  <motion.div
                    key={tx.txHash || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className='flex items-center justify-between p-4 bg-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-500/50 transition-colors'
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-white'>{tx.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'Failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className='text-sm text-slate-400 mt-1'>
                        {tx.from} → {tx.to}
                      </div>
                      {tx.txHash && (
                        <div className='text-xs text-slate-500 mt-1 font-mono'>
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </div>
                      )}
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold text-white'>
                        {isPrivate ? '•••' : tx.amount}
                      </div>
                      <div className='text-sm text-slate-400'>{tx.time}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
