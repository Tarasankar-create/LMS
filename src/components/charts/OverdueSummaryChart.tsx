import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OverdueBucket } from '@/utils/overdueStats';
import { CHART_COLORS } from '@/constants/colors';

export function OverdueSummaryChart({ data }: { data: OverdueBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="bucket"
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="count" name="Overdue Books" fill={CHART_COLORS.danger} radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
