'use server';

import { assertPermission } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';
import { setSetting } from '@/lib/settings';

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

export async function updateDataOwnerAction(value: string) {
  await assertPermission('manage:settings');
  await setSetting('legal_data_owner', value ?? '');
  revalidatePath('/admin/settings/rechtliches');
  revalidatePath('/datenschutz');
  revalidatePath('/impressum');
  revalidatePath('/cookies');
}

export async function updateLegalTextAction(
  key: 'privacy' | 'cookies' | 'imprint',
  value: string
) {
  await assertPermission('manage:settings');
  const settingKey =
    key === 'privacy' ? 'legal_privacy' : key === 'cookies' ? 'legal_cookies' : 'legal_imprint';
  await setSetting(settingKey, value ?? '');
  revalidatePath('/admin/settings/rechtliches');
  revalidatePath('/datenschutz');
  revalidatePath('/impressum');
  revalidatePath('/cookies');
}
