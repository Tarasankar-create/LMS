import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ChartCard({ title, description, children, actions }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-secondary-500">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
