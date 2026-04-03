import React from 'react';
import { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const inputVariants = {
  default: 'border-slate-700 focus-visible:ring-primary',
  invalid: 'border-red-500 focus-visible:ring-red-500',
  success: 'border-emerald-500 focus-visible:ring-emerald-500',
} as const;

export const inputSizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
} as const;

export type InputVariant = keyof typeof inputVariants;
export type InputSize = keyof typeof inputSizes;

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  error?: boolean;
  variant?: InputVariant;
  size?: InputSize;
};

export function Input({ className, error = false, variant = 'default', size = 'md', ...props }: InputProps) {
  const resolvedVariant = error ? 'invalid' : variant;

  return (
    <input
      aria-invalid={resolvedVariant === 'invalid' || props['aria-invalid'] ? true : undefined}
      className={cn(
        'w-full rounded-md border bg-slate-900 text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        inputVariants[resolvedVariant],
        inputSizes[size],
        className,
      )}
      {...props}
    />
  );
}
