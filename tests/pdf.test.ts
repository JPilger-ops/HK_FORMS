import { describe, it, expect, vi } from 'vitest';
import { reservationToPdf } from '@/lib/pdf';
import { ReservationStatus, SignatureType } from '@prisma/client';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(async () => ({
      newPage: async () => ({
        setContent: vi.fn(async () => ({})),
        pdf: vi.fn(async () => Buffer.from('PDF'))
      }),
      close: vi.fn(async () => ({}))
    }))
  }
}));

describe('reservationToPdf', () => {
  it('returns a Buffer', async () => {
    const buffer = await reservationToPdf({
      id: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: ReservationStatus.NEW,
      hostFirstName: 'Tester',
      hostLastName: 'Mustermann',
      hostStreet: 'Straße 1',
      hostPostalCode: '12345',
      hostCity: 'Stadt',
      hostPhone: '01234',
      hostEmail: 'test@example.com',
      guestName: 'Tester',
      guestEmail: 'test@example.com',
      guestPhone: '01234',
      guestAddress: 'Straße 1, 12345 Stadt',
      eventDate: new Date(),
      eventType: 'Feier',
      eventStartTime: '12:00',
      eventEndTime: '14:00',
      numberOfGuests: 10,
      paymentMethod: 'Rechnung',
      extrasSelection: '["drinks"]',
      extrasSnapshot: [
        {
          id: 'drinks',
          label: 'Getränke',
          description: null,
          pricingType: 'PER_PERSON',
          priceCents: 600
        }
      ],
      extras: '',
      priceEstimate: null,
      totalPrice: null,
      internalResponsible: null,
      internalNotes: null,
      privacyAcceptedAt: new Date(),
      assignedToId: null,
      signatures: [
        {
          id: 'sig',
          reservationId: '1',
          type: SignatureType.HOST,
          imageData: Buffer.from('fake'),
          createdAt: new Date()
        }
      ]
    });
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});
