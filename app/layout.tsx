import type { Metadata } from 'next'
import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Shadow Swap - Privacy-First Starknet DEX',
  description:
    'Fast, secure, and anonymous token swaps on Starknet with Zcash integration'
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} antialiased`}>
        <Navbar />
        <main className='min-h-screen'>{children}</main>
      </body>
    </html>
  )
}
