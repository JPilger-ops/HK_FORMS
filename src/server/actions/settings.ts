'use server';

import { assertPermission } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';
import {
  LegalPageKey,
  emailTemplateDefaults,
  getSetting,
  setSetting
} from '@/lib/settings';

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

const legalPaths: Record<LegalPageKey, string> = {
  impressum: '/impressum',
  datenschutz: '/datenschutz',
  cookies: '/cookies'
};

export async function updateLegalContentAction(page: LegalPageKey, value: string) {
  await assertPermission('manage:settings');
  await setSetting(`legal_${page}`, value ?? '');
  revalidatePath('/admin/settings/rechtliches');
  revalidatePath(legalPaths[page]);
}

export async function updateSmtpSettingsAction({
  host,
  port,
  user,
  pass,
  from,
  secure
}: {
  host: string;
  port: number;
  user: string;
  pass?: string;
  from: string;
  secure: boolean;
}) {
  await assertPermission('manage:settings');
  const currentPass = (await getSetting('smtp_pass')) ?? process.env.SMTP_PASS ?? '';
  const nextPass = pass && pass.trim().length > 0 ? pass.trim() : currentPass;
  const normalizedPort = Number.isFinite(port) && port > 0 ? port : 587;
  const cleanHost = host?.trim() ?? '';
  const cleanUser = user?.trim() ?? '';
  const cleanFrom = from?.trim() ?? '';

  await setSetting('smtp_host', cleanHost);
  await setSetting('smtp_port', String(normalizedPort));
  await setSetting('smtp_user', cleanUser);
  await setSetting('smtp_from', cleanFrom || cleanUser);
  await setSetting('smtp_secure', secure ? 'true' : 'false');
  if (nextPass) {
    await setSetting('smtp_pass', nextPass);
  }

  revalidatePath('/admin/settings/email');
}

export async function updateEmailTemplateAction({
  subject,
  body
}: {
  subject: string;
  body: string;
}) {
  await assertPermission('manage:settings');
  const defaults = emailTemplateDefaults;
  await setSetting('email_tpl_guest_subject', subject ?? defaults.subject);
  await setSetting('email_tpl_guest_body', body ?? defaults.body);
  revalidatePath('/admin/settings/email');
}
