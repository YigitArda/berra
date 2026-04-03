import Link from 'next/link';
import { requireServerSession } from '../../../lib/auth/server';
import { Card } from '../../../components/ui/card';

type MessageThreadPageProps = {
  params: {
    username: string;
  };
};

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  await requireServerSession(`/messages/${params.username}`);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">@{params.username} ile sohbet</h1>
        <p className="mt-2 text-sm text-slate-300">
          Mesajlaşma arayüzü Next tarafına taşındı. Bu alan gerçek zamanlı chat bileşenleri için hazır.
        </p>
        <Link className="mt-3 inline-block text-sm text-blue-300 hover:underline" href="/messages">
          ← Mesaj listesine dön
        </Link>
      </Card>
    </div>
  );
}
