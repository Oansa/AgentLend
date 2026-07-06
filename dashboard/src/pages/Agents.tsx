import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn, formatCurrency, getScoreColor, getScoreLabel } from '../lib/utils';
import { Search, Filter, ChevronDown, ChevronUp, User, Activity, TrendingUp, Download } from 'lucide-react';
import { useState } from 'react';

const mockAgents = [
  { did: 'did:croo:agent001', wallet: '0x1234...5678', score: 890, loansCount: 5, totalBorrowed: 250000, totalRepaid: 262500, defaulted: 0, collateralValue: 125000, status: 'Active', kyc: true, lastActive: '2026-01-20' },
  { did: 'did:croo:agent002', wallet: '0xabcd...ef12', score: 850, loansCount: 3, totalBorrowed: 180000, totalRepaid: 189000, defaulted: 0, collateralValue: 90000, status: 'Active', kyc: true, lastActive: '2026-01-18' },
  { did: 'did:croo:agent003', wallet: '0x5678...9012', score: 820, loansCount: 8, totalBorrowed: 420000, totalRepaid: 441000, defaulted: 0, collateralValue: 210000, status: 'Active', kyc: false, lastActive: '2026-01-22' },
  { did: 'did:croo:agent004', wallet: '0x9012...3456', score: 790, loansCount: 2, totalBorrowed: 95000, totalRepaid: 99750, defaulted: 0, collateralValue: 47500, status: 'Active', kyc: true, lastActive: '2026-01-15' },
  { did: 'did:croo:agent005', wallet: '0x3456...7890', score: 780, loansCount: 4, totalBorrowed: 150000, totalRepaid: 157500, defaulted: 0, collateralValue: 75000, status: 'Active', kyc: false, lastActive: '2026-01-19' },
  { did: 'did:croo:agent006', wallet: '0x7890...1234', score: 810, loansCount: 6, totalBorrowed: 300000, totalRepaid: 315000, defaulted: 0, collateralValue: 150000, status: 'Active', kyc: true, lastActive: '2026-01-21' },
  { did: 'did:croo:agent007', wallet: '0x2345...6789', score: 380, loansCount: 2, totalBorrowed: 50000, totalRepaid: 20000, defaulted: 1, collateralValue: 15000, status: 'Defaulted', kyc: false, lastActive: '2026-01-10' },
  { did: 'did:croo:agent008', wallet: '0x6789...0123', score: 760, loansCount: 3, totalBorrowed: 120000, totalRepaid: 126000, defaulted: 0, collateralValue: 60000, status: 'Active', kyc: true, lastActive: '2026-01-23' },
  { did: 'did:croo:agent009', wallet: '0x0123...4567', score: 720, loansCount: 1, totalBorrowed: 30000, totalRepaid: 31500, defaulted: 0, collateralValue: 15000, status: 'Active', kyc: false, lastActive: '2026-01-24' },
  { did: 'did:croo:agent010', wallet: '0x4567...8901', score: 680, loansCount: 4, totalBorrowed: 80000, totalRepaid: 84000, defaulted: 0, collateralValue: 40000, status: 'Active', kyc: true, lastActive: '2026-01-17' },
];

export function Agents() {
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'score', direction: 'desc' });

  const statuses = ['all', 'Active', 'Defaulted'];

  const filteredAgents = mockAgents
    .filter((agent) => {
      const matchesSearch = agent.did.toLowerCase().includes(search.toLowerCase()) ||
        agent.wallet.toLowerCase().includes(search.toLowerCase());
      const matchesScore = scoreFilter === 'all' || getScoreCategory(agent.score) === scoreFilter;
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesScore && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  function getScoreCategory(score: number): string {
    if (score >= 800) return 'excellent';
    if (score >= 700) return 'good';
    if (score >= 600) return 'fair';
    if (score >= 500) return 'poor';
    return 'very-poor';
  }

  const scoreLabels = {
    excellent: 'Excellent (800+)',
    good: 'Good (700-799)',
    fair: 'Fair (600-699)',
    poor: 'Poor (500-599)',
    'very-poor': 'Very Poor (300-499)',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">Monitor agent credit scores and lending activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button size="sm">
            <User className="h-4 w-4 mr-2" /> Add Agent
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{mockAgents.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{mockAgents.filter(a => a.status === 'Active').length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg ACS Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(mockAgents.reduce((sum, a) => sum + a.score, 0) / mockAgents.length)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">KYC Verified</p>
                <p className="text-2xl font-bold">{mockAgents.filter(a => a.kyc).length} / {mockAgents.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Scores</option>
                {Object.entries(scoreLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b">
                  {[
                    { key: 'did', label: 'Agent DID' },
                    { key: 'wallet', label: 'Wallet' },
                    { key: 'score', label: 'ACS Score' },
                    { key: 'kyc', label: 'KYC' },
                    { key: 'loansCount', label: 'Loans' },
                    { key: 'totalBorrowed', label: 'Total Borrowed' },
                    { key: 'totalRepaid', label: 'Total Repaid' },
                    { key: 'defaulted', label: 'Defaults' },
                    { key: 'collateralValue', label: 'Collateral' },
                    { key: 'status', label: 'Status' },
                    { key: 'lastActive', label: 'Last Active' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="text-left p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {getSortIcon(col.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.did} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm truncate block max-w-[180px]">{agent.did}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{agent.wallet}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreColor(agent.score))}>
                        {agent.score} {getScoreLabel(agent.score)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={agent.kyc ? 'success' : 'outline'}>
                        {agent.kyc ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{agent.loansCount}</td>
                    <td className="p-4 font-medium">{formatCurrency(agent.totalBorrowed)}</td>
                    <td className="p-4 font-medium">{formatCurrency(agent.totalRepaid)}</td>
                    <td className="p-4 text-sm">{agent.defaulted}</td>
                    <td className="p-4 font-medium">{formatCurrency(agent.collateralValue)}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          agent.status === 'Active' ? 'success' : 'destructive'
                        }
                      >
                        {agent.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{agent.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No agents found matching your criteria</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAgents.length} of {mockAgents.length} agents
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Users, Shield } from 'lucide-react';