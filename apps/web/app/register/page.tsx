import { Suspense } from 'react';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-4 text-center">Yükleniyor...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
