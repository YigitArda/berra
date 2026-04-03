import { Card } from '../../components/ui/card';

export default function DashboardPage() {
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
