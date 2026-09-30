import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
};

export function Drawer({ isOpen, onClose, title, size = 'md', children, footer }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-secondary-900/50" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative z-10 flex h-full w-full flex-col bg-white shadow-2xl', SIZE_CLASSES[size])}
      >
        <div className="flex items-center justify-between border-b border-secondary-100 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-600"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-secondary-100 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
