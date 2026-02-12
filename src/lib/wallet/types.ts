import type { Wallet, User, Transaction, TransactionType, EscrowStatus } from '@prisma/client'

// Re-export enums from Prisma
export { TransactionType, EscrowStatus }

// Wallet with user info
export type WalletWithUser = Wallet & {
  user: {
    displayName: string
    username: string
  }
}

// Transaction with related user info
export type TransactionWithDetails = Transaction & {
  user: {
    displayName: string
    username: string
  }
  relatedUser?: {
    displayName: string
    username: string
  } | null
}

// SystemSettings config type
export type SystemSettingsConfig = {
  id: string
  currencyName: string
  startingBalance: number
  dailyAllowanceBase: number
  weeklyBonusAmount: number
  transferMaxAmount: number
  transferDailyLimit: number
  defaultBetPresets: number[]
  defaultPayoutRatios: Array<{ position: number; percentage: number }>
  afkGracePeriodSec: number
  alertTransferLimit: number
  alertBalanceDropPct: number
  updatedAt: Date
}

// Operation result types
export type CreditResult = {
  wallet: Wallet
  transaction: Transaction
}

export type DebitResult = {
  wallet: Wallet
  transaction: Transaction
}

// Transaction history options
export type TransactionHistoryOptions = {
  type?: TransactionType
  limit?: number
  cursor?: string
}

// Balance history entry
export type BalanceHistoryEntry = {
  date: string
  balance: number
}
