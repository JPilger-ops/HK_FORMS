import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { getBaseUrl } from './auth';

export async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
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
  const transporter = await getTransporter();
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
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
  const transporter = await getTransporter();
  const base = (appUrl || getBaseUrl()).replace(/\/$/, '');
  const link = `${base}/request?token=${encodeURIComponent(token)}&form=${encodeURIComponent(formKey)}`;
  const html = `<p>Bitte füllen Sie Ihre Reservierungsanfrage aus.</p><p><a href="${link}" style="padding:10px 14px;background:#39523a;color:white;border-radius:6px;text-decoration:none;">Formular öffnen</a></p><p>Alternativ: ${link}</p>`;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
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
