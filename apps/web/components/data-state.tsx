import { ReactNode } from 'react';
import { EmptyState } from './feedback/EmptyState';
import { ErrorState } from './feedback/ErrorState';
import { Skeleton } from './feedback/Skeleton';
import { resolveFeedbackErrorMessage } from './feedback/messages';

type DataStateProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: unknown;
  emptyTitle: string;
  emptyDescription?: string;
  loadingTitle?: string;
  skeletonLines?: number;
  onRetry?: () => void;
  isRetrying?: boolean;
  children: ReactNode;
};

export function DataState({
  isLoading,
  isError,
  isEmpty,
  error,
  emptyTitle,
  emptyDescription,
  loadingTitle,
  skeletonLines,
  onRetry,
  isRetrying,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <Skeleton title={loadingTitle} lines={skeletonLines} />;
  }

  if (isError) {
    return <ErrorState message={resolveFeedbackErrorMessage(error)} onRetry={onRetry} isRetrying={isRetrying} />;
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
