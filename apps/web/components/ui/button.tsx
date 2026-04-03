import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'rounded-md bg-primary px-4 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
