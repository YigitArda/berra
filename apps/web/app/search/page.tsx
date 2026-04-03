'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useSearch } from '../../hooks/use-search';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

  const searchQuery = useSearch(submitted);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="mb-3 text-2xl font-bold">Arama</h1>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Arama terimi..." />
          <Button onClick={() => setSubmitted(q)}>Ara</Button>
        </div>
      </Card>

      <div className="grid gap-2">
        {searchQuery.isError && (
          <Card>
            <p className="text-red-400">{toUserMessage(searchQuery.error)}</p>
          </Card>
        )}
        {searchQuery.isSuccess && searchQuery.data.items.length === 0 && submitted.trim().length > 1 && (
          <Card>
            <p>Sonuç bulunamadı.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
