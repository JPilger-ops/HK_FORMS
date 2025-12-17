'use server';

import { assertPermission } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';
import { getDepositSettings, setSetting } from '@/lib/settings';

export async function updateReservationTermsAction(value: string) {
  await assertPermission('manage:settings');
  await setSetting('reservation_terms', value ?? '');
  revalidatePath('/admin/settings/bedingungen');
  revalidatePath('/request');
}

export async function updateDepositSettingsAction({
  enabled,
  amount
}: {
  enabled: boolean;
  amount: number;
}) {
  await assertPermission('manage:settings');
  await setSetting('deposit_enabled', enabled ? 'true' : 'false');
  await setSetting('deposit_amount', String(amount));
  revalidatePath('/admin/settings/deposit');
  revalidatePath('/request');
}
