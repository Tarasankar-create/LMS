import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryDistributionPoint } from "@/utils/circulationStats";
import { CATEGORY_CHART_COLORS } from "@/constants/categories";
import type { BookCategory } from "@/types";

export function CategoryDistributionChart({
  data,
}: {
  data: CategoryDistributionPoint[];
}) {
  return (
    <>
      {/* The graphic is decorative for assistive tech; the same numbers are listed as text. */}
      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.category}>
            {d.category}: {d.count}
          </li>
        ))}
      </ul>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart accessibilityLayer={false}>
            <Pie
              rootTabIndex={-1}
              data={data}
              dataKey="count"
              nameKey="category"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_CHART_COLORS[entry.category as BookCategory]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
