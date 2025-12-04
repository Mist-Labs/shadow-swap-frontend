import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Transaction {
  id: string
  type: 'swap' | 'bridge' | 'deposit' | 'withdraw'
  fromToken: string
  toToken: string
  amount: string
  timestamp: number
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  swapId?: string
  direction?: 'starknet_to_zcash' | 'zcash_to_starknet' | 'starknet_internal'
}

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  clearTransactions: () => void
  getRecentTransactions: (limit?: number) => Transaction[]
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (tx) => {
        const id = tx.swapId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const transaction: Transaction = {
          ...tx,
          id,
          timestamp: Date.now()
        }
        set((state) => ({
          transactions: [transaction, ...state.transactions]
        }))
        return id
      },
      
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          )
        }))
      },
      
      clearTransactions: () => {
        set({ transactions: [] })
      },
      
      getRecentTransactions: (limit = 10) => {
        const { transactions } = get()
        return transactions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
      }
    }),
    {
      name: 'transaction-storage'
    }
  )
)

