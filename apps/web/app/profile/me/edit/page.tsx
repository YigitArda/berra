'use client';

import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Skeleton } from '../../../../components/feedback/Skeleton';
import { useRequireAuth } from '../../../../hooks/use-require-auth';
import { useUpdateProfile } from '../../../../hooks/use-profile';

export default function EditProfilePage() {
  const { isLoading } = useRequireAuth();
  const [bio, setBio] = useState('');
  const update = useUpdateProfile();

  if (isLoading) return <Skeleton title="Profil hazırlanıyor..." lines={2} />;

  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">Profili Düzenle</h1>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ bio });
        }}
      >
        <FormField id="bio" label="Bio">
          <textarea
            id="bio"
            rows={5}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 p-3"
          />
        </FormField>
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </form>
    </Card>
  );
}
