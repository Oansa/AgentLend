import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn, formatCurrency, formatAddress, getScoreColor, getScoreLabel } from '../lib/utils';
import { Search, Filter, ChevronDown, ChevronUp, FileText, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { CreateLoanModal } from '../components/modals/CreateLoanModal';

const mockLoans = [
  { id: 'LN-001', borrower: 'did:croo:agent001', lender: '0x1234...5678', principal: 50000, interestRate: 12.5, startDate: '2026-01-15', maturity: '2026-04-15', collateralToken: 'WETH', collateralAmount: 2.5, status: 'Active', score: 780, outstanding: 51250 },
  { id: 'LN-002', borrower: 'did:croo:agent002', lender: '0xabcd...ef12', principal: 25000, interestRate: 15.0, startDate: '2026-02-01', maturity: '2026-05-01', collateralToken: 'cbETH', collateralAmount: 1.8, status: 'Active', score: 650, outstanding: 25625 },
  { id: 'LN-003', borrower: 'did:croo:agent003', lender: '0x5678...9012', principal: 100000, interestRate: 10.0, startDate: '2025-12-01', maturity: '2026-03-01', collateralToken: 'WETH', collateralAmount: 5.0, status: 'Repaid', score: 890, outstanding: 0 },
  { id: 'LN-004', borrower: 'did:croo:agent004', lender: '0x9012...3456', principal: 75000, interestRate: 18.5, startDate: '2026-01-20', maturity: '2026-04-20', collateralToken: 'USDC', collateralAmount: 75000, status: 'Liquidated', score: 420, outstanding: 0 },
  { id: 'LN-005', borrower: 'did:croo:agent005', lender: '0x3456...7890', principal: 30000, interestRate: 14.0, startDate: '2026-02-10', maturity: '2026-05-10', collateralToken: 'WETH', collateralAmount: 1.2, status: 'Active', score: 720, outstanding: 30700 },
  { id: 'LN-006', borrower: 'did:croo:agent006', lender: '0x7890...1234', principal: 200000, interestRate: 11.0, startDate: '2026-01-01', maturity: '2026-07-01', collateralToken: 'WETH', collateralAmount: 10.0, status: 'Active', score: 810, outstanding: 204500 },
  { id: 'LN-007', borrower: 'did:croo:agent007', lender: '0x2345...6789', principal: 15000, interestRate: 16.5, startDate: '2026-02-15', maturity: '2026-05-15', collateralToken: 'cbETH', collateralAmount: 1.0, status: 'Defaulted', score: 380, outstanding: 15450 },
  { id: 'LN-008', borrower: 'did:croo:agent008', lender: '0x6789...0123', principal: 80000, interestRate: 13.0, startDate: '2026-01-25', maturity: '2026-04-25', collateralToken: 'WETH', collateralAmount: 4.0, status: 'Active', score: 760, outstanding: 81800 },
];

export function Loans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'startDate', direction: 'desc' });
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);

  const statuses = ['all', 'Active', 'Repaid', 'Liquidated', 'Defaulted'];

  const handleLoanCreated = (loanId: string) => {
    console.log('Loan created:', loanId);
    // Optionally refresh the loans list here
    setShowCreateLoanModal(false);
  };

  const filteredLoans = mockLoans
    .filter((loan) => {
      const matchesSearch = loan.id.toLowerCase().includes(search.toLowerCase()) ||
        loan.borrower.toLowerCase().includes(search.toLowerCase()) ||
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

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">Monitor and manage all protocol loans</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateLoanModal(true)}>
            <FileText className="h-4 w-4 mr-2" /> New Loan
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search loans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
                    { key: 'id', label: 'Loan ID' },
                    { key: 'borrower', label: 'Borrower' },
                    { key: 'lender', label: 'Lender' },
                    { key: 'principal', label: 'Principal' },
                    { key: 'interestRate', label: 'Rate' },
                    { key: 'outstanding', label: 'Outstanding' },
                    { key: 'collateralToken', label: 'Collateral' },
                    { key: 'score', label: 'ACS Score' },
                    { key: 'status', label: 'Status' },
                    { key: 'maturity', label: 'Maturity' },
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
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="p-4 font-mono text-sm">{loan.id}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm truncate block max-w-[150px]">{loan.borrower}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{loan.lender}</span>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(loan.principal)}</td>
                    <td className="p-4 text-sm">{loan.interestRate}%</td>
                    <td className="p-4 font-medium">{formatCurrency(loan.outstanding)}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{loan.collateralToken} ({loan.collateralAmount})</span>
                    </td>
                    <td className="p-4">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreColor(loan.score))}>
                        {loan.score} {getScoreLabel(loan.score)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          loan.status === 'Active' ? 'success' :
                          loan.status === 'Repaid' ? 'default' :
                          loan.status === 'Liquidated' ? 'destructive' : 'warning'
                        }
                      >
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{loan.maturity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLoans.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No loans found matching your criteria</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLoans.length} of {mockLoans.length} loans
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateLoanModal
        isOpen={showCreateLoanModal}
        onClose={() => setShowCreateLoanModal(false)}
        onSuccess={handleLoanCreated}
      />
    </div>
  );
}