import React, { ReactNode } from 'react';
import { cn } from '../../lib/cn';

const formMessageVariants = {
  helper: 'text-slate-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
} as const;

type FormMessageVariant = keyof typeof formMessageVariants;

type FormMessageProps = {
  id?: string;
  variant?: FormMessageVariant;
  children: ReactNode;
};

export function FormMessage({ id, variant = 'helper', children }: FormMessageProps) {
  return (
    <p id={id} className={cn('text-xs', formMessageVariants[variant])}>
      {children}
    </p>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ id, label, helperText, errorText, successText, children, className }: FormFieldProps) {
  const messageId = errorText ? `${id}-error` : helperText ? `${id}-hint` : successText ? `${id}-success` : undefined;

  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </label>
      <div>
        {React.isValidElement(children) 
          ? React.cloneElement(children as React.ReactElement, {
              id,
              'aria-describedby': messageId,
              'aria-invalid': errorText ? true : undefined,
            })
          : children
        }
      </div>
      {helperText && !errorText && <FormMessage id={`${id}-hint`}>{helperText}</FormMessage>}
      {errorText && (
        <FormMessage id={`${id}-error`} variant="error">
          {errorText}
        </FormMessage>
      )}
      {successText && (
        <FormMessage id={`${id}-success`} variant="success">
          {successText}
        </FormMessage>
      )}
    </div>
  );
}
