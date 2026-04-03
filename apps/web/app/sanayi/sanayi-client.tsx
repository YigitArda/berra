'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { DataState } from '../../components/data-state';
import { useBusinesses, useSubmitBusiness } from '../../hooks/use-businesses';
import { useSession } from '../../hooks/use-session';

const categories = ['Motor', 'Kaporta', 'Lastik', 'Ekspertiz', 'Elektrik'];

export function SanayiClient() {
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Motor', address: '', city: '', phone: '' });
  const { isAuthenticated } = useSession();

  const businessesQuery = useBusinesses(category, city);
  const submit = useSubmitBusiness();

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Sanayi / İşletme Rehberi</h1>
          <Button onClick={() => setIsModalOpen(true)} disabled={!isAuthenticated}>İşletme Ekle</Button>
        </div>
        {!isAuthenticated && <p className="mt-2 text-sm text-slate-400">İşletme eklemek için giriş yapmalısın.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="rounded border border-slate-700 bg-slate-900 px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Input placeholder="Şehir" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </Card>

      <DataState
        isLoading={businessesQuery.isLoading}
        isError={businessesQuery.isError}
        isEmpty={businessesQuery.isSuccess && (businessesQuery.data?.businesses.length ?? 0) === 0}
        error={businessesQuery.error}
        loadingTitle="İşletmeler yükleniyor..."
        emptyTitle="Sonuç bulunamadı"
        emptyDescription="Filtreleri değiştirip tekrar deneyin."
        onRetry={() => businessesQuery.refetch()}
        isRetrying={businessesQuery.isRefetching}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(businessesQuery.data?.businesses ?? []).map((item) => (
            <Card key={item.id}>
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-sm text-slate-400">{item.category} · {item.city}</p>
              <p className="mt-2 text-sm">⭐ {item.avg_rating} · 📞 {item.phone || '-'}</p>
              <p className="text-xs text-slate-400">⏱ {item.open_time || '--'} - {item.close_time || '--'}</p>
            </Card>
          ))}
        </div>
      </DataState>

      {isModalOpen && (
        <Card>
          <h2 className="text-lg font-semibold">İşletme Ekle (onay bekler)</h2>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate(form, {
                onSuccess: () => {
                  setIsModalOpen(false);
                  setForm({ name: '', category: 'Motor', address: '', city: '', phone: '' });
                },
              });
            }}
          >
            <FormField id="b-name" label="İşletme adı"><Input id="b-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></FormField>
            <FormField id="b-category" label="Kategori">
              <select id="b-category" className="rounded border border-slate-700 bg-slate-900 px-3 py-2" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField id="b-address" label="Adres"><Input id="b-address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} /></FormField>
            <FormField id="b-city" label="Şehir"><Input id="b-city" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} /></FormField>
            <FormField id="b-phone" label="Telefon"><Input id="b-phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} /></FormField>
            <div className="flex gap-2">
              <Button type="submit" disabled={submit.isPending}>Gönder</Button>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Vazgeç</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
