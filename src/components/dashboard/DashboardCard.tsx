import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DashboardCardProps {
  title: string;
  description?: string;
  /** "View all" style link in the header; omit it when the user may not open the target page. */
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}

/** Shared frame for dashboard widgets so every panel has the same header, spacing and link style. */
export function DashboardCard({ title, description, action, children, className }: DashboardCardProps) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-2xl border border-secondary-100 bg-white p-5 shadow-sm', className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-secondary-500">{description}</p>}
        </div>
        {action && (
          <Link to={action.to} className="inline-flex flex-none items-center gap-1 rounded-md text-xs font-semibold text-primary-600 hover:text-primary-500 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
            {action.label}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        )}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function WidgetEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-secondary-200 bg-secondary-50 px-4 py-6 text-center text-sm text-secondary-500">{children}</p>;
}
