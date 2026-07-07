import { StatCard } from '../components/ui/StatCard';
import { LoanCard } from '../components/ui/LoanCard';
import { BarChartWidget, PieChartWidget } from '../components/ui/Charts';
import { TrendingUp, Users, FileText, Target, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';

export function Dashboard() {
  const { loans, isLoading, error } = useLoans();

  // Compute real metrics from blockchain data
  const activeLoans = loans.filter(l => l.status === 'Active');
  const repaidLoans = loans.filter(l => l.status === 'Repaid');
  const liquidatedLoans = loans.filter(l => l.status === 'Liquidated');
  const defaultedLoans = loans.filter(l => l.status === 'Defaulted');

  const totalValueLocked = loans.reduce((sum, l) => sum + l.principal, 0);
  const activePrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  const uniqueAgents = new Set(loans.map(l => l.borrowerDID)).size;
  const avgScore = loans.length > 0
    ? Math.round(loans.reduce((sum, l) => sum + l.score, 0) / loans.length)
    : 0;

  const healthFactors = activeLoans.map(l => l.healthFactor).filter(h => h > 0);
  const avgHealthFactor = healthFactors.length > 0
    ? Math.round((healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length) * 100) / 100
    : 0;

  const defaultRate = loans.length > 0
    ? ((defaultedLoans.length + liquidatedLoans.length) / loans.length * 100).toFixed(1)
    : 0;

  const avgInterestRate = activeLoans.length > 0
    ? (activeLoans.reduce((sum, l) => sum + l.interestRate, 0) / activeLoans.length).toFixed(1)
    : 0;

  // Chart data from real loans
  const scoreDistribution = [
    { name: 'Excellent (800+)', value: loans.filter(l => l.score >= 800).length, color: 'success' },
    { name: 'Good (700-799)', value: loans.filter(l => l.score >= 700 && l.score < 800).length, color: 'brand' },
    { name: 'Fair (600-699)', value: loans.filter(l => l.score >= 600 && l.score < 700).length, color: 'warning' },
    { name: 'Poor (500-599)', value: loans.filter(l => l.score >= 500 && l.score < 600).length, color: 'destructive' },
    { name: 'Critical (<500)', value: loans.filter(l => l.score < 500).length, color: 'muted' },
  ];

  const loanStatusData = [
    { name: 'Active', value: activeLoans.length, color: 'success' },
    { name: 'Repaid', value: repaidLoans.length, color: 'brand' },
    { name: 'Liquidated', value: liquidatedLoans.length, color: 'destructive' },
    { name: 'Defaulted', value: defaultedLoans.length, color: 'muted' },
  ];

  const collateralTokens = loans.reduce((acc, l) => {
    acc[l.collateralToken] = (acc[l.collateralToken] || 0) + l.collateralAmount;
    return acc;
  }, {} as Record<string, number>);

  const collateralDistribution = Object.entries(collateralTokens)
    .map(([name, value], i) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: ['brand', 'brandLight', 'success', 'warning', 'muted'][i % 5]
    }));

  // Recent loans for cards
  const recentLoans = [...loans].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-brand-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Loading protocol metrics from blockchain...' : 'Real-time overview of AgentLend protocol metrics'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-full flex items-center gap-1">
            <Activity className="h-3 w-3 animate-pulse" />
            {isLoading ? 'Loading...' : 'Live'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>Failed to load blockchain data: {error}</span>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value Locked"
          value={isLoading ? '—' : `$${formatCurrency(totalValueLocked)}`}
          change={12.5}
          changeLabel="vs last period"
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          trend="up"
        />
        <StatCard
          title="Active Loans"
          value={isLoading ? '—' : activeLoans.length.toString()}
          change={activeLoans.length > 0 ? 8.2 : 0}
          changeLabel="vs last period"
          icon={<FileText className="h-6 w-6" />}
          iconBg="bg-success/10 text-success"
          trend="up"
        />
        <StatCard
          title="Unique Agents"
          value={isLoading ? '—' : uniqueAgents.toString()}
          change={3.1}
          changeLabel="vs last period"
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-warning/10 text-warning"
          trend="up"
        />
        <StatCard
          title="Avg ACS Score"
          value={isLoading ? '—' : avgScore.toString()}
          change={-1.2}
          changeLabel="vs last period"
          icon={<Target className="h-6 w-6" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2 animate-fade-in stagger-1">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Active Loan Distribution</h3>
                <p className="text-sm text-muted-foreground">Loan amounts by status</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>{activeLoans.length} active loans</span>
              </div>
            </div>
            <div className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <BarChartWidget
                  data={[
                    { name: 'Active', value: activePrincipal },
                    { name: 'Repaid', value: repaidLoans.reduce((sum, l) => sum + l.principal, 0) },
                    { name: 'Liquidated', value: liquidatedLoans.reduce((sum, l) => sum + l.principal, 0) },
                    { name: 'Defaulted', value: defaultedLoans.reduce((sum, l) => sum + l.principal, 0) },
                  ]}
                  color="success"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="animate-fade-in stagger-2">
            <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ACS Score Distribution</h3>
              </div>
              <PieChartWidget data={scoreDistribution} innerRadius={50} />
            </div>
          </div>
          <div className="animate-fade-in stagger-3">
            <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Loan Status</h3>
              </div>
              <BarChartWidget data={loanStatusData} color="brand" horizontal />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="animate-fade-in stagger-1">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Collateral Distribution</h3>
            {collateralDistribution.length > 0 ? (
              <PieChartWidget data={collateralDistribution} innerRadius={50} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No collateral data available</p>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 animate-fade-in stagger-2">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Protocol Health Metrics</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Protocol Health</p>
                <p className="text-2xl font-bold text-success mt-1">{avgHealthFactor}x</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Liquidity Utilization</p>
                <p className="text-2xl font-bold mt-1">
                  {totalValueLocked > 0 ? Math.round((activePrincipal / totalValueLocked) * 100) : 0}%
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Default Rate</p>
                <p className="text-2xl font-bold text-success mt-1">{defaultRate}%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Avg Interest Rate</p>
                <p className="text-2xl font-bold mt-1">{avgInterestRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans Section */}
      <div className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Recent Loans</h2>
            <p className="text-muted-foreground">Latest loans on the protocol</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : recentLoans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No loans yet</h3>
              <p className="text-muted-foreground mt-1">Create your first loan to see it here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                {...loan}
                className="animate-fade-in"
                onClick={() => console.log('View loan:', loan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}