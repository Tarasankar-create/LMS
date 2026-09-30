import { useId, type ReactNode } from 'react';


export const inputClass =
  'w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-secondary-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-secondary-50 disabled:text-secondary-500';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-secondary-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-secondary-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'url' | 'date' | 'number' | 'tel' | 'password';
  className?: string;
}

export function TextField({ label, value, onChange, hint, error, placeholder, disabled, type = 'text', className }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input id={id} type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextFieldProps, 'type'> {
  rows?: number;
}

export function TextAreaField({ label, value, onChange, hint, error, placeholder, disabled, rows = 4, className }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <textarea id={id} rows={rows} value={value} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | readonly string[];
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({ label, value, onChange, options, hint, disabled, className }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </FieldShell>
  );
}
