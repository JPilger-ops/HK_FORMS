import { FooterLinks } from '@/components/footer-links';

export function InvalidRequestNotice() {
  return (
    <>
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold text-brand">
            Dieser Code ist ungültig oder abgelaufen.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Bitte wenden Sie sich an Waldwirtschaft Heidekönig, um einen neuen Einladungslink zu
            erhalten.
          </p>
        </div>
      </main>
      <FooterLinks />
    </>
  );
}
