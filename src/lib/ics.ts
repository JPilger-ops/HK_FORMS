import { ReservationRequest } from '@prisma/client';
import { ExtraSnapshot, parseExtrasSnapshot } from './pricing';
import { renderTemplate } from './templates';

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
  pricePerGuest,
  notesTemplate,
  summaryPrefix = 'Gesellschaft'
}: {
  reservation: ReservationRequest;
  extras: ExtraSnapshot[] | null;
  pricePerGuest?: number;
  notesTemplate: string;
  summaryPrefix?: string;
}) {
  const extrasList = extras ?? parseExtrasSnapshot(reservation.extrasSnapshot);
  const start = formatDateTimeLocal(reservation.eventDate, reservation.eventStartTime);
  const end = formatDateTimeLocal(reservation.eventDate, reservation.eventEndTime);
  const now = formatDateTimeLocal(new Date());
  const eventDateLabel = new Intl.DateTimeFormat('de-DE').format(reservation.eventDate);
  const summary = `${summaryPrefix} ${reservation.guestName}`;
  const formattedPrice =
    typeof pricePerGuest === 'number'
      ? pricePerGuest.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : undefined;

  const noteVariables = {
    guestName: reservation.guestName,
    guestEmail: reservation.guestEmail ?? '',
    guestPhone: reservation.guestPhone ?? '',
    guestAddress: reservation.guestAddress ?? '',
    eventDate: eventDateLabel,
    eventStart: reservation.eventStartTime,
    eventEnd: reservation.eventEndTime,
    guests: String(reservation.numberOfGuests),
    startMeal: reservation.startMeal ?? '',
    paymentMethod: reservation.paymentMethod,
    pricePerGuest: formattedPrice ? `${formattedPrice} €` : '',
    extrasList: formatExtras(extrasList),
    notes: reservation.extras ?? '',
    reservationId: reservation.id
  };

  const noteLines = renderTemplate(notesTemplate, noteVariables);

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
