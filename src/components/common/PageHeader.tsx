import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '@/components/layout/Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && <div className="mb-2"><Breadcrumbs items={breadcrumbs} /></div>}
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-secondary-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
