import Link from 'next/link';
import { Card } from '../components/ui/card';

export default async function HomePage() {
  let apiHealth: string;

  try {
    const res = await fetch('http://localhost:4000/api/health', { cache: 'no-store' });
    apiHealth = res.ok ? 'API erişilebilir' : 'API yanıtı başarısız';
  } catch {
    apiHealth = 'API erişimi yok (lokalde api çalışmıyor olabilir).';
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-3xl font-bold">Berra Frontend Stage-0</h1>
        <p className="mt-2 text-slate-300">App Router + Query + Zustand + Realtime + Form stack hazır.</p>
        <p className="mt-2"><strong>Durum:</strong> {apiHealth}</p>
      </Card>
      <Card className="grid gap-2">
        <Link href="/login">/login</Link>
        <Link href="/register">/register</Link>
        <Link href="/dashboard">/dashboard</Link>
        <Link href="/feed">/feed (liste)</Link>
        <Link href="/items/1">/items/1 (detay)</Link>
        <Link href="/search">/search</Link>
        <Link href="/notifications">/notifications</Link>
      </Card>
    </div>
  );
}
