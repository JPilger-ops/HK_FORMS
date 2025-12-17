'use client';

import { ReservationStatus } from '@prisma/client';
import {
  attachStaffSignatureAction,
  sendReservationEmailAction,
  updateReservationStatusAction
} from '@/server/actions/reservations';
import { ComponentType, FormEvent, useState, useTransition } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const statuses: ReservationStatus[] = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'CANCELLED'];

type Props = {
  reservationId: string;
  currentStatus: ReservationStatus;
  appUrl?: string;
};

export function RequestDetailActions({ reservationId, currentStatus, appUrl }: Props) {
  const SignatureCanvasAny = SignatureCanvas as unknown as ComponentType<any>;
  const [status, setStatus] = useState<ReservationStatus>(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const handleStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      await updateReservationStatusAction(reservationId, status);
      setMessage('Status gespeichert');
    });
  };

  const handleEmail = async (formData: FormData) => {
    const to = (formData.get('email') as string)
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!to?.length) return;
    const confirmationLabel = to.join(', ');
    const confirmed = window.confirm(
      `PDF wirklich an ${confirmationLabel} senden? Der Versand wird protokolliert.`
    );
    if (!confirmed) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await sendReservationEmailAction(reservationId, to);
        setMessage('E-Mail gesendet');
      } catch (error) {
        console.error(error);
        setMessage('E-Mail konnte nicht gesendet werden.');
      }
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ReservationStatus)}
          className="rounded border px-3 py-2 text-sm"
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          disabled={isPending}
          className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-60"
        >
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
        <input
          name="email"
          placeholder="mail@example.de"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button className="rounded border border-brand px-3 py-2 text-sm text-brand">Senden</button>
      </form>

      <div>
        <p className="text-sm font-medium text-slate-600">Unterschrift Mitarbeiter</p>
        <SignatureCanvasAny
          ref={(ref: any) => setSignaturePad(ref ?? null)}
          penColor="#0f172a"
          backgroundColor="#fff"
          canvasProps={{ className: 'mt-2 h-40 w-full rounded border border-slate-300 bg-white' }}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => signaturePad?.clear()}
            className="text-sm text-slate-500 underline"
          >
            Löschen
          </button>
          <button
            type="button"
            onClick={handleStaffSignature}
            className="text-sm text-brand underline"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
