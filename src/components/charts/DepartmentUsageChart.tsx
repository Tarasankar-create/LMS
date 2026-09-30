import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DepartmentUsagePoint } from '@/utils/circulationStats';
import { CHART_COLORS } from '@/constants/colors';

export function DepartmentUsageChart({ data }: { data: DepartmentUsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="department"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
          height={70}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="loans" name="Books Borrowed" fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
