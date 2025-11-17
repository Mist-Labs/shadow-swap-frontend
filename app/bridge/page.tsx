'use client'

import { motion } from 'framer-motion'
import { Network, Lock, ArrowRightLeft, Shield } from 'lucide-react'
import { useState } from 'react'
import { PageTransition } from '@/components/layout/page-transition'

export default function BridgePage () {
  const [fromChain, setFromChain] = useState('Zcash')
  const [toChain, setToChain] = useState('Starknet')
  const [amount, setAmount] = useState('')

  const chains = ['Zcash', 'Starknet', 'Ethereum']

  return (
    <PageTransition>
      <div className='min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-6'>
        <div className='max-w-6xl mx-auto px-4'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-4'
          >
            <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-full mb-2'>
              <Lock size={14} className='text-slate-400' />
              <span className='text-xs font-semibold text-slate-300'>
                Privacy Bridge
              </span>
            </div>
            <h1 className='text-xl font-bold text-white mb-1'>
              Cross-Chain Bridge
            </h1>
            <p className='text-slate-400 text-sm'>
              Bridge assets between Zcash and Starknet with full privacy
            </p>
          </motion.div>

          {/* Bridge Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-600 shadow-xl'
          >
            {/* From Chain */}
            <div className='mb-3'>
              <label className='block text-xs font-medium text-slate-300 mb-1'>
                From
              </label>
              <div className='bg-linear-to-br from-slate-700 to-slate-600 rounded-lg p-3 border border-slate-500'>
                <select
                  value={fromChain}
                  onChange={e => setFromChain(e.target.value)}
                  className='w-full mb-2 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md font-medium text-white focus:outline-none focus:ring-2 focus:ring-slate-500'
                >
                  {chains.map(chain => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
                <input
                  type='text'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder='0.0'
                  className='w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-400'
                />
                <div className='mt-1 text-xs text-slate-400'>
                  Balance: 0.00 {fromChain === 'Zcash' ? 'ZEC' : 'ETH'}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className='flex justify-center my-1'>
              <motion.button
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className='p-2 bg-linear-to-br from-indigo-500 to-violet-600 rounded-lg border-4 border-white shadow-lg'
              >
                <ArrowRightLeft size={16} className='text-white' />
              </motion.button>
            </div>

            {/* To Chain */}
            <div className='mt-3'>
              <label className='block text-xs font-medium text-slate-300 mb-1'>
                To
              </label>
              <div className='bg-linear-to-br from-slate-600 to-slate-500 rounded-lg p-3 border border-slate-500'>
                <select
                  value={toChain}
                  onChange={e => setToChain(e.target.value)}
                  className='w-full mb-2 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md font-medium text-white focus:outline-none focus:ring-2 focus:ring-slate-500'
                >
                  {chains
                    .filter(c => c !== fromChain)
                    .map(chain => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                </select>
                <input
                  type='text'
                  value={amount ? (parseFloat(amount) * 0.98).toFixed(4) : ''}
                  placeholder='0.0'
                  readOnly
                  className='w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-400'
                />
                <div className='mt-1 text-xs text-slate-400'>
                  You will receive
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className='mt-3 p-2 bg-slate-700 border border-slate-600 rounded-md'
            >
              <div className='flex items-start gap-2'>
                <Shield size={14} className='text-slate-400 mt-0.5' />
                <div>
                  <div className='font-medium text-white text-sm'>
                    Privacy Protected
                  </div>
                  <div className='text-xs text-slate-400'>
                    Your bridge transaction is protected by zero-knowledge
                    proofs.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bridge Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full mt-3 py-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-md font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all'
            >
              Bridge Assets
            </motion.button>
          </motion.div>

          {/* Info Cards */}
          <div className='grid md:grid-cols-3 gap-3 mt-4'>
            {[
              {
                icon: Lock,
                title: 'Private',
                desc: 'Zero-knowledge proofs protect your privacy'
              },
              {
                icon: Network,
                title: 'Fast',
                desc: 'Bridge in minutes, not hours'
              },
              {
                icon: Shield,
                title: 'Secure',
                desc: 'Audited smart contracts'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -1 }}
                className='bg-slate-800/90 backdrop-blur-sm rounded-md p-3 border border-slate-600 shadow-sm text-center'
              >
                <feature.icon
                  size={20}
                  className='mx-auto mb-1.5 text-slate-400'
                />
                <h3 className='font-semibold text-white text-sm mb-0.5'>
                  {feature.title}
                </h3>
                <p className='text-xs text-slate-400'>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
