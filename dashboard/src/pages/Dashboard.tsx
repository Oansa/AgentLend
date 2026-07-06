import { StatCard } from '../components/ui/StatCard';
import { LoanCard } from '../components/ui/LoanCard';
import { LineChartWidget, BarChartWidget, PieChartWidget } from '../components/ui/Charts';
import { TrendingUp, Users, FileText, Target, DollarSign, Shield, Activity, Zap, CheckCircle } from 'lucide-react';

// Mock chart data
const tvlData = [
  { name: 'Jan', value: 1200000 },
  { name: 'Feb', value: 1350000 },
  { name: 'Mar', value: 1580000 },
  { name: 'Apr', value: 1720000 },
  { name: 'May', value: 1950000 },
  { name: 'Jun', value: 2100000 },
  { name: 'Jul', value: 2400000 },
];

const loanVolumeData = [
  { name: 'Jan', value: 850000 },
  { name: 'Feb', value: 920000 },
  { name: 'Mar', value: 1100000 },
  { name: 'Apr', value: 1250000 },
  { name: 'May', value: 1400000 },
  { name: 'Jun', value: 1580000 },
  { name: 'Jul', value: 1750000 },
];

const activeLoansData = [
  { name: 'Jan', value: 420 },
  { name: 'Feb', value: 480 },
  { name: 'Mar', value: 560 },
  { name: 'Apr', value: 650 },
  { name: 'May', value: 720 },
  { name: 'Jun', value: 810 },
  { name: 'Jul', value: 890 },
];

const collateralDistribution = [
  { name: 'WETH', value: 45, color: 'brand' },
  { name: 'cbETH', value: 30, color: 'brandLight' },
  { name: 'USDC', value: 15, color: 'success' },
  { name: 'DAI', value: 7, color: 'warning' },
  { name: 'Other', value: 3, color: 'muted' },
];

const scoreDistribution = [
  { name: 'Excellent (800+)', value: 28 },
  { name: 'Good (700-799)', value: 35 },
  { name: 'Fair (600-699)', value: 22 },
  { name: 'Poor (500-599)', value: 10 },
  { name: 'Critical (<500)', value: 5 },
];

const loanStatusData = [
  { name: 'Active', value: 68, color: 'success' },
  { name: 'Repaid', value: 18, color: 'brand' },
  { name: 'Pending', value: 8, color: 'warning' },
  { name: 'Liquidated', value: 4, color: 'danger' },
  { name: 'Defaulted', value: 2, color: 'destructive' },
];

const mockLoans = [
  {
    id: 'LN-001',
    borrower: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    borrowerDID: 'did:croo:agentlend-borrower-001',
    lender: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    principal: 50000,
    interestRate: 12.5,
    outstanding: 51250,
    collateralToken: 'WETH',
    collateralAmount: 2.5,
    collateralValueUSD: 5800,
    status: 'Active' as const,
    score: 780,
    maturity: '2026-10-15',
    startDate: '2026-07-15',
    healthFactor: 1.85,
  },
  {
    id: 'LN-002',
    borrower: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    borrowerDID: 'did:croo:creditworthy-agent',
    lender: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    principal: 25000,
    interestRate: 15.0,
    outstanding: 25625,
    collateralToken: 'cbETH',
    collateralAmount: 1.8,
    collateralValueUSD: 4200,
    status: 'Active' as const,
    score: 650,
    maturity: '2026-11-01',
    startDate: '2026-08-01',
    healthFactor: 1.42,
  },
  {
    id: 'LN-003',
    borrower: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    borrowerDID: 'did:croo:premium-agent-003',
    lender: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    principal: 100000,
    interestRate: 10.0,
    outstanding: 0,
    collateralToken: 'WETH',
    collateralAmount: 5.0,
    collateralValueUSD: 11500,
    status: 'Repaid' as const,
    score: 890,
    maturity: '2026-09-01',
    startDate: '2025-12-01',
    healthFactor: 2.1,
  },
  {
    id: 'LN-004',
    borrower: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    borrowerDID: 'did:croo:risky-borrower',
    lender: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    principal: 75000,
    interestRate: 18.5,
    outstanding: 0,
    collateralToken: 'USDC',
    collateralAmount: 75000,
    collateralValueUSD: 75000,
    status: 'Liquidated' as const,
    score: 420,
    maturity: '2026-08-20',
    startDate: '2026-01-20',
    healthFactor: 0.95,
  },
  {
    id: 'LN-005',
    borrower: '0xFabb0ac9d68B0B445fB7357272Ff202C5651694a',
    borrowerDID: 'did:croo:steady-agent',
    lender: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    principal: 30000,
    interestRate: 14.0,
    outstanding: 30700,
    collateralToken: 'WETH',
    collateralAmount: 1.2,
    collateralValueUSD: 2780,
    status: 'Active' as const,
    score: 720,
    maturity: '2026-11-10',
    startDate: '2026-02-10',
    healthFactor: 1.65,
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-brand-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Real-time overview of AgentLend protocol metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-full flex items-center gap-1">
            <Activity className="h-3 w-3 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value Locked"
          value="$2.4M"
          change={12.5}
          changeLabel="vs last month"
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          trend="up"
        />
        <StatCard
          title="Active Loans"
          value="892"
          change={8.2}
          changeLabel="vs last month"
          icon={<FileText className="h-6 w-6" />}
          iconBg="bg-success/10 text-success"
          trend="up"
        />
        <StatCard
          title="Unique Agents"
          value="1,247"
          change={3.1}
          changeLabel="vs last month"
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-warning/10 text-warning"
          trend="up"
        />
        <StatCard
          title="Avg ACS Score"
          value="742"
          change={-1.2}
          changeLabel="vs last month"
          icon={<Target className="h-6 w-6" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          trend="down"
        />
      </div>

      {/* Charts Row - TVL & Loan Volume */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2 animate-fade-in stagger-1">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Total Value Locked (TVL)</h3>
                <p className="text-sm text-muted-foreground">Protocol liquidity over time</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5% this month</span>
              </div>
            </div>
            <LineChartWidget data={tvlData} color="brand" showArea />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="animate-fade-in stagger-2">
            <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Loan Volume</h3>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +8.2%
                </span>
              </div>
              <LineChartWidget data={loanVolumeData} color="success" showArea />
            </div>
          </div>
          <div className="animate-fade-in stagger-3">
            <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Loans</h3>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +15.3%
                </span>
              </div>
              <LineChartWidget data={activeLoansData} color="brand" showArea />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="animate-fade-in stagger-1">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Collateral Distribution</h3>
            <PieChartWidget data={collateralDistribution} innerRadius={50} />
          </div>
        </div>
        <div className="animate-fade-in stagger-2">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <h3 className="text-lg font-semibold mb-4">ACS Score Distribution</h3>
            <PieChartWidget data={scoreDistribution} innerRadius={50} />
          </div>
        </div>
        <div className="animate-fade-in stagger-3">
          <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Loan Status</h3>
            <BarChartWidget data={loanStatusData} color="brand" horizontal />
          </div>
        </div>
      </div>

      {/* Loan Cards Section */}
      <div className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Recent Loans</h2>
            <p className="text-muted-foreground">Monitor and manage active protocol loans</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              {...loan}
              className="animate-fade-in"
              onClick={() => console.log('View loan:', loan.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in stagger-5">
        <div className="bg-card border border-card-border rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protocol Health</p>
              <p className="text-2xl font-bold mt-1">185%</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <div className="h-16 mt-4 bg-muted/50 rounded-xl overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Liquidity Utilization</p>
              <p className="text-2xl font-bold mt-1">67%</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="h-16 mt-4 bg-muted/50 rounded-xl overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: '67%' }} />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Default Rate</p>
              <p className="text-2xl font-bold mt-1 text-success">0.8%</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="h-16 mt-4 bg-muted/50 rounded-xl overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Interest Rate</p>
              <p className="text-2xl font-bold mt-1">13.2%</p>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
          </div>
          <div className="h-16 mt-4 bg-muted/50 rounded-xl overflow-hidden">
            <div className="h-full bg-warning rounded-full" style={{ width: '66%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

