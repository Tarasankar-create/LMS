import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-200 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary-100">
        <Icon className="size-6 text-secondary-500" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-secondary-500">{description}</p>}
      {action && (
        <Button size="sm" variant="outline" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
