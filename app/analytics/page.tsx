'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'

export default function AnalyticsPage () {
  const stats = [
    {
      label: 'Total Volume',
      value: '$12.5M',
      change: '+24.5%',
      positive: true,
      icon: DollarSign
    },
    {
      label: 'Active Users',
      value: '15,234',
      change: '+18.2%',
      positive: true,
      icon: Users
    },
    {
      label: 'Total Pairs',
      value: '24',
      change: '+3',
      positive: true,
      icon: TrendingUp
    },
    {
      label: 'Avg. Fee',
      value: '0.15%',
      change: '-2.1%',
      positive: false,
      icon: TrendingDown
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
            className='mb-8'
          >
            <h1 className='text-4xl font-bold text-white mb-2'>
              Analytics Dashboard
            </h1>
            <p className='text-slate-400'>
              Real-time insights into Shadow Swap performance
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className='bg-slate-700/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg'
                  style={{
                    boxShadow:
                      'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <div className='p-3 bg-slate-700 rounded-xl'>
                      <Icon size={24} className='text-slate-400' />
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        stat.positive
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-red-900/30 text-red-300'
                      }`}
                    >
                      {stat.positive ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      <span className='text-xs font-semibold'>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className='text-3xl font-bold text-white mb-1'>
                    {stat.value}
                  </div>
                  <div className='text-sm text-slate-400'>{stat.label}</div>
                </motion.div>
              )
            })}
          </div>

          {/* Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-lg'
          >
            <h2 className='text-2xl font-bold text-white mb-6'>
              Volume Over Time
            </h2>
            <div className='h-64 bg-linear-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-600'>
              <p className='text-slate-300'>Chart visualization coming soon</p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
