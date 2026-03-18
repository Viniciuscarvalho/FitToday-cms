'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface GroupedBarChartProps {
  data: { label: string; [key: string]: string | number }[];
  bars: { dataKey: string; color: string; name: string }[];
  height?: number;
  formatValue?: (value: number) => string;
}

export function GroupedBarChart({
  data,
  bars,
  height = 200,
  formatValue,
}: GroupedBarChartProps) {
  const fmt = formatValue || ((v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <Tooltip
          formatter={(value: number, name: string) => [fmt(value), name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name}
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
