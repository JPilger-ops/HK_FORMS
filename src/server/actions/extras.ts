'use server';

import { assertPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { ExtraPricingType } from '@prisma/client';

type ExtraInput = {
  label: string;
  description?: string | null;
  pricingType: ExtraPricingType;
  priceCents: number;
  isActive?: boolean;
};

function toPriceCents(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric));
}

async function nextSortOrder() {
  const { _max } = await prisma.extraOption.aggregate({ _max: { sortOrder: true } });
  return (_max.sortOrder ?? 0) + 1;
}

export async function createExtraOptionAction(input: ExtraInput) {
  await assertPermission('manage:settings');
  const sortOrder = await nextSortOrder();
  return prisma.extraOption.create({
    data: {
      label: input.label.trim(),
      description: input.description?.trim() || null,
      pricingType: input.pricingType,
      priceCents: toPriceCents(input.priceCents),
      isActive: input.isActive ?? true,
      sortOrder
    }
  });
}

export async function updateExtraOptionAction(id: string, input: ExtraInput) {
  await assertPermission('manage:settings');
  return prisma.extraOption.update({
    where: { id },
    data: {
      label: input.label.trim(),
      description: input.description?.trim() || null,
      pricingType: input.pricingType,
      priceCents: toPriceCents(input.priceCents),
      isActive: input.isActive ?? true
    }
  });
}

export async function deleteExtraOptionAction(id: string) {
  await assertPermission('manage:settings');
  await prisma.extraOption.delete({ where: { id } });
}

export async function moveExtraOptionAction(id: string, direction: 'up' | 'down') {
  await assertPermission('manage:settings');
  const extras = await prisma.extraOption.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
  const index = extras.findIndex((extra) => extra.id === id);
  if (index === -1) return;
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= extras.length) return;
  const current = extras[index];
  const target = extras[swapIndex];
  await prisma.$transaction([
    prisma.extraOption.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
    prisma.extraOption.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } })
  ]);
}
