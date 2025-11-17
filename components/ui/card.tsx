'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
}

export function Card ({
  children,
  hover = true,
  glow = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-indigo-100 shadow-lg ${
        glow ? 'shadow-indigo-500/20' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
