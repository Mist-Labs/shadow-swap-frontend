'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Modal ({ isOpen, onClose, children, title }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on body and html
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth

      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      // Prevent body from shifting when scrollbar is hidden
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.paddingRight = ''
      }
    }
  }, [isOpen])

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(12px)',
              zIndex: 10000,
              cursor: 'pointer'
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              width: '100%',
              maxWidth: '32rem',
              padding: '1rem',
              pointerEvents: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'rgba(51, 65, 85, 0.9)',
                backdropFilter: 'blur(16px)',
                borderRadius: '1rem',
                boxShadow:
                  'inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: '32rem',
                pointerEvents: 'auto',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Subtle glassy background */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to bottom right, rgba(51, 65, 85, 0.2), rgba(30, 41, 59, 0.1), rgba(51, 65, 85, 0.2))',
                  borderRadius: '1rem'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05), transparent 50%)',
                  borderRadius: '1rem'
                }}
              />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                {title && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      borderBottom: '1px solid rgba(71, 85, 105, 0.6)'
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: 'white'
                      }}
                    >
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgb(148, 163, 184)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                          'rgba(51, 65, 85, 0.8)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>{children}</div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
