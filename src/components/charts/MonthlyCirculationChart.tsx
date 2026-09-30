import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyCirculationPoint } from '@/utils/circulationStats';
import { CHART_COLORS } from '@/constants/colors';

export function MonthlyCirculationChart({ data }: { data: MonthlyCirculationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="issued" name="Issued" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="returned" name="Returned" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="renewals" name="Renewals" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
