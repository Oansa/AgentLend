import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn, formatCurrency, formatNumber, getScoreColor, getScoreLabel, getCollateralRatio } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, Users, FileText, Target, DollarSign, Plus } from 'lucide-react';
import { useProtocolStats, useRecentLoans } from '../lib/contractHooks';
import { useState } from 'react';

const stats = [
  { name: 'Total Value Locked', value: '$2.4M', change: '+12.5%', icon: DollarSign, positive: true },
  { name: 'Active Loans', value: '1,234', change: '+8.2%', icon: FileText, positive: true },
  { name: 'Unique Agents', value: '567', change: '+3.1%', icon: Users, positive: true },
  { name: 'Avg ACS Score', value: '742', change: '-1.2%', icon: Target, positive: false },
];

const recentLoans = [
  { id: 'LN-001', agent: 'did:croo:agent001', amount: '$50,000', rate: '12.5%', status: 'Active', score: 780, collateral: 'WETH', collateralRatio: 15 },
  { id: 'LN-002', agent: 'did:croo:agent002', amount: '$25,000', rate: '15.0%', status: 'Active', score: 650, collateral: 'cbETH', collateralRatio: 25 },
  { id: 'LN-003', agent: 'did:croo:agent003', amount: '$100,000', rate: '10.0%', status: 'Repaid', score: 890, collateral: 'WETH', collateralRatio: 10 },
  { id: 'LN-004', agent: 'did:croo:agent004', amount: '$75,000', rate: '18.5%', status: 'Liquidated', score: 420, collateral: 'USDC', collateralRatio: 40 },
  { id: 'LN-005', agent: 'did:croo:agent005', amount: '$30,000', rate: '14.0%', status: 'Active', score: 720, collateral: 'WETH', collateralRatio: 15 },
];

const topAgents = [
  { did: 'did:croo:agent001', score: 890, loans: 5, volume: '$250K', status: 'Active' },
  { did: 'did:croo:agent002', score: 850, loans: 3, volume: '$180K', status: 'Active' },
  { did: 'did:croo:agent003', score: 820, loans: 8, volume: '$420K', status: 'Active' },
  { did: 'did:croo:agent004', score: 790, loans: 2, volume: '$95K', status: 'Active' },
  { did: 'did:croo:agent005', score: 780, loans: 4, volume: '$150K', status: 'Active' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of AgentLend protocol metrics and activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10 text-primary`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant={stat.positive ? 'success' : 'destructive'} className="text-xs">
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{loan.id}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{loan.agent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{loan.amount}</span>
                    <span className="text-muted-foreground">{loan.rate} APR</span>
                    <Badge variant={loan.status === 'Active' ? 'success' : loan.status === 'Repaid' ? 'default' : 'destructive'}>
                      {loan.status}
                    </Badge>
                    <div className="flex items-center gap-1" title={`ACS Score: ${loan.score} (${getScoreLabel(loan.score)})`}>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreColor(loan.score))}>
                        {loan.score}
                      </span>
                    </div>
                    <span className="text-muted-foreground">{loan.collateral} ({loan.collateralRatio}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Agents by ACS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <div key={agent.did} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{agent.did}</p>
                      <p className="text-sm text-muted-foreground">{agent.loans} loans • {agent.volume} volume</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreColor(agent.score))}>
                      {agent.score} {getScoreLabel(agent.score)}
                    </span>
                    <Badge variant="outline">{agent.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Protocol Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Collateralization Ratio</span>
                <span className="font-medium">185%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Liquidity Utilization</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '67%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Default Rate</span>
                <span className="font-medium text-destructive">0.8%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collateral Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { token: 'WETH', percentage: 45, value: '$1.08M' },
                { token: 'cbETH', percentage: 30, value: '$720K' },
                { token: 'USDC', percentage: 15, value: '$360K' },
                { token: 'Other', percentage: 10, value: '$240K' },
              ].map((item) => (
                <div key={item.token} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                      {item.token.slice(0, 2)}
                    </div>
                    <span className="font-medium">{item.token}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div className="h-2 bg-muted rounded-full overflow-hidden w-32">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-sm font-medium w-20">{item.percentage}%</span>
                    <span className="text-sm text-muted-foreground w-24">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="font-medium">Create New Loan</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Target className="h-4 w-4" />
              </div>
              <span className="font-medium">Request ACS Score</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="font-medium">View Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">Manage Agents</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}