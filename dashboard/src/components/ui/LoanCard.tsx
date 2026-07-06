import { cn } from '../../lib/utils';
import { formatCurrency, getScoreColor, getScoreLabel, getCollateralRatio } from '../../lib/utils';
import { ExternalLink, ChevronRight, AlertCircle, CheckCircle, Clock, Shield, Calendar } from 'lucide-react';

interface LoanCardProps {
  id: string;
  borrower: string;
  borrowerDID: string;
  principal: number;
  interestRate: number;
  outstanding: number;
  collateralToken: string;
  collateralAmount: number;
  collateralValueUSD: number;
  status: 'Active' | 'Repaid' | 'Liquidated' | 'Defaulted' | 'Pending';
  score: number;
  maturity: string;
  startDate: string;
  healthFactor?: number;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG = {
  Active: { label: 'Active', icon: CheckCircle, color: 'bg-success/10 text-success border-success/20', pulse: true },
  Repaid: { label: 'Repaid', icon: CheckCircle, color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400', pulse: false },
  Liquidated: { label: 'Liquidated', icon: AlertCircle, color: 'bg-danger/10 text-danger border-danger/20', pulse: false },
  Defaulted: { label: 'Defaulted', icon: AlertCircle, color: 'bg-destructive/10 text-destructive border-destructive/20', pulse: false },
  Pending: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning border-warning/20', pulse: true },
} as const;

export function LoanCard({
  id,
  borrower,
  borrowerDID,
  principal,
  interestRate,
  outstanding,
  collateralToken,
  collateralAmount,
  collateralValueUSD,
  status,
  score,
  maturity,
  startDate,
  healthFactor,
  onClick,
  className,
}: LoanCardProps) {
  const StatusConfig = STATUS_CONFIG[status];
  const StatusIcon = StatusConfig.icon;
  const daysToMaturity = Math.ceil((new Date(maturity).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysToMaturity <= 7 && daysToMaturity > 0;
  const isOverdue = daysToMaturity < 0;

  return (
    <article
      className={cn(
        'group relative p-5 rounded-2xl transition-all duration-300 animate-fade-in cursor-pointer',
        'bg-card border border-card-border hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-xl',
        'hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Status indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl">
        <div className={cn(
          'h-full rounded-t-2xl transition-all duration-500',
          status === 'Active' ? 'bg-gradient-to-r from-success to-success/50' :
          status === 'Repaid' ? 'bg-gradient-to-r from-brand-500 to-brand-400' :
          status === 'Liquidated' ? 'bg-gradient-to-r from-danger to-danger/50' :
          status === 'Defaulted' ? 'bg-gradient-to-r from-destructive to-destructive/50' :
          'bg-gradient-to-r from-warning to-warning/50'
        )} />
      </div>

      <div className="relative z-10">
        {/* Header: ID + Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground font-medium">
              #{id.slice(-6).toUpperCase()}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
              StatusConfig.color,
              StatusConfig.pulse && 'animate-pulse'
            )}>
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {StatusConfig.label}
            </span>
          </div>
          {onClick && (
            <ExternalLink className="text-muted-foreground hover:text-brand-500 transition-colors h-5 w-5 opacity-0 group-hover:opacity-100" />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Principal & Outstanding */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Principal</p>
            <p className="text-lg font-bold">{formatCurrency(principal)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</p>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{formatCurrency(outstanding)}</p>
          </div>
          {/* Interest Rate & Health Factor */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interest Rate</p>
            <p className="text-lg font-bold">{interestRate}%</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Health Factor</p>
            <p className={cn('text-lg font-bold', healthFactor !== undefined && healthFactor < 1.5 ? 'text-danger' : 'text-success')}>
              {healthFactor ? healthFactor.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Collateral Section */}
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Collateral
            </p>
            <span className="text-xs font-mono text-muted-foreground">{collateralToken}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{collateralAmount}</span>
            <span className="text-muted-foreground">≈ {formatCurrency(collateralValueUSD)}</span>
          </div>
          {/* Collateral ratio bar */}
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-brand-500 to-brand-40000"
              style={{ width: `${Math.min(getCollateralRatio(score), 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Collateral ratio: {getCollateralRatio(score)}% (ACS: {score})
          </p>
        </div>

        {/* Borrower Info */}
        <div className="mb-4 p-3 rounded-xl bg-accent/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Borrower</p>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreColor(score))}>
              ACS {score} • {getScoreLabel(score)}
            </span>
          </div>
          <p className="font-mono text-sm truncate">{borrowerDID}</p>
          <p className="text-xs text-muted-foreground mt-1">Wallet: {borrower}</p>
        </div>

        {/* Footer: Dates & Actions */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Started: {new Date(startDate).toLocaleDateString()}</span>
              </span>
              <span className={cn('flex items-center gap-1.5', isOverdue ? 'text-danger' : isExpiringSoon ? 'text-warning' : '')}>
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {isOverdue ? `Overdue by ${Math.abs(daysToMaturity)}d` :
                   isExpiringSoon ? `Expires in ${daysToMaturity}d` :
                   `Matures: ${new Date(maturity).toLocaleDateString()}`}
                </span>
              </span>
            </div>
            {onClick && (
              <button className="px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1">
                View Details
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

