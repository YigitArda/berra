import React from 'react';
import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const badgeVariants = {
  danger: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-slate-950',
  neutral: 'bg-slate-700 text-slate-100',
  outline: 'border border-slate-600 bg-transparent text-slate-200',
} as const;

export const badgeSizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;
export type BadgeSize = keyof typeof badgeSizes;

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

export function Badge({ children, variant = 'danger', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full font-bold', badgeVariants[variant], badgeSizes[size], className)}>
      {children}
    </span>
  );
}
