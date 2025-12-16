import { chromium } from 'playwright';
import { ReservationRequest, Signature } from '@prisma/client';
import { calculatePricing, getExtraOptions } from './pricing';

function buildHtml(reservation: ReservationRequest & { signatures: Signature[] }) {
  const hostSignature = reservation.signatures.find((s) => s.type === 'HOST');
  const staffSignature = reservation.signatures.find((s) => s.type === 'STAFF');
  const signatureImg = (sig?: Signature) =>
    sig
      ? `<img src="data:image/png;base64,${Buffer.from(sig.imageData).toString('base64')}" style="width:200px">`
      : '<em>keine</em>';

  const formatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'full' });
  const priceFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const price = (value?: any) =>
    value || value === 0 ? priceFormatter.format(Number(value ?? 0)) : '-';

  const allowedExtras = new Map(getExtraOptions().map((extra) => [extra.id, extra]));
  let selectedExtras: string[] = [];
  if (reservation.extrasSelection) {
    try {
      const parsed = JSON.parse(reservation.extrasSelection);
      if (Array.isArray(parsed)) {
        selectedExtras = parsed.filter((item) => allowedExtras.has(item));
      }
    } catch {
      selectedExtras = [];
    }
  }
  const pricing = calculatePricing(reservation.numberOfGuests, selectedExtras);
  const basePrice = reservation.priceEstimate ? Number(reservation.priceEstimate) : pricing.base;
  const totalPrice = reservation.totalPrice ? Number(reservation.totalPrice) : pricing.total;
  const extrasTotal = pricing.extrasTotal || Math.max(0, totalPrice - basePrice);
  const extrasList =
    pricing.extrasBreakdown.length > 0
      ? `<ul style="margin:4px 0 0 16px;padding:0;">${pricing.extrasBreakdown
          .map(
            (extra) =>
              `<li>${extra.label}${
                extra.mode === 'per_person' ? ` (${extra.units} Pers.)` : ''
              }: ${price(extra.total)}</li>`
          )
          .join('')}</ul>`
      : '<em>Keine</em>';

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Inter', Arial, sans-serif; padding: 32px; color: #111827; }
      h1 { color: #2f4f2f; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      td, th { border: 1px solid #d1d5db; padding: 8px; font-size: 14px; }
      .section { margin-bottom: 24px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Waldwirtschaft Heidekönig</h1>
      <p>Reservierungs-ID: ${reservation.id}</p>
      <p>Erstellt am: ${formatter.format(reservation.createdAt)}</p>
    </header>

    <div class="section">
      <h2>Kontakt</h2>
      <table>
        <tr><th>Gastgeber</th><td>${reservation.guestName}</td></tr>
        <tr><th>E-Mail</th><td>${reservation.guestEmail}</td></tr>
        <tr><th>Adresse</th><td>${reservation.guestAddress ?? '-'}</td></tr>
        <tr><th>Telefon</th><td>${reservation.guestPhone ?? '-'}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Anlass</h2>
      <table>
        <tr><th>Anlass</th><td>${reservation.eventType}</td></tr>
        <tr><th>Datum</th><td>${formatter.format(reservation.eventDate)}</td></tr>
        <tr><th>Zeiten</th><td>${reservation.eventStartTime} - ${reservation.eventEndTime}</td></tr>
        <tr><th>Personenzahl</th><td>${reservation.numberOfGuests}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Leistungen & Preise</h2>
      <table>
        <tr><th>Zahlungsart</th><td>${reservation.paymentMethod}</td></tr>
        <tr><th>Extras (Auswahl)</th><td>${extrasList}</td></tr>
        <tr><th>Preis pro Person</th><td>${price(pricing.pricePerGuest)}</td></tr>
        <tr><th>Grundpreis</th><td>${price(basePrice)}</td></tr>
        <tr><th>Extras Summe</th><td>${price(extrasTotal)}</td></tr>
        <tr><th>Total</th><td>${price(totalPrice)}</td></tr>
        <tr><th>Wünsche (Text)</th><td>${reservation.extras ?? '-'}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Interne Informationen</h2>
      <table>
        <tr><th>Zuständig</th><td>${reservation.internalResponsible ?? '-'}</td></tr>
        <tr><th>Status</th><td>${reservation.status}</td></tr>
        <tr><th>Notizen</th><td>${reservation.internalNotes ?? '-'}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Unterschriften</h2>
      <table>
        <tr><th>Gast</th><td>${signatureImg(hostSignature)}</td></tr>
        <tr><th>Mitarbeiter</th><td>${signatureImg(staffSignature)}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Datenschutz</h2>
      <p>
        ${
          reservation.privacyAcceptedAt
            ? `Einwilligung erteilt am ${reservation.privacyAcceptedAt.toLocaleString('de-DE')}`
            : 'Keine Einwilligung hinterlegt (Bestandseintrag oder manuelle Erfassung).'
        }
      </p>
    </div>

    <footer>
      <p>Bankverbindung: Waldwirtschaft Heidekönig · IBAN DE00 0000 0000 0000 0000 00 · BIC ABCDDEFFXXX</p>
    </footer>
  </body>
  </html>`;
}

export async function reservationToPdf(
  reservation: ReservationRequest & { signatures: Signature[] }
) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(buildHtml(reservation), { waitUntil: 'networkidle' });
  const buffer = await page.pdf({
    format: 'A4',
    margin: { top: '24mm', left: '16mm', right: '16mm', bottom: '16mm' },
    displayHeaderFooter: false
  });
  await browser.close();
  return buffer;
}
