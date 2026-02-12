import { z } from 'zod'

/**
 * Transfer validation schema
 * For user-to-user currency transfers
 */
export const transferSchema = z.object({
  toUserId: z.string().min(1, 'Recipient user ID is required'),
  amount: z
    .number()
    .int('Amount must be an integer')
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1'),
})

/**
 * Adjust balance validation schema
 * For admin operations (credit/debit)
 */
export const adjustBalanceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().int('Amount must be an integer'),
  reason: z.string().optional(),
})

/**
 * Bet settings validation schema
 * For configuring game betting rules
 */
export const betSettingsSchema = z.object({
  betAmount: z
    .number()
    .int('Bet amount must be an integer')
    .positive('Bet amount must be positive'),
  minBet: z
    .number()
    .int('Minimum bet must be an integer')
    .positive('Minimum bet must be positive')
    .optional(),
  maxBet: z
    .number()
    .int('Maximum bet must be an integer')
    .positive('Maximum bet must be positive')
    .optional(),
  payoutRatios: z.array(
    z.object({
      position: z.number().int().positive(),
      percentage: z.number().int().min(0).max(100),
    })
  ),
})

/**
 * System settings validation schema
 * For updating economic configuration
 */
export const systemSettingsSchema = z.object({
  currencyName: z.string().min(1, 'Currency name is required'),
  startingBalance: z
    .number()
    .int('Starting balance must be an integer')
    .min(0, 'Starting balance cannot be negative'),
  dailyAllowanceBase: z
    .number()
    .int('Daily allowance must be an integer')
    .min(0, 'Daily allowance cannot be negative'),
  weeklyBonusAmount: z
    .number()
    .int('Weekly bonus must be an integer')
    .min(0, 'Weekly bonus cannot be negative'),
  transferMaxAmount: z
    .number()
    .int('Transfer max must be an integer')
    .positive('Transfer max must be positive'),
  transferDailyLimit: z
    .number()
    .int('Daily limit must be an integer')
    .positive('Daily limit must be positive'),
  defaultBetPresets: z.array(z.number().int().positive()),
  defaultPayoutRatios: z.array(
    z.object({
      position: z.number().int().positive(),
      percentage: z.number().int().min(0).max(100),
    })
  ),
  afkGracePeriodSec: z
    .number()
    .int('AFK grace period must be an integer')
    .min(0, 'AFK grace period cannot be negative'),
  alertTransferLimit: z
    .number()
    .int('Alert transfer limit must be an integer')
    .min(0, 'Alert transfer limit cannot be negative'),
  alertBalanceDropPct: z
    .number()
    .int('Alert balance drop percentage must be an integer')
    .min(0, 'Alert percentage cannot be negative')
    .max(100, 'Alert percentage cannot exceed 100'),
})

// Type exports for use in other modules
export type TransferInput = z.infer<typeof transferSchema>
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>
export type BetSettingsInput = z.infer<typeof betSettingsSchema>
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>
