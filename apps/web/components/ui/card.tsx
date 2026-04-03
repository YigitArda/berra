import React from 'react';
import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const cardVariants = {
  default: 'border-slate-700/80 bg-surface shadow-sm shadow-black/20',
  outline: 'border-slate-600/80 bg-transparent shadow-none',
  elevated: 'border-slate-700/80 bg-slate-900 shadow-md shadow-black/25',
} as const;

export const cardSizes = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export type CardVariant = keyof typeof cardVariants;
export type CardSize = keyof typeof cardSizes;

type CardProps = {
  className?: string;
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
};

export function Card({ className, children, variant = 'default', size = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-slate-950',
        cardVariants[variant],
        cardSizes[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
