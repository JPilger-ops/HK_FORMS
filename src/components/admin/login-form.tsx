'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/admin/requests',
      redirect: false
    });
    if (result?.error) {
      setError('Login fehlgeschlagen');
    } else {
      window.location.href = '/admin/requests';
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600">E-Mail</label>
        <input name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600">Passwort</label>
        <input name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded bg-brand px-4 py-2 font-semibold text-white">
        Login
      </button>
    </form>
  );
}
