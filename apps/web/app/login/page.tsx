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

const loginFields = ['email', 'password'] as const;

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
      apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload satisfies LoginRequest),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const nextPath = searchParams.get('next') ?? '/dashboard';
      router.replace(nextPath);
      router.refresh();
    },
  });

  const isSubmitting = loginMutation.isPending;

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Giriş</h1>
      {generalError && (
        <div className="mb-4 rounded-md border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200">{generalError}</div>
      )}
      <form
        onSubmit={form.handleSubmit((values) => {
          setGeneralError(null);
          form.clearErrors();
          loginMutation.mutate(values);
        })}
        className="grid gap-3"
      >
        <div>
          <Input type="email" placeholder="Email" disabled={isSubmitting} {...form.register('email')} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-red-300">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Input type="password" placeholder="Şifre" disabled={isSubmitting} {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </Button>
      </form>
      {loginMutation.isSuccess && <p className="mt-2 text-sm text-emerald-400">Giriş başarılı, yönlendiriliyorsunuz...</p>}
    </Card>
  );
}
