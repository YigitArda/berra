import { requireServerSession } from '../../lib/auth/server';
import { Card } from '../../components/ui/card';

export default async function MessagesPage() {
  await requireServerSession('/messages');

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mesajlar</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Mesaj kutusu Next tarafına taşındı. Sohbet listesi ve gerçek zamanlı görüşmeler bu ekranın altında yer alacak.
        </p>
      </Card>
    </div>
  );
}
