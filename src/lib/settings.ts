import { prisma } from './prisma';

export async function getSetting(key: string) {
  const entry = await prisma.setting.findUnique({ where: { key } });
  return entry?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export async function getReservationTerms() {
  return (
    (await getSetting('reservation_terms')) ??
    'Bitte bestätigen Sie, dass Sie die Reservierungsbedingungen gelesen haben.'
  );
}

function parseBoolean(value: string | null, fallback: boolean) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getDepositSettings() {
  const enabled = parseBoolean(await getSetting('deposit_enabled'), true);
  const amount = parseNumber(await getSetting('deposit_amount'), 300);
  return { enabled, amount };
}
