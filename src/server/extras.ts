import { prisma } from '@/lib/prisma';
import { ExtraOptionInput } from '@/lib/pricing';

export function mapExtraToInput(extra: {
  id: string;
  label: string;
  description: string | null;
  pricingType: 'PER_PERSON' | 'FLAT';
  priceCents: number;
}) {
  return {
    id: extra.id,
    label: extra.label,
    description: extra.description,
    pricingType: extra.pricingType,
    priceCents: extra.priceCents
  } satisfies ExtraOptionInput;
}

export async function listActiveExtraOptions(): Promise<ExtraOptionInput[]> {
  const extras = await prisma.extraOption.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
  return extras.map(mapExtraToInput);
}

export async function listAllExtraOptions() {
  return prisma.extraOption.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
}
