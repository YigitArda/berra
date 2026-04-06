import { Card } from '../ui/card';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>}
    </Card>
  );
}
