import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createReservationAction } from '@/server/actions/reservations';
import { prisma } from '@/lib/prisma';
import { consumeInviteTokenForReservation } from '@/lib/tokens';

const mockReservation = {
  id: 'res_123',
  hostFirstName: 'Test',
  hostLastName: 'Gast',
  hostStreet: 'Teststraße 1',
  hostPostalCode: '12345',
  hostCity: 'Musterstadt',
  hostPhone: '01234',
  hostEmail: 'gast@example.com',
  guestName: 'Test Gast',
  guestEmail: 'gast@example.com',
  guestPhone: '01234',
  guestAddress: 'Teststraße 1, 12345 Musterstadt',
  eventDate: new Date(),
  eventType: 'Geburtstag',
  eventStartTime: '18:00',
  eventEndTime: '23:00',
  startMeal: '19:00',
  numberOfGuests: 10,
  paymentMethod: 'Rechnung',
  extrasSelection: '[]',
  extrasSnapshot: [],
  priceEstimate: null,
  totalPrice: null,
  internalResponsible: null,
  internalNotes: null,
  privacyAcceptedAt: new Date(),
  termsAcceptedAt: new Date(),
  termsSnapshot: 'Bedingungen',
  signatures: []
};

vi.mock('@/lib/prisma', () => {
  const reservationStore: any = {};
  const prisma = {
    extraOption: {
      findMany: vi.fn(async () => [
        {
          id: 'drinks',
          label: 'Getränke',
          description: null,
          pricingType: 'PER_PERSON',
          priceCents: 600
        }
      ])
    },
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
    vi.clearAllMocks();
  });

  it('creates reservation and returns id', async () => {
    const result = await createReservationAction(
      {
        hostFirstName: 'Test',
        hostLastName: 'Gast',
        hostStreet: 'Teststraße 1',
        hostPostalCode: '12345',
        hostCity: 'Musterstadt',
        hostPhone: '01234',
        hostEmail: 'gast@example.com',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '23:00',
        startMeal: '19:00',
        numberOfGuests: 20,
        paymentMethod: 'Rechnung',
        selectedExtras: ['drinks'],
        notes: 'Musik',
        privacyAccepted: true,
        termsAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    expect(result.success).toBe(true);
    expect(result.reservationId).toBeDefined();
  });

  it('forces end time to 22:30', async () => {
    await createReservationAction(
      {
        hostFirstName: 'Test',
        hostLastName: 'Gast',
        hostStreet: 'Teststraße 1',
        hostPostalCode: '12345',
        hostCity: 'Musterstadt',
        hostPhone: '01234',
        hostEmail: 'gast@example.com',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '20:00',
        startMeal: '19:00',
        numberOfGuests: 10,
        paymentMethod: 'Rechnung',
        selectedExtras: [],
        notes: '',
        privacyAccepted: true,
        termsAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    const lastCall = (prisma as any).reservationRequest.create.mock.calls.at(-1)?.[0];
    expect(lastCall?.data?.eventEndTime).toBe('22:30');
  });

  it('stores selected extras including snapshot', async () => {
    await createReservationAction(
      {
        hostFirstName: 'Test',
        hostLastName: 'Gast',
        hostStreet: 'Teststraße 1',
        hostPostalCode: '12345',
        hostCity: 'Musterstadt',
        hostPhone: '01234',
        hostEmail: 'gast@example.com',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '20:00',
        startMeal: '19:00',
        numberOfGuests: 10,
        paymentMethod: 'Rechnung',
        selectedExtras: ['drinks'],
        notes: '',
        privacyAccepted: true,
        termsAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    const lastCall = (prisma as any).reservationRequest.create.mock.calls.at(-1)?.[0]?.data;
    expect(lastCall?.extrasSelection).toEqual(JSON.stringify(['drinks']));
    expect(lastCall?.extrasSnapshot).toEqual([
      {
        id: 'drinks',
        label: 'Getränke',
        description: null,
        pricingType: 'PER_PERSON',
        priceCents: 600
      }
    ]);
  });

  it('rejects invalid tokens', async () => {
    const consumeMock = consumeInviteTokenForReservation as unknown as Mock;
    consumeMock.mockImplementationOnce(() => {
      throw new Error('TOKEN_INVALID');
    });
    const result = await createReservationAction(
      {
        hostFirstName: 'Test',
        hostLastName: 'Gast',
        hostStreet: 'Teststraße 1',
        hostPostalCode: '12345',
        hostCity: 'Musterstadt',
        hostPhone: '01234',
        hostEmail: 'gast@example.com',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '20:00',
        startMeal: '19:00',
        numberOfGuests: 10,
        paymentMethod: 'Rechnung',
        selectedExtras: [],
        notes: '',
        privacyAccepted: true,
        termsAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('TOKEN_INVALID');
  });

  it('rejects unsupported payment methods', async () => {
    const result = await createReservationAction(
      {
        hostFirstName: 'Test',
        hostLastName: 'Gast',
        hostStreet: 'Teststraße 1',
        hostPostalCode: '12345',
        hostCity: 'Musterstadt',
        hostPhone: '01234',
        hostEmail: 'gast@example.com',
        eventDate: '2024-12-24',
        eventType: 'Feier',
        eventStartTime: '18:00',
        eventEndTime: '20:00',
        numberOfGuests: 10,
        paymentMethod: 'Kreditkarte',
        selectedExtras: [],
        notes: '',
        privacyAccepted: true,
        signature: 'data:image/png;base64,ZmFrZQ=='
      },
      { inviteToken: 'token-abc' }
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('VALIDATION_ERROR');
  });
});
