import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type FormFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ id, label, helperText, errorText, children, className }: FormFieldProps) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-100">
        {label}
      </label>
      {children}
      {helperText && <p id={`${id}-hint`} className="text-xs text-slate-400">{helperText}</p>}
      {errorText && <p id={`${id}-error`} className="text-xs text-red-400">{errorText}</p>}
    </div>
  );
}
