import React from 'react';
import { Children, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';
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
  children: ReactElement;
  className?: string;
};

export function FormField({ id, label, helperText, errorText, successText, children, className }: FormFieldProps) {
  const messageIds = [helperText ? `${id}-hint` : null, errorText ? `${id}-error` : null, successText ? `${id}-success` : null]
    .filter(Boolean)
    .join(' ');

  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error('FormField requires a valid React element as its child.');
  }

  const ariaDescribedBy = messageIds || undefined;

  const enhancedChild = cloneElement(child as ReactElement, {
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': errorText ? true : undefined,
  });

  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </label>
      {enhancedChild}
      {helperText && <FormMessage id={`${id}-hint`}>{helperText}</FormMessage>}
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
