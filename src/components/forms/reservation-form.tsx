'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReservationInput, reservationSchema } from '@/lib/validation';
import { SignaturePad } from './signature-pad';
import { createReservationAction } from '@/server/actions/reservations';
import { ExtraOptionInput, calculatePricing } from '@/lib/pricing';

type Props = {
  inviteToken?: string;
  extrasOptions: ExtraOptionInput[];
  enforcedEndTime?: string;
  termsText: string;
  depositSettings: { enabled: boolean; amount: number };
  pricePerGuest: number;
};

export function ReservationForm({
  inviteToken,
  extrasOptions,
  enforcedEndTime = '22:30',
  termsText,
  depositSettings,
  pricePerGuest
}: Props) {
  const earliestStart = '17:00';
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showTerms, setShowTerms] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      hostFirstName: '',
      hostLastName: '',
      hostStreet: '',
      hostPostalCode: '',
      hostCity: '',
      hostPhone: '',
      hostEmail: '',
      eventEndTime: enforcedEndTime,
      startMeal: '',
      signature: '',
      selectedExtras: [],
      priceEstimate: 0,
      totalPrice: 0,
      privacyAccepted: false,
      termsAccepted: false,
      notes: '',
      vegetarian: false,
      vegan: false,
      vegetarianCount: undefined,
      veganCount: undefined
    }
  });

  const guests = watch('numberOfGuests') ?? 0;
  const vegetarianSelected = watch('vegetarian');
  const veganSelected = watch('vegan');
  const vegetarianCount = watch('vegetarianCount');
  const veganCount = watch('veganCount');
  const rawSelectedExtras = watch('selectedExtras');
  const selectedExtras = useMemo(() => {
    const value = rawSelectedExtras ?? [];
    return Array.isArray(value) ? value : [];
  }, [rawSelectedExtras]);

  const pricing = useMemo(
    () => calculatePricing(guests, selectedExtras, extrasOptions, { pricePerGuest }),
    [extrasOptions, guests, selectedExtras, pricePerGuest]
  );
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    []
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

  useEffect(() => {
    setValue('priceEstimate', pricing.base, { shouldValidate: true, shouldDirty: true });
    setValue('totalPrice', pricing.total, { shouldValidate: true, shouldDirty: true });
    setValue('eventEndTime', enforcedEndTime, { shouldValidate: true, shouldDirty: true });
  }, [pricing.base, pricing.total, enforcedEndTime, setValue]);

  useEffect(() => {
    if (!vegetarianSelected && vegetarianCount !== undefined) {
      setValue('vegetarianCount', undefined, { shouldValidate: true, shouldDirty: true });
    }
  }, [setValue, vegetarianSelected, vegetarianCount]);

  useEffect(() => {
    if (!veganSelected && veganCount !== undefined) {
      setValue('veganCount', undefined, { shouldValidate: true, shouldDirty: true });
    }
  }, [setValue, veganSelected, veganCount]);

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
          TOKEN_REQUIRED: 'Ein gültiger Einladungslink ist erforderlich.',
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
          <label className="block text-sm font-medium text-slate-600">Vorname*</label>
          <input {...register('hostFirstName')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.hostFirstName && (
            <p className="text-sm text-red-600">{errors.hostFirstName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Nachname*</label>
          <input {...register('hostLastName')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.hostLastName && (
            <p className="text-sm text-red-600">{errors.hostLastName.message}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600">Straße + Hausnummer*</label>
          <input {...register('hostStreet')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.hostStreet && <p className="text-sm text-red-600">{errors.hostStreet.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">PLZ*</label>
          <input {...register('hostPostalCode')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.hostPostalCode && (
            <p className="text-sm text-red-600">{errors.hostPostalCode.message}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600">Ort*</label>
          <input {...register('hostCity')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.hostCity && <p className="text-sm text-red-600">{errors.hostCity.message}</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Telefon*</label>
          <input
            type="tel"
            {...register('hostPhone')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.hostPhone && <p className="text-sm text-red-600">{errors.hostPhone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">E-Mail*</label>
          <input
            type="email"
            {...register('hostEmail')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.hostEmail && <p className="text-sm text-red-600">{errors.hostEmail.message}</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">Veranstaltungsdatum*</label>
          <input
            type="date"
            {...register('eventDate')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.eventDate && <p className="text-sm text-red-600">{errors.eventDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Start Uhrzeit*</label>
          <input
            type="time"
            min={earliestStart}
            {...register('eventStartTime')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.eventStartTime && (
            <p className="text-sm text-red-600">{errors.eventStartTime.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Start Essen*</label>
          <input
            type="time"
            min={earliestStart}
            {...register('startMeal')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.startMeal && <p className="text-sm text-red-600">{errors.startMeal.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">End Uhrzeit</label>
          <input
            type="time"
            readOnly
            value={enforcedEndTime}
            className="mt-1 w-full rounded border px-3 py-2 bg-slate-100 text-slate-600"
          />
          <input type="hidden" {...register('eventEndTime')} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Anlass*</label>
          <input {...register('eventType')} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.eventType && <p className="text-sm text-red-600">{errors.eventType.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Personenzahl*</label>
          <input
            type="number"
            min={1}
            {...register('numberOfGuests', { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.numberOfGuests && (
            <p className="text-sm text-red-600">{errors.numberOfGuests.message}</p>
          )}
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-slate-50 p-4 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-brand">Vegan / Vegetarisch</h3>
          <p className="text-xs text-slate-500">Optional, ohne Preisänderung</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register('vegetarian')}
                className="mt-1 h-4 w-4 rounded border-slate-400"
              />
              <div className="flex-1">
                <p className="font-medium">Vegetarisch</p>
                <p className="text-xs text-slate-500">
                  Bitte auswählen, falls vegetarische Portionen benötigt werden.
                </p>
              </div>
            </label>
            {vegetarianSelected && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-600">
                  Anzahl vegetarischer Portionen*
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('vegetarianCount', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
                {errors.vegetarianCount && (
                  <p className="text-sm text-red-600">{errors.vegetarianCount.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register('vegan')}
                className="mt-1 h-4 w-4 rounded border-slate-400"
              />
              <div className="flex-1">
                <p className="font-medium">Vegan</p>
                <p className="text-xs text-slate-500">
                  Bitte auswählen, falls vegane Portionen benötigt werden.
                </p>
              </div>
            </label>
            {veganSelected && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-600">
                  Anzahl veganer Portionen*
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('veganCount', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
                {errors.veganCount && (
                  <p className="text-sm text-red-600">{errors.veganCount.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600">Zahlungsart*</label>
          <select {...register('paymentMethod')} className="mt-1 w-full rounded border px-3 py-2">
            <option value="">Bitte wählen</option>
            <option value="Rechnung">Rechnung</option>
            <option value="Barzahlung">Barzahlung</option>
          </select>
          {errors.paymentMethod && (
            <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Bemerkungen / Unverträglichkeiten
          </label>
          <textarea
            {...register('notes')}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={8}
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
            {extrasOptions.length === 0 && (
              <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Es sind aktuell keine Extras hinterlegt. Das Formular kann trotzdem abgesendet
                werden.
              </p>
            )}
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
                      {option.pricingType === 'PER_PERSON'
                        ? `${formatCurrency(option.priceCents / 100)} pro Person`
                        : `${formatCurrency(option.priceCents / 100)} pauschal`}
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
                        {extra.pricingType === 'PER_PERSON' ? ` (${extra.units} Pers.)` : ''}
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
            {depositSettings.enabled && (
              <div className="flex justify-between text-sm text-slate-700">
                <dt>Anzahlung</dt>
                <dd className="font-medium">{formatCurrency(depositSettings.amount)}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <input type="hidden" {...register('priceEstimate', { valueAsNumber: true })} />
      <input type="hidden" {...register('totalPrice', { valueAsNumber: true })} />

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
        <label className="block text-sm font-medium text-slate-600">
          Reservierungsbedingungen*
        </label>
        <div className="mt-2 space-y-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-700">Ich akzeptiere die Reservierungsbedingungen.</p>
            <button
              type="button"
              onClick={() => setShowTerms((prev) => !prev)}
              className="text-sm text-brand underline"
            >
              {showTerms ? 'Weniger' : 'Mehr'}
            </button>
          </div>
          {showTerms && (
            <div className="rounded border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
              <div className="whitespace-pre-line">{termsText}</div>
            </div>
          )}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              {...register('termsAccepted')}
              className="mt-1 h-4 w-4 rounded border-slate-400"
            />
            <span>Ich akzeptiere die Reservierungsbedingungen.</span>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-red-600">{errors.termsAccepted.message as string}</p>
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
