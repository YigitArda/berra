import { Card } from '../../../components/ui/card';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Detay #{id}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Detay ekranı stage-0 placeholder. API entegrasyonu eklenebilir.</p>
    </Card>
  );
}
