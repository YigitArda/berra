'use client';

import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';

export function DashboardClient() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <p>Oturum doğrulanıyor...</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <h2 className="text-sm text-slate-400">Toplam Gönderi</h2>
        <p className="text-3xl font-bold">128</p>
      </Card>
      <Card>
        <h2 className="text-sm text-slate-400">Aktif Bildirim</h2>
        <p className="text-3xl font-bold">5</p>
      </Card>
      <Card>
        <h2 className="text-sm text-slate-400">Arama Trendleri</h2>
        <p className="text-3xl font-bold">24</p>
      </Card>
    </div>
  );
}
