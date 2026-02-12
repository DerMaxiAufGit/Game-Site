import { getSession } from '@/lib/auth/dal'
import { getWalletData, getBalanceChartData, getTransactions } from '@/lib/actions/wallet'
import { getSystemSettings } from '@/lib/wallet/transactions'
import { BalanceChart } from '@/components/wallet/balance-chart'
import { ClaimDaily } from '@/components/wallet/claim-daily'
import { TransactionList } from '@/components/wallet/transaction-list'
import { TransferForm } from '@/components/wallet/transfer-form'
import { Coins } from 'lucide-react'

// Prevent build-time DB queries
export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const session = await getSession()

  // Fetch initial data in parallel
  const [walletData, chartData, transactions, settings] = await Promise.all([
    getWalletData(),
    getBalanceChartData(30),
    getTransactions({ limit: 50 }),
    getSystemSettings(),
  ])

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Balance Header */}
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Coins className="h-8 w-8 text-green-500" />
            Mein Guthaben
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">
              {new Intl.NumberFormat('de-DE').format(walletData.wallet.balance)}
            </span>
            <span className="text-2xl text-gray-400">{walletData.currencyName}</span>
          </div>
        </div>

        {/* Two-column layout on desktop, single column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Chart, daily claim, and transfer form */}
          <div className="space-y-6">
            <BalanceChart data={chartData} />
            <ClaimDaily dailyClaimInfo={walletData.dailyClaimInfo} />
            <TransferForm
              maxAmount={settings.transferMaxAmount}
              dailyLimit={settings.transferDailyLimit}
              currencyName={walletData.currencyName}
              isFrozen={walletData.wallet.frozenAt !== null}
            />
          </div>

          {/* Right column: Transaction list */}
          <div>
            <TransactionList initialTransactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
