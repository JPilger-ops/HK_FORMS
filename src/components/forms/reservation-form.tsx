'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReservationInput, reservationSchema } from '@/lib/validation';
import { SignaturePad } from './signature-pad';
import { createReservationAction } from '@/server/actions/reservations';

export function ReservationForm({ inviteToken }: { inviteToken?: string }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      signature: ''
    }
  });

  const onSubmit = (values: ReservationInput) => {
    startTransition(async () => {
      const result = await createReservationAction(values, { inviteToken });
      if (result.success) {
        setSuccess(true);
        setError(null);
      } else {
        const messages: Record<string, string> = {
          RATE_LIMITED: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          TOKEN_INVALID: 'Der Link ist ungültig oder abgelaufen.',
          VALIDATION_ERROR: 'Bitte überprüfen Sie Ihre Eingaben.'
        };
        setError(messages[result.error ?? ''] ?? 'Fehler beim Senden.');
      }
    });
  };

  if (success) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <h2 className="text-xl font-semibold">Vielen Dank!</h2>
        <p>Ihre Anfrage wurde übermittelt. Wir melden uns zeitnah.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('signature')} />
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Gastgeber*</label>
          <input {...register('guestName')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.guestName && <p className="text-sm text-red-600">{errors.guestName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">E-Mail*</label>
          <input type="email" {...register('guestEmail')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.guestEmail && <p className="text-sm text-red-600">{errors.guestEmail.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Telefon</label>
          <input {...register('guestPhone')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">Datum*</label>
          <input type="date" {...register('eventDate')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Start*</label>
          <input type="time" {...register('eventStartTime')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Ende*</label>
          <input type="time" {...register('eventEndTime')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Anlass*</label>
          <input {...register('eventType')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Personenzahl*</label>
          <input type="number" min={1} {...register('numberOfGuests', { valueAsNumber: true })} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Zahlungsart*</label>
          <select {...register('paymentMethod')} className="mt-1 w-full rounded border px-3 py-2">
            <option value="">Bitte wählen</option>
            <option>Rechnung</option>
            <option>Barzahlung</option>
            <option>Kreditkarte</option>
          </select>
          {errors.paymentMethod && (
            <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Extras / Wünsche</label>
          <textarea {...register('extras')} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Preis Einschätzung (€)</label>
          <input
            type="number"
            step="0.01"
            {...register('priceEstimate', { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Gesamtbetrag (€)</label>
          <input
            type="number"
            step="0.01"
            {...register('totalPrice', { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Zuständig (Team)</label>
          <input {...register('internalResponsible')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Bemerkungen</label>
          <textarea {...register('internalNotes')} className="mt-1 w-full rounded border px-3 py-2" rows={2} />
        </div>
      </section>

      <section>
        <label className="block text-sm font-medium text-slate-600">Digitale Unterschrift*</label>
        <SignaturePad
          onChange={(value) => {
            setValue('signature', value, { shouldValidate: true, shouldDirty: true });
          }}
        />
        {errors.signature && <p className="text-sm text-red-600">Bitte unterschreiben.</p>}
      </section>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {isPending ? 'Wird gesendet…' : 'Anfrage senden'}
      </button>
    </form>
  );
}
