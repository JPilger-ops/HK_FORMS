'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/admin/requests',
        redirect: false
      });
      if (result?.error) {
        setError('Login fehlgeschlagen');
      } else {
        setSuccess('Login erfolgreich, einen Moment…');
        setTimeout(() => {
          window.location.href = '/admin/requests';
        }, 300);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600">E-Mail</label>
        <input
          name="email"
          type="email"
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600">Passwort</label>
        <input
          name="password"
          type="password"
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
      >
        {isSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
        )}
        {isSubmitting ? 'Wird geprüft…' : 'Login'}
      </button>
    </form>
  );
}
