'use client';

import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
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

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Giriş</h1>
      <form onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))} className="grid gap-4">
        <FormField id="email" label="Email" helperText="Hesabınızda kayıtlı email adresi." errorText={emailError}>
          <Input
            id="email"
            type="email"
            placeholder="ornek@berra.app"
            error={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : 'email-hint'}
            {...form.register('email')}
          />
        </FormField>

        <FormField id="password" label="Şifre" helperText="En az 6 karakter girin." errorText={passwordError}>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : 'password-hint'}
            {...form.register('password')}
          />
        </FormField>

        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Gönderiliyor...' : 'Giriş yap'}
        </Button>
      </form>
      {loginMutation.isSuccess && <p className="mt-2 text-sm text-emerald-400">Giriş başarılı, yönlendiriliyorsunuz...</p>}
    </Card>
  );
}
