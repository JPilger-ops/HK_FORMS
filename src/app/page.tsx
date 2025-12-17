import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FooterLinks } from '@/components/footer-links';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const target = session?.user ? '/admin/requests' : '/admin/login';

  return (
    <>
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-8 p-8 text-center">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">
            Waldwirtschaft Heidekönig
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-brand">Reservierungsportal</h1>
          <p className="mt-4 text-lg text-slate-600">
            Zugang für autorisierte Teammitglieder. Gästeformulare sind nur über gültige
            Einladungslinks erreichbar.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Link
            href={target}
            className="rounded-full bg-brand px-8 py-3 text-white shadow transition hover:bg-brand-light"
          >
            Admin Login
          </Link>
          {session?.user && (
            <p className="text-xs text-slate-500">
              Eingeloggt als {session.user.email ?? session.user.id}
            </p>
          )}
        </div>
      </main>
      <FooterLinks />
    </>
  );
}
