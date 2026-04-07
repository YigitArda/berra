import Link from 'next/link';
import { requireServerSession } from '../../../lib/auth/server';
import { Card } from '../../../components/ui/card';

export default async function MessageThreadPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  await requireServerSession(`/messages/${username}`);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">@{username} ile sohbet</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Mesajlaşma arayüzü Next tarafına taşındı. Bu alan gerçek zamanlı chat bileşenleri için hazır.
        </p>
        <Link className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-300" href="/messages">
          ← Mesaj listesine dön
        </Link>
      </Card>
    </div>
  );
}
