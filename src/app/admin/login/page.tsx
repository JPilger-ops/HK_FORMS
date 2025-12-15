import { LoginForm } from '@/components/admin/login-form';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/admin/requests');
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-brand">Admin Login</h1>
        <p className="mb-4 text-sm text-slate-500">Nur autorisierte Mitarbeiter.</p>
        <LoginForm />
      </div>
    </main>
  );
}
