'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/card';
import { apiFetch } from '../../lib/api';

type ModelItem = {
  id: number;
  brand: string;
  model: string;
  generation: string | null;
  slug: string;
  description: string | null;
};

type ModelsResponse = {
  models: ModelItem[];
};

export default function ModelsPage() {
  const modelsQuery = useQuery({
    queryKey: ['models', 'list'],
    // CUTOVER_PROXY: `/discovery/*` requests go through Nest API and are proxied during migration.
    queryFn: () => apiFetch<ModelsResponse>('/discovery/models?page=1&limit=40'),
  });

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Marka / Model merkezi</h1>
        <p className="mt-2 text-sm text-slate-300">Model bazlı içerik, takip ve kronik sorun takibi.</p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {(modelsQuery.data?.models ?? []).map((item) => (
          <Card key={item.id}>
            <Link className="text-lg font-semibold hover:underline" href={`/models/${item.slug}`}>
              {item.brand} {item.model}
            </Link>
            {item.generation && <p className="mt-1 text-sm text-slate-400">Jenerasyon: {item.generation}</p>}
            {item.description && <p className="mt-2 text-sm text-slate-300">{item.description}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
