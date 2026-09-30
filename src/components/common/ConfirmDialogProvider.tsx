import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={options !== null}
        onClose={() => handleClose(false)}
        title={options?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={options?.tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => handleClose(true)}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          {options?.tone === 'danger' && (
            <div className="flex size-9 flex-none items-center justify-center rounded-full bg-danger-50">
              <AlertTriangle className="size-5 text-danger-500" />
            </div>
          )}
          <p className="text-sm text-secondary-600">{options?.description}</p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  return ctx;
}
