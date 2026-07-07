import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn, formatCurrency, getScoreColor, getScoreLabel } from '../lib/utils';
import { Search, ChevronDown, FileText, RefreshCw, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { CreateLoanModal } from '../components/modals/CreateLoanModal';
import { useLoans } from '../hooks/useLoans';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Repaid: 'bg-brand/10 text-brand border-brand/20',
  Liquidated: 'bg-destructive/10 text-destructive border-destructive/20',
  Defaulted: 'bg-destructive/10 text-destructive border-destructive/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  Active: <TrendingUp className="h-3 w-3" />,
  Repaid: <FileText className="h-3 w-3" />,
  Liquidated: <AlertTriangle className="h-3 w-3" />,
  Defaulted: <AlertTriangle className="h-3 w-3" />,
  Pending: <TrendingUp className="h-3 w-3 animate-pulse" />,
};

export function Loans() {
  const { loans, isLoading, error, refetch } = useLoans();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'startDate', direction: 'desc' });
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);

  const statuses = ['all', 'Active', 'Repaid', 'Liquidated', 'Defaulted'];

  const filteredLoans = loans
    .filter((loan) => {
      const matchesSearch = loan.id.toLowerCase().includes(search.toLowerCase()) ||
        loan.borrowerDID.toLowerCase().includes(search.toLowerCase()) ||
        loan.lender.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
      return matchesSearch && matchesStatus;
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

  const handleLoanCreated = (loanId: string) => {
    toast.success(`Loan ${loanId} created successfully!`);
    setShowCreateLoanModal(false);
    refetch();
  };

  const handleViewTransaction = (_loan: typeof loans[0]) => {
    // In production, link to block explorer with transaction hash
    toast.info('Transaction details would open in block explorer');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Loan data refreshed');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-brand-600 bg-clip-text text-transparent">
            Loans
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and manage protocol loans</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateLoanModal(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            Create Loan
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search loans by ID, borrower, lender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading loans from blockchain...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No loans found</h3>
              <p className="text-muted-foreground mt-1">
                {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first loan to get started'}
              </p>
              {(search || statusFilter !== 'all') && (
                <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Loan ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('borrowerDID')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Borrower <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('principal')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Principal <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('interestRate')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Rate <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('outstanding')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Outstanding <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('collateralToken')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Collateral <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('healthFactor')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Health <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('score')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        ACS Score <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('status')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Status <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('maturity')} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Maturity <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-mono text-sm font-medium">{loan.id}</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground truncate max-w-[200px]">{loan.borrowerDID}</p>
                          <p className="font-mono text-xs text-muted-foreground">{loan.borrower.slice(0, 10)}...</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium">{formatCurrency(loan.principal)} USDC</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium">{loan.interestRate}%</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium">{formatCurrency(loan.outstanding)} USDC</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-medium bg-muted rounded">{loan.collateralToken}</span>
                          <span className="text-sm text-muted-foreground">{loan.collateralAmount.toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                loan.healthFactor >= 1.5 ? "bg-success" :
                                loan.healthFactor >= 1.2 ? "bg-warning" : "bg-destructive"
                              )}
                              style={{ width: `${Math.min(loan.healthFactor / 2, 1) * 100}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-sm font-mono",
                            loan.healthFactor >= 1.5 ? "text-success" :
                            loan.healthFactor >= 1.2 ? "text-warning" : "text-destructive"
                          )}>
                            {loan.healthFactor.toFixed(2)}x
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            getScoreColor(loan.score)
                          )}>
                            {loan.score}
                          </span>
                          <span className="text-xs text-muted-foreground">{getScoreLabel(loan.score)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={statusColors[loan.status]}>
                          {statusIcons[loan.status]}
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{loan.maturity}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewTransaction(loan)}
                            className="h-8 w-8"
                            title="View transaction"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {loan.status === 'Active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Liquidate (if eligible)"
                              disabled={loan.healthFactor > 1}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Loans</p>
            <p className="text-2xl font-bold">{loans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Principal</p>
            <p className="text-2xl font-bold">
              {formatCurrency(loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.principal, 0))} USDC
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold">
              {formatCurrency(loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.outstanding, 0))} USDC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Loan Modal */}
      <CreateLoanModal
        isOpen={showCreateLoanModal}
        onClose={() => setShowCreateLoanModal(false)}
        onSuccess={handleLoanCreated}
      />
    </div>
  );
}