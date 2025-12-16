import { getPricePerGuest } from './config';

export type ExtraOption = {
  id: string;
  label: string;
  description?: string;
  price: number;
  mode: 'per_person' | 'flat';
};

const EXTRA_OPTIONS: ExtraOption[] = [
  {
    id: 'drinks',
    label: 'Getränkepauschale',
    description: 'Softdrinks, Bier, Wein',
    price: 18,
    mode: 'per_person'
  },
  {
    id: 'menu',
    label: '3-Gang-Menü / Buffet',
    description: 'Auswahl vor Ort abstimmbar',
    price: 32,
    mode: 'per_person'
  },
  {
    id: 'decoration',
    label: 'Dekoration & Aufbau',
    description: 'Eindeckung, Blumenschmuck, Kerzen',
    price: 180,
    mode: 'flat'
  },
  {
    id: 'tech',
    label: 'Technik (Licht/Audio)',
    description: 'Licht, Funkmikrofone, Lautsprecher',
    price: 95,
    mode: 'flat'
  },
  {
    id: 'service',
    label: 'Servicepauschale (verlängert)',
    description: 'Verlängerter Service ab 23 Uhr',
    price: 12,
    mode: 'per_person'
  }
];

export function getExtraOptions() {
  return EXTRA_OPTIONS;
}

export function calculatePricing(numberOfGuests: number, selectedExtras: string[] = []) {
  const guestCount = Number.isFinite(numberOfGuests) && numberOfGuests > 0 ? numberOfGuests : 0;
  const pricePerGuest = getPricePerGuest();
  const base = guestCount * pricePerGuest;

  const validExtras = new Set(selectedExtras);
  const extras = EXTRA_OPTIONS.filter((extra) => validExtras.has(extra.id));
  const extrasBreakdown = extras.map((extra) => {
    const units = extra.mode === 'per_person' ? guestCount : 1;
    const total = extra.price * units;
    return { ...extra, units, total };
  });
  const extrasTotal = extrasBreakdown.reduce((sum, extra) => sum + extra.total, 0);
  const total = Math.round((base + extrasTotal) * 100) / 100;

  return {
    pricePerGuest,
    base,
    extrasTotal,
    total,
    extrasBreakdown
  };
}
