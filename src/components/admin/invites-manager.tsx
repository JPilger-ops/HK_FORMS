'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAndSendInviteAction,
  deleteInvitesAction,
  resendInviteAction,
  revokeInviteAction
} from '@/server/actions/admin-invites';

type Invite = {
  id: string;
  recipientEmail: string | null;
  formKey: string;
  useCount: number;
  maxUses: number;
  expiresAt: string | null;
  note: string | null;
  isRevoked: boolean;
  createdAt: string;
};

type Message = { type: 'success' | 'error'; text: string } | null;

export function InvitesManager({
  invites,
  defaultDays
}: {
  invites: Invite[];
  defaultDays: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState({
    recipientEmail: '',
    formKey: 'gesellschaften',
    expiresInDays: defaultDays.toString(),
    maxUses: '1',
    note: ''
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusLabel = (invite: Invite) => {
    const now = new Date();
    if (invite.isRevoked) return 'widerrufen';
    if (invite.expiresAt && new Date(invite.expiresAt) < now) return 'abgelaufen';
    if (invite.useCount >= invite.maxUses) return 'verbraucht';
    return 'aktiv';
  };

  const anySelected = selected.size > 0;

  const handleBulkDelete = () => {
    if (!anySelected) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        await deleteInvitesAction(ids);
        setMessage({ type: 'success', text: `${ids.length} Einladungen widerrufen` });
        setSelected(new Set());
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Widerrufen fehlgeschlagen' });
      }
    });
  };

  const handleResend = (id: string) => {
    startTransition(async () => {
      try {
        await resendInviteAction(id);
        setMessage({ type: 'success', text: 'Einladung erneut gesendet' });
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Senden fehlgeschlagen' });
      }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      try {
        await revokeInviteAction(id);
        setMessage({ type: 'success', text: 'Einladung widerrufen' });
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Widerruf fehlgeschlagen' });
      }
    });
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await createAndSendInviteAction({
          recipientEmail: formState.recipientEmail,
          formKey: formState.formKey,
          expiresInDays: Number(formState.expiresInDays),
          note: formState.note,
          maxUses: Number(formState.maxUses)
        });
        setMessage({ type: 'success', text: 'Einladung gesendet' });
        setFormState((prev) => ({ ...prev, recipientEmail: '', note: '' }));
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Versand fehlgeschlagen' });
      }
    });
  };

  const isLoading = isPending;

  return (
    <div className="grid gap-8 md:grid-cols-[1.5fr,1fr]">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Einladungen</h2>
            <p className="text-sm text-slate-500">Neueste 50 Einladungen</p>
          </div>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={!anySelected || isLoading}
            className="rounded border border-red-200 px-3 py-2 text-xs text-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Lösche…' : 'Auswahl löschen'}
          </button>
        </div>
        {message && (
          <p
            className={`mt-3 rounded p-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded border p-3 text-sm">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  checked={selected.has(invite.id)}
                  onChange={() => toggleSelect(invite.id)}
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{invite.recipientEmail ?? 'Ohne Empfänger'}</p>
                      <p className="text-slate-500">
                        {invite.formKey} · {invite.useCount}/{invite.maxUses} ·{' '}
                        {invite.expiresAt
                          ? `bis ${new Date(invite.expiresAt).toLocaleDateString('de-DE')}`
                          : 'ohne Ablauf'}
                      </p>
                      {invite.note && (
                        <p className="text-xs text-slate-500">Notiz: {invite.note}</p>
                      )}
                    </div>
                    <span className="text-xs uppercase text-slate-600">{statusLabel(invite)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleResend(invite.id)}
                      disabled={isLoading}
                      className="text-brand underline disabled:opacity-50"
                    >
                      Neu senden
                    </button>
                    {!invite.isRevoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(invite.id)}
                        disabled={isLoading}
                        className="text-red-600 underline disabled:opacity-50"
                      >
                        Widerrufen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {invites.length === 0 && (
            <p className="text-sm text-slate-500">Noch keine Einladungen.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Einladung senden</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-3 text-sm">
          <div>
            <label className="block text-slate-600">Empfänger E-Mail</label>
            <input
              name="recipientEmail"
              type="email"
              required
              value={formState.recipientEmail}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, recipientEmail: e.target.value }))
              }
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-600">Formular-Key</label>
            <input
              name="formKey"
              value={formState.formKey}
              onChange={(e) => setFormState((prev) => ({ ...prev, formKey: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600">Ablauf (Tage)</label>
              <input
                name="expiresInDays"
                type="number"
                min={1}
                value={formState.expiresInDays}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, expiresInDays: e.target.value }))
                }
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600">Max. Nutzungen</label>
              <input
                name="maxUses"
                type="number"
                min={1}
                value={formState.maxUses}
                onChange={(e) => setFormState((prev) => ({ ...prev, maxUses: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600">Notiz</label>
            <textarea
              name="note"
              value={formState.note}
              onChange={(e) => setFormState((prev) => ({ ...prev, note: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            )}
            {isLoading ? 'Sende…' : 'Einladung senden'}
          </button>
        </form>
      </div>
    </div>
  );
}
