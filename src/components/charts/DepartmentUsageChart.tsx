import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DepartmentUsagePoint } from '@/utils/circulationStats';
import { CHART_COLORS } from '@/constants/colors';

export interface CategoryUsagePoint {
  category?: string;
  department?: string;
  loans: number;
}

export function DepartmentUsageChart({
  data,
}: {
  data: (DepartmentUsagePoint | CategoryUsagePoint)[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey={(d) => d.category ?? d.department}
          tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={40}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value) => [`${value} books`, 'Books Borrowed']}
        />
        <Bar dataKey="loans" name="Books Borrowed" fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CategoryUsageChart = DepartmentUsageChart;

