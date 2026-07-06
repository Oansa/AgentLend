import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  iconBg = 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  trend = 'neutral',
  className,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted-foreground';

  return (
    <div className={cn(
      'group relative p-6 rounded-2xl transition-all duration-300 animate-fade-in',
      'bg-card border border-card-border hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-lg',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <TrendIcon className={cn('h-4 w-4', trendColor)} aria-hidden="true" />
              <span className={cn('text-sm font-medium', trendColor)}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-3 rounded-xl transition-all duration-300 group-hover:scale-110',
            iconBg
          )}>
            {icon}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
    </div>
  );
}