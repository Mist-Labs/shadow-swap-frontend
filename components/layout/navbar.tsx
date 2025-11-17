'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Wallet,
  Network,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { WalletButton } from '@/components/wallet/wallet-button'

const navItems = [
  { href: '/', label: 'Swap', icon: ArrowLeftRight },
  { href: '/pools', label: 'Pools', icon: TrendingUp },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/bridge', label: 'Bridge', icon: Network }
]

export function Navbar () {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className='sticky top-0 z-50 bg-slate-800/80 backdrop-blur-xl border-b border-slate-600 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center gap-3 group cursor-pointer'
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className='w-10 h-10 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30'
            >
              <Shield className='w-6 h-6 text-white' />
            </motion.div>
            <div>
              <h1 className='text-xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent'>
                Shadow Swap
              </h1>
              <p className='text-xs text-slate-400'>Privacy First</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-1'>
            {navItems.map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className='cursor-pointer'
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    className='relative px-4 py-2 rounded-xl transition-colors'
                  >
                    {isActive && (
                      <motion.div
                        layoutId='activeTab'
                        className='absolute inset-0 bg-linear-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-400 rounded-xl'
                        transition={{
                          type: 'spring',
                          bounce: 0.2,
                          duration: 0.6
                        }}
                      />
                    )}
                    <div className='relative flex items-center gap-2'>
                      <Icon
                        size={18}
                        className={
                          isActive ? 'text-indigo-400' : 'text-slate-400'
                        }
                      />
                      <span
                        className={`font-medium ${
                          isActive ? 'text-indigo-400' : 'text-slate-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Wallet Button & Mobile Menu */}
          <div className='flex items-center gap-4'>
            <WalletButton />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-2 rounded-xl hover:bg-slate-700 transition-colors text-slate-400 cursor-pointer'
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden border-t border-slate-600 bg-slate-800/95 backdrop-blur-xl'
          >
            <div className='px-4 py-4 space-y-2'>
              {navItems.map(item => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='cursor-pointer'
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-linear-to-r from-indigo-900/50 to-violet-900/50 border border-indigo-600'
                          : 'hover:bg-slate-700'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          isActive ? 'text-indigo-400' : 'text-slate-400'
                        }
                      />
                      <span
                        className={`font-medium ${
                          isActive ? 'text-indigo-400' : 'text-slate-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
