import Link from 'next/link';

export function FooterLinks() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/impressum" className="text-brand underline">
          Impressum
        </Link>
        <Link href="/datenschutz" className="text-brand underline">
          Datenschutz
        </Link>
        <Link href="/cookies" className="text-brand underline">
          Cookie-Richtlinie
        </Link>
      </div>
    </footer>
  );
}
