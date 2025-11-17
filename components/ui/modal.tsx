'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Modal ({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50'
            onClick={onClose}
          />
          <div className='fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none'>
            <div
              className='bg-slate-800/95 backdrop-blur-xl border border-slate-600/60 rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden relative'
              onClick={e => e.stopPropagation()}
            >
              {/* Subtle glassy background */}
              <div className='absolute inset-0 bg-linear-to-br from-slate-700/20 via-slate-800/10 to-slate-700/20 rounded-2xl' />
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.05),transparent_50%)] rounded-2xl' />

              {/* Content */}
              <div className='relative z-10'>
                {title && (
                  <div className='flex items-center justify-between p-6 border-b border-slate-600/60'>
                    <h2 className='text-xl font-bold text-white'>{title}</h2>
                    <button
                      onClick={onClose}
                      className='p-2 hover:bg-slate-700/80 rounded-lg transition-colors'
                    >
                      <X size={20} className='text-slate-400' />
                    </button>
                  </div>
                )}
                <div className='p-6'>{children}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
