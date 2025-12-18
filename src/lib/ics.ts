import { ReservationRequest } from '@prisma/client';
import { ExtraSnapshot, parseExtrasSnapshot } from './pricing';

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function formatDateTimeLocal(date: Date, time?: string | null) {
  const hours = time ? Number(time.split(':')[0] ?? 0) : 0;
  const minutes = time ? Number(time.split(':')[1] ?? 0) : 0;
  const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${y}${m}${d}T${hh}${mm}00`;
}

function escape(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatExtras(extras: ExtraSnapshot[]) {
  if (!extras.length) return 'Keine Extras';
  return extras
    .map((extra) => `${extra.label}${extra.pricingType === 'PER_PERSON' ? ' (pro Person)' : ''}`)
    .join('; ');
}

export function reservationToIcs({
  reservation,
  extras,
  pricePerGuest
}: {
  reservation: ReservationRequest;
  extras: ExtraSnapshot[] | null;
  pricePerGuest?: number;
}) {
  const extrasList = extras ?? parseExtrasSnapshot(reservation.extrasSnapshot);
  const start = formatDateTimeLocal(reservation.eventDate, reservation.eventStartTime);
  const end = formatDateTimeLocal(reservation.eventDate, reservation.eventEndTime);
  const now = formatDateTimeLocal(new Date());
  const eventDateLabel = new Intl.DateTimeFormat('de-DE').format(reservation.eventDate);
  const summary = `Reservierung ${reservation.guestName}`;
  const formattedPrice =
    typeof pricePerGuest === 'number'
      ? pricePerGuest.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : undefined;

  const noteLines = [
    `Gast: ${reservation.guestName} (${reservation.guestEmail})`,
    `Telefon: ${reservation.guestPhone ?? '-'}`,
    `Adresse: ${reservation.guestAddress ?? '-'}`,
    `Datum: ${eventDateLabel} ${reservation.eventStartTime} - ${reservation.eventEndTime}`,
    `Personen: ${reservation.numberOfGuests}`,
    `Zahlungsart: ${reservation.paymentMethod}`,
    `Start Essen: ${reservation.startMeal ?? '-'}`,
    formattedPrice ? `Preis p. P.: ${formattedPrice} €` : null,
    `Extras: ${formatExtras(extrasList)}`,
    `Bemerkungen: ${reservation.extras ?? '-'}`,
    `Anfrage-ID: ${reservation.id}`
  ]
    .filter(Boolean)
    .join('\n');

  const location = reservation.guestAddress ?? '';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HKForms//Reservation//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reservation.id}@hkforms`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Berlin:${start}`,
    `DTEND;TZID=Europe/Berlin:${end}`,
    `SUMMARY:${escape(summary)}`,
    location ? `LOCATION:${escape(location)}` : null,
    `DESCRIPTION:${escape(noteLines)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');

  return Buffer.from(ics, 'utf-8');
}
