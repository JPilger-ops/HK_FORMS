import { z } from 'zod';

const phoneRegex = /^[0-9+()\/\s-]{5,}$/;
const MIN_START_MINUTES = 17 * 60;

function positiveCountField(message: string) {
  return z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      if (typeof value === 'number' && Number.isNaN(value)) return undefined;
      return value;
    },
    z.coerce.number().int().min(1, message).optional()
  );
}

function optionalTrimmedString(maxLength: number, message: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z.string().max(maxLength, message).optional()
  );
}

function timeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isAfterMinStart(value: string | null | undefined) {
  const minutes = timeToMinutes(value);
  return minutes !== null && minutes >= MIN_START_MINUTES;
}

export const reservationSchema = z.object({
  hostFirstName: z.string().min(2, 'Vorname erforderlich'),
  hostLastName: z.string().min(2, 'Nachname erforderlich'),
  hostCompany: optionalTrimmedString(120, 'Firmenname darf maximal 120 Zeichen lang sein'),
  hostStreet: z.string().min(3, 'Straße und Hausnummer erforderlich'),
  hostPostalCode: z.string().min(4, 'PLZ erforderlich'),
  hostCity: z.string().min(2, 'Ort erforderlich'),
  hostPhone: z
    .string()
    .min(5, 'Telefonnummer erforderlich')
    .regex(phoneRegex, 'Bitte eine gültige Telefonnummer angeben'),
  hostEmail: z.string().email('E-Mail erforderlich'),
  eventDate: z.string(),
  eventType: z.string().min(2, 'Bitte Anlass angeben'),
  eventStartTime: z
    .string()
    .min(1, 'Startzeit erforderlich')
    .refine(isAfterMinStart, 'Start-Uhrzeit frühestens 17:00 Uhr'),
  eventEndTime: z.string().default('22:30'),
  startMeal: z
    .string()
    .min(1, 'Bitte Startessen angeben')
    .refine(isAfterMinStart, 'Start Essen frühestens 17:00 Uhr'),
  numberOfGuests: z.coerce.number().min(1, 'Personenzahl erforderlich'),
  vegetarian: z.boolean().default(false),
  vegetarianCount: positiveCountField('Anzahl vegetarischer Portionen erforderlich'),
  vegan: z.boolean().default(false),
  veganCount: positiveCountField('Anzahl veganer Portionen erforderlich'),
  paymentMethod: z.enum(['Rechnung', 'Barzahlung'], {
    required_error: 'Zahlungsart erforderlich'
  }),
  selectedExtras: z.array(z.string()).default([]),
  notes: z.string().optional(),
  priceEstimate: z.coerce.number().min(0).optional(),
  totalPrice: z.coerce.number().min(0).optional(),
  privacyAccepted: z
    .boolean()
    .refine((value) => value === true, 'Bitte bestätigen Sie die Datenschutzhinweise.'),
  termsAccepted: z
    .boolean()
    .refine((value) => value === true, 'Bitte bestätigen Sie die Reservierungsbedingungen.'),
  signature: z.string().min(10)
}).superRefine((data, ctx) => {
  if (data.vegetarian && !data.vegetarianCount) {
    ctx.addIssue({
      code: 'custom',
      message: 'Anzahl vegetarischer Portionen erforderlich',
      path: ['vegetarianCount']
    });
  }
  if (data.vegan && !data.veganCount) {
    ctx.addIssue({
      code: 'custom',
      message: 'Anzahl veganer Portionen erforderlich',
      path: ['veganCount']
    });
  }
});

export type ReservationInput = z.infer<typeof reservationSchema>;
