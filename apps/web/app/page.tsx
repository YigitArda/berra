import Link from 'next/link';
import { Card } from '../components/ui/card';
import { getApiConfigFallbackMessage, getHealthEndpoint } from '../lib/api';

export default async function HomePage() {
  let apiHealth: string;
  const healthEndpoint = getHealthEndpoint();

  if (!healthEndpoint) {
    apiHealth = getApiConfigFallbackMessage();
  } else {
    try {
      const res = await fetch(healthEndpoint, { cache: 'no-store' });
      apiHealth = res.ok ? 'API erişilebilir' : 'API yanıtı başarısız';
    } catch {
      apiHealth = 'API erişimi yok (api servisi çalışmıyor olabilir).';
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-3xl font-bold">Berra Frontend Stage-0</h1>
        <p className="mt-2 text-muted">App Router + Query + Zustand + Realtime + Form stack hazır.</p>
        <p className="mt-2"><strong>Durum:</strong> {apiHealth}</p>
      </Card>
      <Card className="grid gap-2">
        <Link href="/login" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/login</Link>
        <Link href="/register" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/register</Link>
        <Link href="/dashboard" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/dashboard</Link>
        <Link href="/feed" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/feed (liste)</Link>
        <Link href="/items/1" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/items/1 (detay)</Link>
        <Link href="/search" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/search</Link>
        <Link href="/notifications" className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">/notifications</Link>
      </Card>
    </div>
  );
}
