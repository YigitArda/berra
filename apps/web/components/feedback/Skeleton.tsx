import { Card } from '../ui/card';

type SkeletonProps = {
  lines?: number;
  title?: string;
};

export function Skeleton({ lines = 3, title = 'Yükleniyor...' }: SkeletonProps) {
  return (
    <Card className="animate-pulse">
      <p className="mb-3 text-sm text-slate-300">{title}</p>
      <div className="grid gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-3 rounded bg-slate-800" />
        ))}
      </div>
    </Card>
  );
}
