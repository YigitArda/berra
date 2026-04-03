'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { sessionQueryKey } from '../../lib/auth/session';
import { loginSchema } from './schema';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: z.infer<typeof loginSchema>) =>
      apiFetch<{ message?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const nextPath = searchParams.get('next') ?? '/dashboard';
      router.replace(nextPath);
      router.refresh();
    },
  });

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Giriş</h1>
      <form onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))} className="grid gap-3">
        <Input type="email" placeholder="Email" {...form.register('email')} />
        <Input type="password" placeholder="Şifre" {...form.register('password')} />
        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Gönderiliyor...' : 'Giriş yap'}
        </Button>
      </form>
      {loginMutation.isError && <p className="mt-2 text-sm text-red-400">{(loginMutation.error as Error).message}</p>}
      {loginMutation.isSuccess && <p className="mt-2 text-sm text-emerald-400">Giriş başarılı.</p>}
    </Card>
  );
}
