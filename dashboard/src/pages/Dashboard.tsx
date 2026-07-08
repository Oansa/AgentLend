import { FileText, AlertTriangle, Eye, ChevronRight, Clock, Search, ArrowRight } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { formatCurrency } from '../lib/utils';
import { BarChartWidget } from '../components/ui/Charts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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
    .sort((a, b) => a.healthFactor - b.healthFactor)
    .slice(0, 10);

  const totalActivePrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);

  const getHealthVariant = (hf: number) =>
    hf < 1.2 ? 'destructive' : hf < 1.5 ? 'warning' : 'success';
  const getHealthStatusClass = (hf: number) =>
    hf < 1.2 ? 'status-critical' : hf < 1.5 ? 'status-watch' : 'status-stable';
  const getHealthLabel = (hf: number) =>
    hf < 1.2 ? 'Critical' : hf < 1.5 ? 'Watch' : 'Stable';
  const getHealthColor = (hf: number) =>
    hf < 1.2 ? 'text-[#ef4444]' : hf < 1.5 ? 'text-[#f59e0b]' : 'text-[#22c55e]';

  // Risk distribution chart calculations
  const totalLoans = Math.max(1, loans.length);
  const criticalPct = (urgentLoans.length / totalLoans) * 339;
  const watchPct = (watchlistLoans.length / totalLoans) * 314;
  const stablePct = (stableLoans.length / totalLoans) * 289;

  return (
    <div className="space-y-6">
      {/* Page Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Protocol Overview, Agent</h1>
          <p className="text-[#64748b] text-sm mt-0.5">Monitor your lending protocol risk exposure and portfolio health</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
            <input
              placeholder="Search Borrower DID, Loan Id or TX..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3a82f6] focus:border-transparent text-sm placeholder:text-gray-400"
            />
          </div>
          <Button className="bg-[#1e52b3] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#153d8a] transition-colors flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>+ New Loan Request</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loans - White Card with Mini Chart */}
        <Card className="card-bg-white rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Active Loans</CardTitle>
                <p className="text-3xl font-bold text-[#1e293b] mt-1">{isLoading ? '—' : activeLoans.length}</p>
                <p className="text-sm text-[#64748b] mt-1">${formatCurrency(totalActivePrincipal)} USDC total principal</p>
              </div>
              <div className="w-12 h-12 bg-[#dbeafe] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#1e52b3]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>

        {/* Urgent / Risk Cases - Soft Red Card */}
        <Card className="card-bg-red rounded-2xl border border-[#ffe4e6] shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Urgent / Risk Cases</CardTitle>
                <p className="text-3xl font-bold text-[#b91c1c] mt-1">{isLoading ? '—' : urgentLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#ffe4e6] rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#b91c1c]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="h-4 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ef4444] rounded-full transition-all duration-500"
                style={{ width: `${activeLoans.length > 0 ? (urgentLoans.length / activeLoans.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-[#64748b]">{"Health Factor < 1.2"}</p>
          </CardContent>
        </Card>

        {/* Pending Manual Signoff - Soft Yellow Card */}
        <Card className="card-bg-yellow rounded-2xl border border-[#fefec6] shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Pending Manual Signoff</CardTitle>
                <p className="text-3xl font-bold text-[#854d0e] mt-1">{isLoading ? '—' : watchlistLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#fefec6] rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#854d0e]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                style={{ width: `${activeLoans.length > 0 ? (watchlistLoans.length / activeLoans.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-[#64748b]">Health Factor 1.2 - 1.5</p>
          </CardContent>
        </Card>

        {/* Protocol Watchlist - Muted Blue Card */}
        <Card className="card-bg-blue rounded-2xl border border-[#bfdbfe] shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Protocol Watchlist</CardTitle>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">{isLoading ? '—' : stableLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#bfdbfe] rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#1e52b3]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <p className="text-xs text-[#64748b]">Health Factor ≥ 1.5</p>
            <p className="text-xs text-[#64748b]">
              {activeLoans.length > 0 ? Math.round((stableLoans.length / activeLoans.length) * 100) : 0}% of active loans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Section: Priority Loan Queue */}
        <section className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Priority Risk Queue</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-[#3a82f6] font-medium hover:text-[#1e52b3]">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
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
                        const healthColor = getHealthColor(loan.healthFactor);
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
                              variant={getHealthVariant(loan.healthFactor)}
                              className={`${getHealthStatusClass(loan.healthFactor)} text-xs font-semibold px-3 py-1`}
                            >
                              {getHealthLabel(loan.healthFactor)}
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
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary Bottom Interactive Banner */}
          <Card className="gradient-blue-purple rounded-2xl shadow-lg border-0">
            <CardContent className="p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">✨</span>
                  <p className="text-sm font-medium text-white max-w-md">
                    <span className="font-bold">Protocol Insights:</span> {urgentLoans.length} high-leverage positions require liquidator or margin intervention updates immediately.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2"
                >
                  Review Signals
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right Section: Actions & Metrics */}
        <section className="lg:col-span-3 space-y-4">
          {/* Quick Actions */}
          <Card className="rounded-2xl border border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-[#64748b] uppercase tracking-wider">Quick Routine Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {['Pending Signatures', 'Oracle Multi-Call Checks', 'Protocol Fee Collection', 'Collateral Rebalancing'].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-[#1e293b]">{item}</span>
                    <span className="text-[#64748b]">→</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="rounded-2xl border border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-[#64748b] uppercase tracking-wider">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col items-center space-y-4">
              <div className="w-32 h-32 relative">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3a82f6] border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="w-32 h-32 rounded-full border-4 border-[#1e52b3] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#1e293b]">{loans.length}</div>
                        <div className="text-[10px] uppercase text-[#64748b] tracking-tight">Total Positions</div>
                      </div>
                    </div>
                    <svg className="absolute top-0 left-0 w-32 h-32 -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke="#ef4444"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={criticalPct + " 339"}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        stroke="#f59e0b"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={watchPct + " 314"}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="46"
                        stroke="#22c55e"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={stablePct + " 289"}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                  </>
                )}
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="text-[#64748b]">Critical</span>
                  </div>
                  <span className="font-semibold text-[#1e293b]">{urgentLoans.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-[#64748b]">Watch</span>
                  </div>
                  <span className="font-semibold text-[#1e293b]">{watchlistLoans.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                    <span className="text-[#64748b]">Stable</span>
                  </div>
                  <span className="font-semibold text-[#1e293b]">{stableLoans.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}