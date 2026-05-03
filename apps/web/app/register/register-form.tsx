'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { apiFetch, ApiError } from '../../lib/api';
import { sessionQueryKey } from '../../lib/auth/session';
import { applyBackendErrors } from '../../lib/form-errors';
import type { AuthResponse, RegisterRequest } from '../../lib/types';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı.')
    .max(40, 'Kullanıcı adı en fazla 40 karakter olabilir.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir.'),
  email: z.string().email('Geçerli bir email adresi girin.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.'),
});

const registerFields = ['username', 'email', 'password'] as const;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: z.infer<typeof registerSchema>) =>
      apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload satisfies RegisterRequest),
      }),
    onSuccess: async () => {
      setGeneralError(null);
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const nextCandidate = searchParams.get('next');
      const nextPath = nextCandidate?.startsWith('/') ? nextCandidate : '/dashboard';
      router.replace(nextPath);
      router.refresh();
    },
    onError: (error) => {
      const message = applyBackendErrors(error, form.setError, registerFields);
      const normalized = message.toLowerCase();
      const status = error instanceof ApiError ? error.status : null;

      if (normalized.includes('network') || normalized.includes('fetch')) {
        setGeneralError('Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.');
        return;
      }

      if (
        normalized.includes('zaten kayıtlı') ||
        normalized.includes('already') ||
        normalized.includes('conflict') ||
        status === 409
      ) {
        setGeneralError('Bu email veya kullanıcı adı zaten kayıtlı. Giriş yapmayı deneyin.');
        return;
      }

      setGeneralError(
        message || 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.',
      );
    },
  });

  const usernameError = form.formState.errors.username?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Kayıt Ol</h1>
      <form
        onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
        className="grid gap-4"
        aria-busy={registerMutation.isPending}
      >
        {generalError && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {generalError}
          </p>
        )}
        <FormField
          id="username"
          label="Kullanıcı adı"
          helperText="Profilinizde görünecek ad."
          errorText={usernameError}
        >
          <Input
            placeholder="araba_user"
            error={Boolean(usernameError)}
            {...form.register('username')}
          />
        </FormField>

        <FormField
          id="email"
          label="Email"
          helperText="Giriş yapmak için kullanacaksınız."
          errorText={emailError}
        >
          <Input
            type="email"
            placeholder="ornek@araba.app"
            error={Boolean(emailError)}
            {...form.register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label="Şifre"
          helperText="En az 8 karakter."
          errorText={passwordError}
        >
          <Input
            type="password"
            placeholder="••••••••"
            error={Boolean(passwordError)}
            {...form.register('password')}
          />
        </FormField>

        <Button
          type="submit"
          disabled={registerMutation.isPending}
          aria-busy={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Kaydediliyor...' : 'Kayıt ol'}
        </Button>
      </form>
      {registerMutation.isSuccess && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
          Kayıt başarılı, yönlendiriliyorsunuz...
        </p>
      )}
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Zaten hesabınız var mı?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Giriş yapın
        </Link>
      </p>
    </Card>
  );
}
