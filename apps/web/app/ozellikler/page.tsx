import { Card } from '../../components/ui/card';

const features = [
  'Forum + akış deneyimi',
  'Model merkezi ve takip akışları',
  'Bildirimler ve gerçek zamanlı güncellemeler',
  'Profil, bookmark ve raporlama araçları',
] as const;

export default function OzelliklerPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Özellikler</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Platformun temel özellikleri Next arayüzünde tek noktada listelenir.
        </p>
      </Card>

      <Card>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
          {features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
