'use client'

import { motion } from 'framer-motion'
import { Plus, TrendingUp, Lock } from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'

export default function PoolsPage () {
  const pools = [
    {
      pair: 'ETH / USDC',
      tvl: '$1.2M',
      volume24h: '$450K',
      apr: '12.5%',
      fee: '0.3%'
    },
    {
      pair: 'STRK / ETH',
      tvl: '$850K',
      volume24h: '$320K',
      apr: '15.2%',
      fee: '0.3%'
    },
    {
      pair: 'ZEC / ETH',
      tvl: '$650K',
      volume24h: '$180K',
      apr: '18.7%',
      fee: '0.5%'
    }
  ]

  return (
    <PageTransition>
      <div className='min-h-[calc(100vh-4rem)] bg-linear-to-br from-indigo-50 via-white to-violet-50 py-12'>
        <div className='max-w-7xl mx-auto px-4'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8'
          >
            <h1 className='text-4xl font-bold text-slate-900 mb-2'>
              Liquidity Pools
            </h1>
            <p className='text-slate-600'>
              Provide liquidity and earn fees from trades
            </p>
          </motion.div>

          {/* Add Liquidity Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='mb-8 flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30'
          >
            <Plus size={20} />
            Add Liquidity
          </motion.button>

          {/* Pools Grid */}
          <div className='grid gap-6'>
            {pools.map((pool, index) => (
              <motion.div
                key={pool.pair}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className='bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100 shadow-lg hover:shadow-xl transition-all'
              >
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h3 className='text-2xl font-bold text-slate-900 mb-1'>
                      {pool.pair}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <Lock size={14} className='text-indigo-600' />
                      <span className='text-sm text-slate-500'>
                        Privacy Pool
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-slate-500 mb-1'>APR</div>
                    <div className='text-2xl font-bold text-green-600'>
                      {pool.apr}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div>
                    <div className='text-sm text-slate-500 mb-1'>TVL</div>
                    <div className='text-lg font-semibold text-slate-900'>
                      {pool.tvl}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-slate-500 mb-1'>
                      Volume 24h
                    </div>
                    <div className='text-lg font-semibold text-slate-900'>
                      {pool.volume24h}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-slate-500 mb-1'>Fee</div>
                    <div className='text-lg font-semibold text-slate-900'>
                      {pool.fee}
                    </div>
                  </div>
                  <div className='flex items-end'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold transition-colors'
                    >
                      Manage
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
