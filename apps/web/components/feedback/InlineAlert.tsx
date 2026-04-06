import { cn } from '../../lib/cn';

type InlineAlertVariant = 'error' | 'info' | 'success';

type InlineAlertProps = {
  message: string;
  variant?: InlineAlertVariant;
  className?: string;
};

const variantClasses: Record<InlineAlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100',
  info: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100',
};

export function InlineAlert({ message, variant = 'info', className }: InlineAlertProps) {
  return (
    <p 
      className={cn('rounded-md border px-3 py-2 text-sm', variantClasses[variant], className)} 
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
