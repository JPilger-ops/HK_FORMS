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
      guestName: 'Tester',
      guestEmail: 'test@example.com',
      guestPhone: '0123',
      eventDate: new Date(),
      eventType: 'Feier',
      eventStartTime: '12:00',
      eventEndTime: '14:00',
      numberOfGuests: 10,
      paymentMethod: 'Rechnung',
      extras: '',
      priceEstimate: null,
      totalPrice: null,
      internalResponsible: null,
      internalNotes: null,
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
