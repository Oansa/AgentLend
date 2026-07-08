import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn, formatCurrency, getScoreColor, getScoreLabel } from '../lib/utils';
import { Search, ChevronDown, FileText, RefreshCw, Eye, AlertTriangle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { CreateLoanModal } from '../components/modals/CreateLoanModal';
import { useLoans } from '../hooks/useLoans';
import { toast } from 'sonner';

// Base Sepolia block explorer
const BASE_SEPOLIA_EXPLORER = import.meta.env.VITE_BASE_SEPOLIA_EXPLORER || 'https://sepolia.basescan.org';
const LENDING_POOL_ADDRESS = import.meta.env.VITE_LENDING_POOL_ADDRESS || '';

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
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
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

  const handleViewTransaction = (loan: typeof loans[0]) => {
    // Use txHash if available for direct transaction link
    if (loan.txHash) {
      const url = `${BASE_SEPOLIA_EXPLORER}/tx/${loan.txHash}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opened transaction in block explorer');
    } else {
      // Fallback: open contract page and filter by method
      const url = `${BASE_SEPOLIA_EXPLORER}/address/${LENDING_POOL_ADDRESS}#tokentxns`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.info('Transaction hash not available - opened contract page');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Loan data refreshed');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Active: { bg: '#dcfce7', text: '#15803d' },
      Repaid: { bg: '#dbeafe', text: '#1e52b3' },
      Liquidated: { bg: '#ffe4e6', text: '#b91c1c' },
      Defaulted: { bg: '#ffe4e6', text: '#b91c1c' },
      Pending: { bg: '#fefec6', text: '#854d0e' },
    };
    return variants[status] || variants.Active;
  };

  const getHealthBadge = (healthFactor: number) => {
    if (healthFactor < 1.2) return { bg: '#ffe4e6', text: '#b91c1c', label: 'Critical' };
    if (healthFactor < 1.5) return { bg: '#e0f2fe', text: '#0369a1', label: 'Watch' };
    return { bg: '#dcfce7', text: '#15803d', label: 'Stable' };
  };

  return (
    <div className="min-h-screen bg-[#f0f5fa] text-[#1e293b] font-sans space-y-6 p-8 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Loans</h1>
          <p className="text-[#64748b] mt-1">Monitor and manage protocol loans</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateLoanModal(true)} className="gap-2 bg-[#1e52b3] hover:bg-[#153d8a]">
            <FileText className="h-4 w-4" />
            Create Loan
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-[#fecaca] bg-[#fff1f2]">
          <CardContent className="p-4 flex items-center gap-3 text-[#b91c1c]">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card className="rounded-3xl border-[#e2e8f0] shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search loans by ID, borrower, lender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3a82f6] focus:border-transparent text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#64748b]">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3a82f6] focus:border-transparent text-sm"
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
      <Card className="rounded-3xl border-[#e2e8f0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-[#1e52b3] mx-auto mb-2" />
              <p className="text-[#64748b]">Loading loans from blockchain...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-[#64748b]/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1e293b]">No loans found</h3>
              <p className="text-[#64748b] mt-1">
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="px-4 py-3">Loan ID</th>
                    <th className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('borrowerDID')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Borrower <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('principal')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Principal <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('interestRate')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Rate <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('outstanding')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Outstanding <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('collateralToken')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Collateral <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('healthFactor')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Health <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('score')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        ACS Score <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('status')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Status <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSort('maturity')} className="h-auto p-0 text-[#64748b] hover:text-[#1e293b]">
                        Maturity <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-sm">
                  {filteredLoans.map((loan) => {
                    const statusBadge = getStatusBadge(loan.status);
                    const healthBadge = getHealthBadge(loan.healthFactor);
                    const scoreColor = getScoreColor(loan.score);

                    return (
                      <tr key={loan.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-[#1e293b]">{loan.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#1e293b] font-mono text-sm truncate max-w-[200px]">{loan.borrowerDID}</p>
                            <p className="font-mono text-xs text-[#64748b]">{loan.borrower.slice(0, 10)}...</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#1e293b]">{formatCurrency(loan.principal)} USDC</td>
                        <td className="px-4 py-3 text-right font-medium text-[#64748b]">{loan.interestRate}%</td>
                        <td className="px-4 py-3 text-right font-medium text-[#1e293b]">{formatCurrency(loan.outstanding)} USDC</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-[#f1f5f9] rounded">{loan.collateralToken}</span>
                            <span className="text-sm text-[#64748b]">{loan.collateralAmount.toFixed(4)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end space-y-1">
                            <div className={`font-bold text-lg ${healthBadge.text}`}>
                              HF: {loan.healthFactor.toFixed(2)}
                            </div>
                            <div className="text-xs text-[#64748b] font-mono">{loan.interestRate}% APR</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${scoreColor}`}>
                              {loan.score}
                            </span>
                            <span className="text-xs text-[#64748b]">{getScoreLabel(loan.score)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{loan.maturity}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewTransaction(loan)}
                              className="h-8 w-8 text-[#64748b] hover:text-[#1e52b3] hover:bg-[#dbeafe]"
                              title="View on Base Sepolia Explorer"
                            >
                              <Eye className="h-4 w-4" />
                              <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
                            </Button>
                            {loan.status === 'Active' && loan.healthFactor < 1.5 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ffe4e6]"
                                title="Liquidate (if eligible)"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748b] uppercase tracking-wider">Total Loans</p>
            <p className="text-2xl font-bold text-[#1e293b] mt-1">{loans.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748b] uppercase tracking-wider">Active Principal</p>
            <p className="text-2xl font-bold text-[#1e293b] mt-1">
              {formatCurrency(loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.principal, 0))} USDC
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748b] uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-[#1e293b] mt-1">
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