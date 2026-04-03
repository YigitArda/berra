'use client';

import { useState } from 'react';
import { Skeleton } from '../../components/feedback/Skeleton';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';

export function DashboardClient() {
  const { isLoading } = useRequireAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Yenileniyor...' : 'Verileri yenile'}
        </Button>
      </div>
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
    </div>
  );
}
