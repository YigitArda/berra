import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl border border-slate-800 bg-surface p-4 shadow-sm', className)}>{children}</div>;
}
