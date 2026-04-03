import { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{children}</span>;
}
