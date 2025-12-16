'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReservationInput, reservationSchema } from '@/lib/validation';
import { SignaturePad } from './signature-pad';
import { createReservationAction } from '@/server/actions/reservations';
import { calculatePricing, getExtraOptions } from '@/lib/pricing';

export function ReservationForm({ inviteToken }: { inviteToken?: string }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(true);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      signature: '',
      selectedExtras: [],
      priceEstimate: 0,
      totalPrice: 0,
      privacyAccepted: false
    }
  });
  const extrasOptions = useMemo(() => getExtraOptions(), []);
  const guests = watch('numberOfGuests') ?? 0;
  const rawSelectedExtras = watch('selectedExtras');
  const selectedExtras = useMemo(() => {
    const value = rawSelectedExtras ?? [];
    return Array.isArray(value) ? value : [];
  }, [rawSelectedExtras]);
  const pricing = useMemo(() => calculatePricing(guests, selectedExtras), [guests, selectedExtras]);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    []
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

  useEffect(() => {
    setValue('priceEstimate', pricing.base, { shouldValidate: true, shouldDirty: true });
    setValue('totalPrice', pricing.total, { shouldValidate: true, shouldDirty: true });
  }, [pricing.base, pricing.total, setValue]);

  const onSubmit = (values: ReservationInput) => {
    if (!tokenValid) {
      setError('Einladungslink ist ungültig.');
      return;
    }
    startTransition(async () => {
      const result = await createReservationAction(values, { inviteToken });
      if (result.success) {
        setSuccess(true);
        setError(null);
      } else {
        const messages: Record<string, string> = {
          RATE_LIMITED: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
          TOKEN_INVALID: 'Der Link ist ungültig oder abgelaufen.',
          TOKEN_REQUIRED: 'Ein gültiger Einladungslink ist erforderlich.',
          VALIDATION_ERROR: 'Bitte überprüfen Sie Ihre Eingaben.'
        };
        setError(messages[result.error ?? ''] ?? 'Fehler beim Senden.');
      }
    });
  };

  useEffect(() => {
    if (!inviteToken) return;
    const validate = async () => {
      try {
        const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(inviteToken)}`);
        if (!res.ok) {
          setTokenValid(false);
          setError('Einladungslink ist ungültig oder abgelaufen.');
        } else {
          setTokenValid(true);
          setError(null);
        }
      } catch {
        setTokenValid(false);
        setError('Einladungslink ist ungültig oder abgelaufen.');
      }
    };
    validate();
  }, [inviteToken]);

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
          <input
            type="email"
            {...register('guestEmail')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.guestEmail && <p className="text-sm text-red-600">{errors.guestEmail.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Telefon</label>
          <input {...register('guestPhone')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600">
            Adresse des Gastgebers*
          </label>
          <textarea
            {...register('guestAddress')}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={2}
            placeholder="Straße, Hausnummer, PLZ und Ort"
          />
          {errors.guestAddress && (
            <p className="text-sm text-red-600">{errors.guestAddress.message}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">Datum*</label>
          <input
            type="date"
            {...register('eventDate')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Start*</label>
          <input
            type="time"
            {...register('eventStartTime')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Ende*</label>
          <input
            type="time"
            {...register('eventEndTime')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Anlass*</label>
          <input {...register('eventType')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Personenzahl*</label>
          <input
            type="number"
            min={1}
            {...register('numberOfGuests', { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
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
          <label className="block text-sm font-medium text-slate-600">
            Weitere Wünsche (werden nicht bepreist)
          </label>
          <textarea
            {...register('extras')}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand">Extras auswählen</h3>
            <p className="text-xs text-slate-500">
              Grundpreis pro Person: {formatCurrency(pricing.pricePerGuest)}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Mehrfachauswahl möglich. Beträge werden automatisch in die Gesamtsumme übernommen.
          </p>
          <div className="mt-3 space-y-3">
            {extrasOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 rounded border border-slate-200 px-3 py-2 shadow-sm"
              >
                <input
                  type="checkbox"
                  value={option.id}
                  {...register('selectedExtras')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {option.label}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      {option.mode === 'per_person'
                        ? `${formatCurrency(option.price)} pro Person`
                        : `${formatCurrency(option.price)} pauschal`}
                    </span>
                  </p>
                  {option.description && (
                    <p className="text-xs text-slate-500">{option.description}</p>
                  )}
                </div>
              </label>
            ))}
            {errors.selectedExtras && (
              <p className="text-sm text-red-600">{errors.selectedExtras.message as string}</p>
            )}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-4 shadow-inner">
          <h3 className="text-lg font-semibold text-brand">Preisübersicht</h3>
          <p className="text-xs text-slate-600">
            Automatisch aus Personenanzahl und Extras berechnet.
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>
                Grundpreis ({guests || 0} Pers. × {formatCurrency(pricing.pricePerGuest)})
              </dt>
              <dd className="font-medium">{formatCurrency(pricing.base)}</dd>
            </div>
            <div>
              <div className="flex justify-between">
                <dt>Extras</dt>
                <dd className="font-medium">{formatCurrency(pricing.extrasTotal)}</dd>
              </div>
              {pricing.extrasBreakdown.length > 0 ? (
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {pricing.extrasBreakdown.map((extra) => (
                    <li key={extra.id} className="flex justify-between">
                      <span>
                        {extra.label}
                        {extra.mode === 'per_person' ? ` (${extra.units} Pers.)` : ''}
                      </span>
                      <span>{formatCurrency(extra.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Keine Extras ausgewählt</p>
              )}
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <dt>Gesamtsumme</dt>
              <dd>{formatCurrency(pricing.total)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <input type="hidden" {...register('priceEstimate', { valueAsNumber: true })} />
      <input type="hidden" {...register('totalPrice', { valueAsNumber: true })} />

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Zuständig (Team)</label>
          <input
            {...register('internalResponsible')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Bemerkungen</label>
          <textarea
            {...register('internalNotes')}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={2}
          />
        </div>
      </section>

      <section>
        <label className="block text-sm font-medium text-slate-600">DSGVO & Einwilligung*</label>
        <div className="mt-2 flex items-start gap-3 rounded border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            {...register('privacyAccepted')}
            className="mt-1 h-4 w-4 rounded border-slate-400"
          />
          <p className="text-sm text-slate-700">
            Ich habe die Datenschutzhinweise zur Reservierungsanfrage gelesen und stimme der
            Verarbeitung meiner Daten zur Angebotserstellung zu.
          </p>
        </div>
        {errors.privacyAccepted && (
          <p className="text-sm text-red-600">{errors.privacyAccepted.message as string}</p>
        )}
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
