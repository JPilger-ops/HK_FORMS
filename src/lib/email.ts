import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { getPublicFormBaseUrl } from './auth';
import { getSmtpSettings } from './settings';

type TransporterWithFrom = {
  transporter: nodemailer.Transporter;
  from: string;
};

export async function getTransporter(): Promise<TransporterWithFrom> {
  const settings = await getSmtpSettings();
  const host = settings.host;
  const port = settings.port ?? 587;
  const user = settings.user;
  const pass = settings.pass;
  const from = settings.from ?? user ?? '';
  const secure = settings.secure ?? port === 465;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP configuration missing');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return { transporter, from };
}

export async function sendReservationMail({
  reservationId,
  to,
  subject,
  html,
  attachments
}: {
  reservationId: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const { transporter, from } = await getTransporter();
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments
    });
    await prisma.emailLog.create({
      data: {
        reservationId,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        status: 'SENT'
      }
    });
  } catch (error: any) {
    await prisma.emailLog.create({
      data: {
        reservationId,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        status: 'FAILED',
        error: error?.message
      }
    });
    throw error;
  }
}

export async function sendInviteEmail({
  inviteId,
  to,
  token,
  formKey = 'gesellschaften',
  appUrl
}: {
  inviteId: string;
  to: string;
  token: string;
  formKey?: string;
  appUrl?: string;
}) {
  const { transporter, from } = await getTransporter();
  const base = (appUrl || getPublicFormBaseUrl()).replace(/\/$/, '');
  const link = `${base}/request?token=${encodeURIComponent(token)}&form=${encodeURIComponent(formKey)}`;
  const html = `<p>Bitte füllen Sie Ihre Reservierungsanfrage aus.</p><p><a href="${link}" style="padding:10px 14px;background:#39523a;color:white;border-radius:6px;text-decoration:none;">Formular öffnen</a></p><p>Alternativ: ${link}</p>`;
  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Heidekönig – Reservierungsanfrage',
      html
    });
    await prisma.emailLog.create({
      data: {
        inviteLinkId: inviteId,
        to,
        subject: 'Heidekönig – Reservierungsanfrage',
        status: 'SENT'
      }
    });
  } catch (error: any) {
    await prisma.emailLog.create({
      data: {
        inviteLinkId: inviteId,
        to,
        subject: 'Heidekönig – Reservierungsanfrage',
        status: 'FAILED',
        error: error?.message
      }
    });
    throw error;
  }
}
