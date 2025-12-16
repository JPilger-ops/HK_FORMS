import { z } from 'zod';

export const reservationSchema = z.object({
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  guestAddress: z.string().min(5, 'Adresse erforderlich'),
  eventDate: z.string(),
  eventType: z.string().min(2),
  eventStartTime: z.string(),
  eventEndTime: z.string(),
  numberOfGuests: z.coerce.number().min(1),
  paymentMethod: z.string().min(2),
  selectedExtras: z.array(z.string()).default([]),
  extras: z.string().optional(),
  priceEstimate: z.coerce.number().min(0).optional(),
  totalPrice: z.coerce.number().min(0).optional(),
  internalResponsible: z.string().optional(),
  internalNotes: z.string().optional(),
  privacyAccepted: z
    .boolean()
    .refine((value) => value === true, 'Bitte bestätigen Sie die Datenschutzhinweise.'),
  signature: z.string().min(10)
});

export type ReservationInput = z.infer<typeof reservationSchema>;
