import { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || props['aria-invalid'] ? true : undefined}
      className={cn(
        'w-full rounded-md border bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        error
          ? 'border-red-500 focus-visible:ring-red-500'
          : 'border-slate-700 focus-visible:ring-primary',
        className,
      )}
      {...props}
    />
  );
}
