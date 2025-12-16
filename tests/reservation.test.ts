import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReservationAction } from '@/server/actions/reservations';

const mockReservation = {
  id: 'res_123',
  guestName: 'Test Gast',
  guestEmail: 'gast@example.com',
  guestPhone: '0123',
  guestAddress: 'Teststraße 1, 12345 Musterstadt',
  eventDate: new Date(),
  eventType: 'Geburtstag',
  eventStartTime: '18:00',
  eventEndTime: '23:00',
  numberOfGuests: 10,
  paymentMethod: 'Rechnung',
  extrasSelection: '[]',
  priceEstimate: null,
  totalPrice: null,
  internalResponsible: null,
  internalNotes: null,
  privacyAcceptedAt: new Date(),
  signatures: []
};

vi.mock('@/lib/prisma', () => {
  const reservationStore: any = {};
  const prisma = {
    reservationRequest: {
      create: vi.fn(async ({ data }: any) => {
        reservationStore[data.id ?? 'latest'] = { ...mockReservation, ...data };
        return { ...mockReservation, ...data };
      }),
      findUnique: vi.fn(async () => ({ ...mockReservation, signatures: [] }))
    },
    signature: {
      create: vi.fn(async () => ({}))
    },
    emailLog: {
      create: vi.fn(async () => ({}))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };
  // @ts-expect-error test mock
  prisma.$transaction = async (cb: any) => cb(prisma);
  return { prisma };
});

vi.mock('@/lib/pdf', () => ({
  reservationToPdf: vi.fn(async () => Buffer.from('pdf'))
}));

vi.mock('@/lib/email', () => ({
  sendReservationMail: vi.fn(async () => ({}))
}));

vi.mock('@/lib/tokens', () => ({
  consumeInviteTokenForReservation: vi.fn(async () => ({ id: 'token' }))
}));

describe('createReservationAction', () => {
  beforeEach(() => {
    process.env.ADMIN_NOTIFICATION_EMAILS = 'admin@example.com';
    process.env.SEND_GUEST_CONFIRMATION = 'false';
    process.env.INVITE_REQUIRE_TOKEN = 'true';
  });

  it('creates reservation and returns id', async () => {
    const result = await createReservationAction(
      {
        guestName: 'Test Gast',
        guestEmail: 'gast@example.com',
        guestPhone: '0123',
        guestAddress: 'Teststraße 1, 12345 Musterstadt',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '23:00',
        numberOfGuests: 20,
        paymentMethod: 'Rechnung',
        selectedExtras: ['drinks'],
        extras: 'Musik',
        privacyAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    expect(result.success).toBe(true);
    expect(result.reservationId).toBeDefined();
  });
});
