import { ReactNode } from 'react';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';

type DataStateProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function DataState({
  isLoading,
  isError,
  isEmpty,
  errorMessage,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-300">Yükleniyor...</p>;
  }

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
