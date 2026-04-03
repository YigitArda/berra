'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Skeleton } from '../../../../components/feedback/Skeleton';
import { InlineAlert } from '../../../../components/feedback/InlineAlert';
import { resolveFeedbackErrorMessage } from '../../../../components/feedback/messages';
import { useRequireAuth } from '../../../../hooks/use-require-auth';
import { useUpdateProfile, usePublicProfile } from '../../../../hooks/use-profile';

export default function EditProfilePage() {
  const { isLoading, session } = useRequireAuth();
  const username = session?.user?.username ?? '';
  const profileQuery = usePublicProfile(username, { enabled: !isLoading && !!username });
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);
  const update = useUpdateProfile();

  useEffect(() => {
    if (profileQuery.data?.user.bio != null) {
      setBio(profileQuery.data.user.bio);
    }
  }, [profileQuery.data?.user.bio]);

  if (isLoading || profileQuery.isLoading) return <Skeleton title="Profil hazırlanıyor..." lines={2} />;

  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">Profili Düzenle</h1>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          update.mutate({ bio }, { onSuccess: () => setSaved(true) });
        }}
      >
        <FormField id="bio" label="Bio">
          <textarea
            id="bio"
            rows={5}
            maxLength={300}
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSaved(false); }}
            className="rounded-md border border-slate-700 bg-slate-900 p-3 w-full"
          />
          <p className="text-right text-xs text-slate-400">{bio.length}/300</p>
        </FormField>
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </form>
      {update.isError && (
        <InlineAlert className="mt-3" variant="error" message={resolveFeedbackErrorMessage(update.error)} />
      )}
      {saved && !update.isError && (
        <InlineAlert className="mt-3" variant="success" message="Profil güncellendi." />
      )}
    </Card>
  );
}
