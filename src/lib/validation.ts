import { z } from 'zod';

export const reservationSchema = z.object({
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  eventDate: z.string(),
  eventType: z.string().min(2),
  eventStartTime: z.string(),
  eventEndTime: z.string(),
  numberOfGuests: z.coerce.number().min(1),
  paymentMethod: z.string().min(2),
  extras: z.string().optional(),
  priceEstimate: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  internalResponsible: z.string().optional(),
  internalNotes: z.string().optional(),
  signature: z.string().min(10)
});

export type ReservationInput = z.infer<typeof reservationSchema>;
