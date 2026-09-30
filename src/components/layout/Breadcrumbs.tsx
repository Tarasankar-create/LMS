import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-secondary-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-1.5 size-3.5 text-secondary-300" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-primary-500">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
