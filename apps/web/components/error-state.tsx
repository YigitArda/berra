import { Card } from './ui/card';
import { Button } from './ui/button';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ message, onRetry, retryLabel = 'Tekrar dene' }: ErrorStateProps) {
  return (
    <Card className="border-red-900/50 bg-red-950/30 text-red-100">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button className="mt-3" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}
