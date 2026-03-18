'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MetricsBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function MetricsBarChart({
  data,
  color = '#3B82F6',
  height = 200,
  formatValue,
}: MetricsBarChartProps) {
  const fmt = formatValue || ((v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <Tooltip
          formatter={(value: number) => [fmt(value), 'Valor']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
