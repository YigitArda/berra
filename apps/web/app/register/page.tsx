'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
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

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Kayıt Ol</h1>
      <form onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))} className="grid gap-3">
        <Input placeholder="Kullanıcı adı" {...form.register('username')} />
        <Input type="email" placeholder="Email" {...form.register('email')} />
        <Input type="password" placeholder="Şifre" {...form.register('password')} />
        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Kaydediliyor...' : 'Kayıt ol'}
        </Button>
      </form>
    </Card>
  );
}
