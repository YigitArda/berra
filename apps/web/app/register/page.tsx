'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';

const registerSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı.'),
  email: z.string().email('Geçerli bir email girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
});

export default function RegisterPage() {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: z.infer<typeof registerSchema>) =>
      apiFetch<{ message?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  const usernameError = form.formState.errors.username?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Kayıt Ol</h1>
      <form onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))} className="grid gap-4">
        <FormField id="username" label="Kullanıcı adı" helperText="Profilinizde görünecek ad." errorText={usernameError}>
          <Input
            id="username"
            placeholder="berra_user"
            error={Boolean(usernameError)}
            aria-describedby={usernameError ? 'username-error' : 'username-hint'}
            {...form.register('username')}
          />
        </FormField>

        <FormField id="email" label="Email" helperText="Giriş yapmak için kullanacaksınız." errorText={emailError}>
          <Input
            id="email"
            type="email"
            placeholder="ornek@berra.app"
            error={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : 'email-hint'}
            {...form.register('email')}
          />
        </FormField>

        <FormField id="password" label="Şifre" helperText="Güçlü bir şifre seçin." errorText={passwordError}>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : 'password-hint'}
            {...form.register('password')}
          />
        </FormField>

        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Kaydediliyor...' : 'Kayıt ol'}
        </Button>
      </form>
    </Card>
  );
}
