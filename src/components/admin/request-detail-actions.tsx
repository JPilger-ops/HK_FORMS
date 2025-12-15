'use client';

import { ReservationStatus } from '@prisma/client';
import {
  attachStaffSignatureAction,
  sendReservationEmailAction,
  updateReservationStatusAction
} from '@/server/actions/reservations';
import { issueInviteLink, sendInviteLinkEmailAction } from '@/server/actions/invite';
import { FormEvent, useState, useTransition } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const statuses: ReservationStatus[] = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'CANCELLED'];

type Props = {
  reservationId: string;
  currentStatus: ReservationStatus;
  appUrl?: string;
  defaultInviteHours?: number;
};

export function RequestDetailActions({ reservationId, currentStatus, appUrl, defaultInviteHours = 48 }: Props) {
  const [status, setStatus] = useState<ReservationStatus>(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteRecipient, setInviteRecipient] = useState('');
  const [inviteHours, setInviteHours] = useState(defaultInviteHours);
  const [isPending, startTransition] = useTransition();
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const getInviteHours = () => Math.max(1, inviteHours || defaultInviteHours);

  const handleStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      await updateReservationStatusAction(reservationId, status);
      setMessage('Status gespeichert');
    });
  };

  const handleEmail = async (formData: FormData) => {
    const to = (formData.get('email') as string)?.split(',').map((v) => v.trim()).filter(Boolean);
    if (!to?.length) return;
    startTransition(async () => {
      await sendReservationEmailAction(reservationId, to);
      setMessage('E-Mail gesendet');
    });
  };

  const handleInvite = () => {
    startTransition(async () => {
      const hours = getInviteHours();
      setInviteHours(hours);
      const token = await issueInviteLink(reservationId, hours);
      const base = appUrl ?? window.location.origin;
      setInviteLink(`${base}/request?token=${token}`);
      setMessage('Link erstellt');
    });
  };

  const handleInviteEmail = () => {
    if (!inviteRecipient) return;
    startTransition(async () => {
      const hours = getInviteHours();
      setInviteHours(hours);
      const result = await sendInviteLinkEmailAction({
        reservationId,
        recipient: inviteRecipient,
        expiresInHours: hours,
        appUrl
      });
      setInviteLink(result.link);
      setMessage('Link per E-Mail versendet');
    });
  };

  const handleStaffSignature = () => {
    const data = signaturePad?.toDataURL('image/png');
    if (!data) return;
    startTransition(async () => {
      await attachStaffSignatureAction(reservationId, data);
      setMessage('Mitarbeiter-Unterschrift gespeichert');
    });
  };

  return (
    <div className="space-y-6">
      {message && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      <form onSubmit={handleStatus} className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="text-sm font-medium text-slate-600">Status aktualisieren</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus)} className="rounded border px-3 py-2 text-sm">
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button disabled={isPending} className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-60">
          Speichern
        </button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          handleEmail(formData);
        }}
        className="flex flex-col gap-3 md:flex-row md:items-center"
      >
        <label className="text-sm font-medium text-slate-600">PDF senden an</label>
        <input name="email" placeholder="mail@example.de" className="flex-1 rounded border px-3 py-2 text-sm" />
        <button className="rounded border border-brand px-3 py-2 text-sm text-brand">Senden</button>
      </form>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <button
            type="button"
            onClick={handleInvite}
            className="rounded border border-dashed border-brand px-3 py-2 text-sm text-brand"
          >
            Formular-Link generieren
          </button>
          <input
            type="number"
            min={1}
            className="w-28 rounded border px-2 py-1 text-sm"
            value={inviteHours}
            onChange={(e) => setInviteHours(Number(e.target.value) || defaultInviteHours)}
            aria-label="Gültigkeit in Stunden"
          />
          <span className="text-xs text-slate-500">Gültigkeit (h)</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            type="email"
            placeholder="Gast-E-Mail"
            value={inviteRecipient}
            onChange={(e) => setInviteRecipient(e.target.value)}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleInviteEmail}
            className="rounded border border-brand px-3 py-2 text-sm text-brand"
          >
            Link senden
          </button>
        </div>
        {inviteLink && (
          <code className="block rounded bg-slate-100 p-2 text-xs">{inviteLink}</code>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600">Unterschrift Mitarbeiter</p>
        <SignatureCanvas
          ref={(ref) => setSignaturePad(ref ?? null)}
          penColor="#0f172a"
          backgroundColor="#fff"
          canvasProps={{ className: 'mt-2 h-40 w-full rounded border border-slate-300 bg-white' }}
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => signaturePad?.clear()} className="text-sm text-slate-500 underline">
            Löschen
          </button>
          <button type="button" onClick={handleStaffSignature} className="text-sm text-brand underline">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
