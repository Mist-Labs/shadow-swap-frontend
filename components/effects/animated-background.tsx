'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AnimatedBackground () {
  return (
    <div className='fixed inset-0 overflow-hidden pointer-events-none opacity-30'>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className='absolute -top-24 -left-24 w-96 h-96 bg-linear-to-br from-indigo-400 to-violet-400 rounded-full blur-3xl'
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -50, 0],
          y: [0, 50, 0],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className='absolute -bottom-24 -right-24 w-96 h-96 bg-linear-to-br from-pink-400 to-indigo-400 rounded-full blur-3xl'
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className='absolute top-1/3 right-1/4 w-72 h-72 bg-linear-to-br from-violet-400 to-indigo-400 rounded-full blur-3xl'
      />
    </div>
  )
}
