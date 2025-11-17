'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface PrivacyBadgeProps {
  isPrivate: boolean
}

export function PrivacyBadge ({ isPrivate }: PrivacyBadgeProps) {
  if (!isPrivate) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className='inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 rounded-full'
    >
      <Lock size={12} className='text-indigo-600' />
      <span className='text-xs font-semibold text-indigo-700'>Private</span>
    </motion.div>
  )
}
