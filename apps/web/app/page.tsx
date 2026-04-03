'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '../components/ui/card';
import { getServerSession } from '../lib/auth/server';

export default async function HomePage() {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/feed');
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-3xl font-bold">Berra'ya hoş geldin</h1>
        <p className="mt-2 text-slate-300">
          Türkiye'nin araba topluluğu: forum, feed, model merkezi, sanayi rehberi ve araç karşılaştırma.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Giriş yap
          </Link>
          <Link href="/register" className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-slate-500">
            Kayıt ol
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Forum</h2>
          <p className="mt-2 text-sm text-slate-300">Kategori bazlı konu açın, yanıtlayın, etiketlerle keşfedin.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Model Merkezi</h2>
          <p className="mt-2 text-sm text-slate-300">Marka/model bazlı kronik sorunlar, bakım ve içerikleri görün.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Araç Araçları</h2>
          <p className="mt-2 text-sm text-slate-300">Karşılaştırma, rehber ve sanayi keşfi ile karar sürecini hızlandırın.</p>
        </Card>
      </div>
    </div>
  );
}
