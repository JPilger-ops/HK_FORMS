import { prisma } from '@/lib/prisma';
import { AdminShell } from '@/components/admin/shell';
import { createUserAction } from '@/server/actions/users';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.ADMIN) {
    redirect('/admin/requests');
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  async function createUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;
    await createUserAction({ email, password, role });
  }

  return (
    <AdminShell>
      <div className="grid gap-8 md:grid-cols-[1fr,1fr]">
        <div>
          <h2 className="text-xl font-semibold">Benutzer</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {users.map((user) => (
              <li key={user.id} className="rounded border p-3">
                <p className="font-medium">{user.email}</p>
                <p className="text-slate-500">{user.role}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Neuer Benutzer</h2>
          <form action={createUser} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">E-Mail</label>
              <input name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Passwort</label>
              <input name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Rolle</label>
              <select name="role" className="mt-1 w-full rounded border px-3 py-2" defaultValue={Role.STAFF}>
                <option value={Role.STAFF}>Mitarbeiter</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
            <button className="rounded bg-brand px-4 py-2 text-white">Erstellen</button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
