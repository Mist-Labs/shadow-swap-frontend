'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp, History, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { PageTransition } from '@/components/layout/page-transition'

export default function PortfolioPage () {
  const { isConnected, address } = useWalletStore()
  const [isPrivate, setIsPrivate] = useState(true)

  const tokens = [
    { symbol: 'ETH', amount: '2.45', value: '$5,234', change: '+5.2%' },
    { symbol: 'USDC', amount: '12,450', value: '$12,450', change: '+0.1%' },
    { symbol: 'STRK', amount: '8,234', value: '$3,456', change: '-2.3%' },
    { symbol: 'ZEC', amount: '156', value: '$2,345', change: '+12.5%' }
  ]

  const transactions = [
    {
      type: 'Swap',
      from: 'ETH',
      to: 'USDC',
      amount: '1.5',
      time: '2 hours ago',
      status: 'Completed'
    },
    {
      type: 'Add Liquidity',
      from: 'ETH',
      to: 'USDC',
      amount: '2.0',
      time: '1 day ago',
      status: 'Completed'
    },
    {
      type: 'Swap',
      from: 'STRK',
      to: 'ETH',
      amount: '5,000',
      time: '3 days ago',
      status: 'Completed'
    }
  ]

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
            <div className='text-sm opacity-90 mb-2'>Total Portfolio Value</div>
            <div className='text-5xl font-bold mb-2'>
              {isPrivate ? '••••••' : '$23,485'}
            </div>
            <div className='flex items-center gap-2 text-sm opacity-90'>
              <TrendingUp size={16} />
              <span>+8.5% (24h)</span>
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
              {tokens.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className='flex items-center justify-between p-4 bg-slate-600/50 rounded-xl hover:bg-slate-500/50 transition-colors cursor-pointer'
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold'>
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className='font-bold text-white'>{token.symbol}</div>
                      <div className='text-sm text-slate-400'>
                        {isPrivate ? '•••' : token.amount}
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-bold text-white'>
                      {isPrivate ? '••••' : token.value}
                    </div>
                    <div
                      className={`text-sm ${
                        token.change.startsWith('+')
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {token.change}
                    </div>
                  </div>
                </motion.div>
              ))}
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
              {transactions.map((tx, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className='flex items-center justify-between p-4 bg-slate-600/50 rounded-xl cursor-pointer'
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  <div>
                    <div className='font-semibold text-white'>{tx.type}</div>
                    <div className='text-sm text-slate-400'>
                      {tx.from} → {tx.to}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-semibold text-white'>
                      {isPrivate ? '•••' : tx.amount}
                    </div>
                    <div className='text-sm text-slate-400'>{tx.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
