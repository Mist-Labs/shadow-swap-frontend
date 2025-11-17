'use client'

import { motion } from 'framer-motion'
import { SwapCard } from '@/components/swap/swap-card'
import { TrendingUp, Zap, Shield, Lock } from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'

export default function Home () {
  return (
    <PageTransition>
      <div className='relative min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900'>
        {/* Animated Background Elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none opacity-20'>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className='absolute -top-24 -left-24 w-96 h-96 bg-linear-to-br from-indigo-600 to-violet-600 rounded-full blur-3xl opacity-20'
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, 50, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className='absolute -bottom-24 -right-24 w-96 h-96 bg-linear-to-br from-slate-600 to-indigo-600 rounded-full blur-3xl opacity-20'
          />
        </div>

        {/* Main Content */}
        <div className='relative z-10 max-w-7xl mx-auto px-4 py-12'>
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-12'
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className='inline-flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-full mb-6'
            >
              <Lock size={16} className='text-slate-400' />
              <span className='text-sm font-semibold text-slate-300'>
                Privacy-First Trading
              </span>
            </motion.div>
            <h1 className='text-5xl md:text-6xl font-bold mb-4'>
              <span className='bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent'>
                Shadow Swap
              </span>
            </h1>
            <p className='text-xl text-slate-400 max-w-2xl mx-auto'>
              Anonymous, fast, and secure token swaps on Starknet with Zcash
              integration
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='flex gap-3 mb-12 justify-center flex-wrap'
          >
            {[
              { icon: Zap, label: 'Lightning Fast', color: 'indigo' },
              { icon: Shield, label: 'Private & Secure', color: 'violet' },
              { icon: TrendingUp, label: 'Best Rates', color: 'pink' }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`flex items-center gap-2 px-5 py-2.5 bg-slate-700/90 backdrop-blur-sm rounded-full border border-slate-600 shadow-sm`}
              >
                <feature.icon
                  size={18}
                  className={`text-${feature.color}-400`}
                />
                <span className='text-sm font-semibold text-slate-300'>
                  {feature.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Swap Card */}
          <div className='flex justify-center mb-12'>
            <SwapCard />
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='grid grid-cols-2 bg-slate-700/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg t md:grid-cols-4 gap-6 max-w-4xl mx-auto'
          >
            {[
              { value: '$2.5M+', label: 'Volume 24h' },
              { value: '15K+', label: 'Users' },
              { value: '0.1%', label: 'Fee' },
              { value: '99.9%', label: 'Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className='text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 shadow-sm'
              >
                <div className='text-3xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2'>
                  {stat.value}
                </div>
                <div className='text-sm text-slate-600'>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
