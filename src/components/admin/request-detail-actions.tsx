'use client';

import { ReservationStatus } from '@prisma/client';
import { sendReservationEmailAction, updateReservationStatusAction } from '@/server/actions/reservations';
import { FormEvent, useState, useTransition } from 'react';
import { ActionFeedback } from '@/components/admin/action-feedback';

const statuses: ReservationStatus[] = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'CANCELLED'];

type Props = {
  reservationId: string;
  currentStatus: ReservationStatus;
};

export function RequestDetailActions({ reservationId, currentStatus }: Props) {
  const [status, setStatus] = useState<ReservationStatus>(currentStatus);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await updateReservationStatusAction(reservationId, status);
        setMessage({ type: 'success', text: 'Status gespeichert' });
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Status konnte nicht gespeichert werden.' });
      }
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
        setMessage({ type: 'success', text: 'E-Mail gesendet' });
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'E-Mail konnte nicht gesendet werden.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <ActionFeedback message={message} />

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
    </div>
  );
}
