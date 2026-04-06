import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { STANDARD_RETRY_LABEL } from './messages';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = STANDARD_RETRY_LABEL,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button className="mt-3" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? 'Yenileniyor...' : retryLabel}
        </Button>
      )}
    </Card>
  );
}
