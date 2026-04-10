'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { AuthResponse, LoginRequest } from '../../lib/types';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { apiFetch, ApiError } from '../../lib/api';
import { sessionQueryKey } from '../../lib/auth/session';
import { applyBackendErrors } from '../../lib/form-errors';
import { loginSchema } from './schema';

const loginFields = ['email', 'password'] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);

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
    onMutate: () => {
      setGeneralError(null);
    },
    onSuccess: async () => {
      setGeneralError(null);
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const nextCandidate = searchParams.get('next');
      const nextPath = nextCandidate?.startsWith('/') ? nextCandidate : '/dashboard';
      router.replace(nextPath);
      router.refresh();
    },
    onError: (error) => {
      const message = applyBackendErrors(error, form.setError, loginFields);
      const normalized = message.toLowerCase();
      const status = error instanceof ApiError ? error.status : null;
      
      if (normalized.includes('network') || normalized.includes('fetch')) {
        setGeneralError('Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.');
        return;
      }
      
      if (normalized.includes('hatalı') || normalized.includes('invalid') || status === 401) {
        setGeneralError('Email veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
        return;
      }
      
      if (normalized.includes('askıya') || normalized.includes('banned') || normalized.includes('suspend')) {
        setGeneralError('Hesabınız askıya alınmış. Destek ile iletişime geçin.');
        return;
      }
      
      setGeneralError(message || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
    },
  });

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Giriş</h1>
      <form
        onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
        className="grid gap-4"
        aria-busy={loginMutation.isPending}
      >
        {generalError && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {generalError}
          </p>
        )}
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

        <FormField id="password" label="Şifre" helperText="En az 6 karakter." errorText={passwordError}>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : 'password-hint'}
            {...form.register('password')}
          />
        </FormField>

        <Button type="submit" disabled={loginMutation.isPending} aria-busy={loginMutation.isPending}>
          {loginMutation.isPending ? 'Gönderiliyor...' : 'Giriş yap'}
        </Button>
      </form>
      {loginMutation.isSuccess && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Giriş başarılı, yönlendiriliyorsunuz...</p>}
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Hesabınız yok mu?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
          Kayıt olun
        </Link>
      </p>
    </Card>
  );
}
