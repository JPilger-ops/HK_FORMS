import { getPricePerGuest } from './config';

export type ExtraOptionInput = {
  id: string;
  label: string;
  description?: string | null;
  pricingType: 'PER_PERSON' | 'FLAT';
  priceCents: number;
};

export type ExtraSnapshot = ExtraOptionInput;

export type PricingBreakdown = {
  id: string;
  label: string;
  description?: string | null;
  pricingType: 'PER_PERSON' | 'FLAT';
  units: number;
  priceCents: number;
  totalCents: number;
  price: number;
  total: number;
};

export type PricingResult = {
  pricePerGuestCents: number;
  pricePerGuest: number;
  baseCents: number;
  base: number;
  extrasTotalCents: number;
  extrasTotal: number;
  totalCents: number;
  total: number;
  extrasBreakdown: PricingBreakdown[];
};

function toCents(value: number) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric * 100));
}

function toAmount(cents: number) {
  if (!Number.isFinite(cents)) return 0;
  return Math.round(cents) / 100;
}

function normalizeGuests(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function buildExtrasSnapshot(
  selectedExtras: string[] = [],
  extrasOptions: ExtraOptionInput[] = []
): ExtraSnapshot[] {
  const selection = new Set(selectedExtras.filter(Boolean));
  return extrasOptions
    .filter((extra) => selection.has(extra.id))
    .map((extra) => ({
      id: extra.id,
      label: extra.label,
      description: extra.description ?? null,
      pricingType: extra.pricingType,
      priceCents: extra.priceCents
    }));
}

export function parseExtrasSnapshot(value: unknown): ExtraSnapshot[] {
  const parse = (raw: any): ExtraSnapshot | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id = 'id' in raw ? String((raw as any).id) : null;
    const label = 'label' in raw ? String((raw as any).label) : null;
    const pricingType = (raw as any).pricingType;
    const priceCentsRaw = (raw as any).priceCents;
    if (!id || !label || (pricingType !== 'PER_PERSON' && pricingType !== 'FLAT')) return null;
    const priceCents = Number.isFinite(priceCentsRaw) ? Number(priceCentsRaw) : toCents(0);
    return {
      id,
      label,
      description: (raw as any).description ?? null,
      pricingType,
      priceCents
    };
  };

  if (Array.isArray(value)) {
    return value.map(parse).filter(Boolean) as ExtraSnapshot[];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(parse).filter(Boolean) as ExtraSnapshot[];
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function calculatePricing(
  numberOfGuests: number,
  selectedExtras: string[] = [],
  extrasOptions: ExtraOptionInput[] = [],
  options?: { pricePerGuest?: number }
): PricingResult {
  const guestCount = normalizeGuests(numberOfGuests);
  const pricePerGuest = options?.pricePerGuest ?? getPricePerGuest();
  const pricePerGuestCents = toCents(pricePerGuest);
  const baseCents = guestCount * pricePerGuestCents;

  const selection = new Set(selectedExtras.filter(Boolean));
  const extras = extrasOptions.filter((extra) => selection.has(extra.id));
  const extrasBreakdown = extras.map<PricingBreakdown>((extra) => {
    const units = extra.pricingType === 'PER_PERSON' ? guestCount : 1;
    const totalCents = units * extra.priceCents;
    return {
      ...extra,
      units,
      totalCents,
      price: toAmount(extra.priceCents),
      total: toAmount(totalCents)
    };
  });
  const extrasTotalCents = extrasBreakdown.reduce((sum, extra) => sum + extra.totalCents, 0);
  const totalCents = baseCents + extrasTotalCents;

  return {
    pricePerGuestCents,
    pricePerGuest: toAmount(pricePerGuestCents),
    baseCents,
    base: toAmount(baseCents),
    extrasTotalCents,
    extrasTotal: toAmount(extrasTotalCents),
    totalCents,
    total: toAmount(totalCents),
    extrasBreakdown
  };
}
