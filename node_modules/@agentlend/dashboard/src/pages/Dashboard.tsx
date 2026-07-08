import { FileText, AlertTriangle, Eye, ChevronRight, Clock } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { formatCurrency } from '../lib/utils';
import { BarChartWidget } from '../components/ui/Charts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { loans, isLoading } = useLoans();

  // Compute real metrics from blockchain data
  const activeLoans = loans.filter(l => l.status === 'Active');

  // Health factor based categorization
  const urgentLoans = activeLoans.filter(l => l.healthFactor < 1.2);
  const watchlistLoans = activeLoans.filter(l => l.healthFactor >= 1.2 && l.healthFactor < 1.5);
  const stableLoans = activeLoans.filter(l => l.healthFactor >= 1.5);

  // Recent loans for the priority queue
  const recentLoans = [...loans]
    .sort((a, b) => {
      // Sort by health factor (most risky first)
      return a.healthFactor - b.healthFactor;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f0f5fa] text-[#1e293b] font-sans flex">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-20 bg-white border-r border-[#e2e8f0] flex flex-col items-center py-6 space-y-8 shrink-0">
        <div className="w-10 h-10 bg-[#1e52b3] rounded-xl flex items-center justify-center text-white font-bold text-lg">L</div>
        <nav className="flex-1 flex flex-col space-y-4">
          <button className="p-3 bg-[#fcf851] rounded-xl text-black hover:scale-105 transition-transform text-xl" aria-label="Dashboard">🏠</button>
          <button className="p-3 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#1e52b3] transition-colors text-xl" aria-label="Agents">👥</button>
          <button className="p-3 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#1e52b3] transition-colors text-xl" aria-label="Analytics">📊</button>
        </nav>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">

        {/* 2. Top Header & RPC Profile Context */}
        <header className="flex justify-between items-center">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search Borrower DID, Loan Id or TX..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#1e293b]">Node-Hardhat:8545</p>
              <p className="text-xs text-[#22c55e] font-medium">● Connected</p>
            </div>
            <div className="w-10 h-10 bg-gray-300 rounded-full border border-white shadow-sm" />
          </div>
        </header>

        {/* 3. Welcome Bar */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Protocol Overview, Agent</h1>
          <button className="bg-[#1e52b3] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition">
            + New Loan Request
          </button>
        </div>

        {/* 4. KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Loans - White Card with Mini Chart */}
          <Card className="card-bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Active Loans</p>
                <p className="text-3xl font-bold text-[#1e293b] mt-1">{isLoading ? '—' : activeLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#dbeafe] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#1e52b3]" />
              </div>
            </div>
            <div className="h-16">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#3a82f6] border-t-transparent" />
                </div>
              ) : (
                <BarChartWidget
                  data={[
                    { name: 'W1', value: Math.max(1, activeLoans.length - 3) },
                    { name: 'W2', value: Math.max(1, activeLoans.length - 2) },
                    { name: 'W3', value: Math.max(1, activeLoans.length - 1) },
                    { name: 'W4', value: activeLoans.length },
                  ]}
                  color="brand"
                />
              )}
            </div>
          </Card>

          {/* Urgent / Risk Cases - Soft Red Card */}
          <Card className="card-bg-red rounded-3xl p-6 border border-[#ffe4e6] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Urgent / Risk Cases</p>
                <p className="text-3xl font-bold text-[#b91c1c] mt-1">{isLoading ? '—' : urgentLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#ffe4e6] rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#b91c1c]" />
              </div>
            </div>
            <div className="h-4 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ef4444] rounded-full transition-all duration-500"
                style={{ width: `${(activeLoans.length > 0 ? (urgentLoans.length / activeLoans.length) * 100 : 0)}%` }}
              />
            </div>
            <p className="text-xs text-[#64748b] mt-2">{"Health Factor < 1.2"}</p>
          </Card>

          {/* Pending Manual Signoff - Soft Yellow Card */}
          <Card className="card-bg-yellow rounded-3xl p-6 border border-[#fefec6] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Pending Manual Signoff</p>
                <p className="text-3xl font-bold text-[#854d0e] mt-1">{isLoading ? '—' : watchlistLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#fefec6] rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#854d0e]" />
              </div>
            </div>
            <div className="h-4 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                style={{ width: `${(activeLoans.length > 0 ? (watchlistLoans.length / activeLoans.length) * 100 : 0)}%` }}
              />
            </div>
            <p className="text-xs text-[#64748b] mt-2">Health Factor 1.2 - 1.5</p>
          </Card>

          {/* Loans on Protocol Watchlist - Muted Blue Card */}
          <Card className="card-bg-blue rounded-3xl p-6 border border-[#bfdbfe] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Protocol Watchlist</p>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">{isLoading ? '—' : stableLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#bfdbfe] rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#1e52b3]" />
              </div>
            </div>
            <p className="text-xs text-[#64748b]">Health Factor ≥ 1.5</p>
            <p className="text-xs text-[#64748b] mt-1">{activeLoans.length > 0 ? Math.round((stableLoans.length / activeLoans.length) * 100) : 0}% of active loans</p>
          </Card>
        </div>

        {/* 5. Asymmetrical Split Workspace Section */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

          {/* Main Left Content Stream: Priority Loan Queue */}
          <section className="lg:col-span-7 space-y-4">
            <Card className="rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-[#1e293b]">Priority Risk Queue</h3>
                <Button variant="ghost" size="sm" className="text-xs text-[#3a82f6] font-medium hover:text-[#1e52b3]">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {/* Data Table Element */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] pb-2">
                      <th className="pb-3 pr-4">Borrower (DID)</th>
                      <th className="pb-3 pr-4 text-right">Principal</th>
                      <th className="pb-3 pr-4 text-right">Vitals</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {isLoading ? (
                      <>
                        {[1, 2, 3].map(i => (
                          <tr key={i} className="animate-pulse">
                            <td className="py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                            <td className="py-4 text-right"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                            <td className="py-4 text-right"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                            <td className="py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
                            <td className="py-4"><div className="h-6 bg-gray-200 rounded-full w-16" /></td>
                          </tr>
                        ))}
                      </>
                    ) : recentLoans.length === 0 ? (
                      <tr>
                        <td className="py-8 text-center text-[#64748b]" colSpan={5}>No loans found</td>
                      </tr>
                    ) : (
                      recentLoans.map((loan) => {
                        const healthVariant = loan.healthFactor < 1.2 ? 'destructive' : loan.healthFactor < 1.5 ? 'warning' : 'success';
                        const healthStatusClass = loan.healthFactor < 1.2 ? 'status-critical' : loan.healthFactor < 1.5 ? 'status-watch' : 'status-stable';
                        const healthLabel = loan.healthFactor < 1.2 ? 'Critical' : loan.healthFactor < 1.5 ? 'Watch' : 'Stable';
                        const healthColor = loan.healthFactor < 1.2 ? 'text-[#ef4444]' : loan.healthFactor < 1.5 ? 'text-[#f59e0b]' : 'text-[#22c55e]';

                        return (
                          <tr key={loan.id} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#1e52b3]">
                                    {loan.borrowerDID.slice(2, 4)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-[#1e293b] font-mono text-sm truncate max-w-[180px]">
                                    {loan.borrowerDID}
                                  </p>
                                  <p className="text-xs text-[#64748b] font-mono">{loan.borrower.slice(0, 10)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-right font-medium text-[#1e293b]">
                              {formatCurrency(loan.principal)} USDC
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <div className="flex flex-col items-end space-y-1">
                                <div className={`font-bold text-lg ${healthColor}`}>
                                  HF: {loan.healthFactor.toFixed(2)}
                                </div>
                                <div className="text-xs text-[#64748b] font-mono">
                                  {loan.interestRate}% APR
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={healthVariant}
                                className={`${healthStatusClass} text-xs font-semibold px-3 py-1`}
                              >
                                {healthLabel}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#3a82f6] hover:bg-[#dbeafe] rounded-full px-3"
                              >
                                Review
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )
                  }
                  </tbody>
                </table>
              </div>
            </Card>

            {/* AI Summary Bottom Interactive Banner */}
            <div className="bg-gradient-to-r from-[#1e52b3] to-[#7c3aed] text-white rounded-2xl p-5 flex justify-between items-center shadow-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">✨</span>
                <p className="text-sm font-medium max-w-md">
                  <span className="font-bold">Protocol Insights:</span> {urgentLoans.length} high-leverage positions require liquidator or margin intervention updates immediately.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl px-4 py-2"
              >
                Review Signals →
              </Button>
            </div>
          </section>

          {/* Sidebar Widgets Column */}
          <section className="lg:col-span-3 space-y-6">
            {/* Quick Actions Stack Component */}
            <Card className="rounded-3xl p-6 border border-[#e2e8f0] shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Quick Routine Actions</h4>
              <div className="space-y-2">
                {['Pending Signatures', 'Oracle Multi-Call Checks'].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm font-medium">{item}</span>
                    <span className="text-gray-400">❯</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Risk Distribution Chart Area */}
            <Card className="rounded-3xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col items-center">
              <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider w-full text-left mb-4">Risk Distribution</h4>
              {/* Insert Recharts Donut Component using Custom Inner & Outer Radius parameters here */}
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-center border-4 border-blue-500">
                <div>
                  <div className="text-2xl font-bold">128</div>
                  <div className="text-[10px] uppercase text-gray-400 tracking-tight">Total Positions</div>
                </div>
              </div>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}

