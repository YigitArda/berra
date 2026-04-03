'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { useCreateThread } from '../../../hooks/use-forum';

export function NewThreadClient() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const createThread = useCreateThread();

  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">Yeni Konu</h1>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          createThread.mutate(
            { title, body, category_id: Number(categoryId) },
            {
              onSuccess: (data) => {
                const slug = (data as { slug?: string }).slug;
                if (slug) router.push(`/thread/${slug}`);
              },
            },
          );
        }}
      >
        <FormField id="title" label="Başlık">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="category" label="Kategori">
          <select
            id="category"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="1">Genel</option>
            <option value="2">Haberler</option>
            <option value="5">Modifiye</option>
            <option value="3">Alım-Satım</option>
            <option value="4">Teknik</option>
          </select>
        </FormField>
        <FormField id="body" label="İçerik">
          <textarea id="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="rounded-md border border-slate-700 bg-slate-900 p-3" />
        </FormField>
        <Button type="submit" disabled={!title.trim() || !body.trim() || createThread.isPending}>
          {createThread.isPending ? 'Gönderiliyor...' : 'Konu Aç'}
        </Button>
      </form>
    </Card>
  );
}
