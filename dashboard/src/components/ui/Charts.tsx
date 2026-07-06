import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../../lib/utils';

const COLORS = {
  brand: 'hsl(var(--brand-500))',
  brandLight: 'hsl(var(--brand-400))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--danger))',
  muted: 'hsl(var(--muted-foreground))',
  grid: 'hsl(var(--border))',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  boxShadow: '0 4px 24px hsl(var(--foreground) / 0.1)',
};

export function LineChartWidget({
  data,
  className,
  color = 'brand',
  showArea = true,
}: {
  data: { name: string; value: number }[];
  className?: string;
  color?: keyof typeof COLORS;
  showArea?: boolean;
}) {
  return (
    <div className={cn('h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[color as keyof typeof COLORS]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[color as keyof typeof COLORS]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val >= 1e6 ? `${(val/1e6).toFixed(1)}M` : val >= 1e3 ? `${(val/1e3).toFixed(1)}K` : val}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number) => [val.toLocaleString(), '']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS[color as keyof typeof COLORS]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${color})`}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS[color as keyof typeof COLORS]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartWidget({
  data,
  className,
  color = 'brand',
  horizontal = false,
}: {
  data: { name: string; value: number; label?: string }[];
  className?: string;
  color?: keyof typeof COLORS;
  horizontal?: boolean;
}) {
  return (
    <div className={cn('h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 10, right: 10, left: 0, bottom: horizontal ? 30 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={!horizontal} horizontal={horizontal} />
          <XAxis
            dataKey={horizontal ? 'value' : 'name'}
            type={horizontal ? 'number' : 'category'}
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey={horizontal ? 'name' : 'value'}
            type={horizontal ? 'category' : 'number'}
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={horizontal ? 100 : undefined}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number) => [val.toLocaleString(), '']} />
          <Bar
            dataKey={horizontal ? 'name' : 'value'}
            fill={COLORS[color as keyof typeof COLORS]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartWidget({
  data,
  className,
  colors = ['brand', 'brandLight', 'success', 'warning', 'danger', 'muted'],
  innerRadius = 60,
}: {
  data: { name: string; value: number }[];
  className?: string;
  colors?: (keyof typeof COLORS)[];
  innerRadius?: number;
}) {
  const COLORS_ARRAY = colors.map(c => COLORS[c]);

  return (
    <div className={cn('h-64 flex items-center justify-center', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number) => [val.toLocaleString(), '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLineChartWidget({
  data,
  lines = [{ key: 'value', color: 'brand', name: 'Value' }],
  className,
}: {
  data: Record<string, string | number>[];
  lines: { key: string; color: keyof typeof COLORS; name: string }[];
  className?: string;
}) {
  return (
    <div className={cn('h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={COLORS[line.color]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}