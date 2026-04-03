import { cn } from '../../lib/cn';

type InlineAlertVariant = 'error' | 'info' | 'success';

type InlineAlertProps = {
  message: string;
  variant?: InlineAlertVariant;
  className?: string;
};

const variantClasses: Record<InlineAlertVariant, string> = {
  error: 'border-red-900/60 bg-red-950/40 text-red-100',
  info: 'border-slate-700 bg-slate-900/60 text-slate-100',
  success: 'border-emerald-900/60 bg-emerald-950/40 text-emerald-100',
};

export function InlineAlert({ message, variant = 'info', className }: InlineAlertProps) {
  return (
    <p className={cn('rounded-md border px-3 py-2 text-sm', variantClasses[variant], className)} role="alert">
      {message}
    </p>
  );
}
