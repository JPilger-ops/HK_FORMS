import { z } from 'zod';

const phoneRegex = /^[0-9+()\/\s-]{5,}$/;

export const reservationSchema = z.object({
  hostFirstName: z.string().min(2, 'Vorname erforderlich'),
  hostLastName: z.string().min(2, 'Nachname erforderlich'),
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
  eventStartTime: z.string(),
  eventEndTime: z.string().default('22:30'),
  startMeal: z.string().min(1, 'Bitte Startessen angeben'),
  numberOfGuests: z.coerce.number().min(1, 'Personenzahl erforderlich'),
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
});

export type ReservationInput = z.infer<typeof reservationSchema>;
