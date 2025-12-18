'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReservationStatus } from '@prisma/client';
import { useMemo, useState, useTransition } from 'react';
import { deleteReservationRequestsAction } from '@/server/actions/reservations';
import { StatusBadge } from '@/components/admin/status-badge';
import { ActionFeedback } from '@/components/admin/action-feedback';
import { dangerButtonClasses, subtleButtonClasses } from '@/app/admin/(secure)/settings/styles';

type Message = { type: 'success' | 'error'; text: string } | null;

type RequestRow = {
  id: string;
  guestName: string;
  eventDate: string;
  numberOfGuests: number;
  status: ReservationStatus;
};

export function RequestsTable({ requests, canEdit }: { requests: RequestRow[]; canEdit: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }),
    []
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === requests.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(requests.map((req) => req.id)));
  };

  const anySelected = selected.size > 0;

  const handleDelete = () => {
    if (!anySelected) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        const { deleted } = await deleteReservationRequestsAction(ids);
        setMessage({
          type: 'success',
          text: deleted === 1 ? 'Anfrage gelöscht' : `${deleted} Anfragen gelöscht`
        });
        setSelected(new Set());
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Löschen fehlgeschlagen' });
      }
    });
  };

  return (
    <div>
      <ActionFeedback message={message} />
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              {canEdit && (
                <th className="p-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={selected.size > 0 && selected.size === requests.length}
                      onChange={toggleAll}
                    />
                    <span className="hidden text-[11px] font-semibold text-slate-600 sm:inline">
                      Alle
                    </span>
                  </label>
                </th>
              )}
              <th className="p-2">Name</th>
              <th className="p-2">Datum</th>
              <th className="p-2">Personen</th>
              <th className="p-2">Status</th>
              <th className="p-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t">
                {canEdit && (
                  <td className="p-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={selected.has(req.id)}
                      onChange={() => toggleSelect(req.id)}
                    />
                  </td>
                )}
                <td className="p-2">{req.guestName}</td>
                <td className="p-2">{dateFormatter.format(new Date(req.eventDate))}</td>
                <td className="p-2">{req.numberOfGuests}</td>
                <td className="p-2">
                  <StatusBadge status={req.status} />
                </td>
                <td className="p-2">
                  <Link href={`/admin/requests/${req.id}`} className={subtleButtonClasses}>
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Keine Anfragen gefunden.</p>
      )}

      {canEdit && requests.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {selected.size > 0 ? `${selected.size} markiert` : 'Keine Auswahl'}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!anySelected || isPending}
            className={`${dangerButtonClasses} px-4 disabled:opacity-60`}
          >
            {isPending ? 'Lösche…' : `Auswahl löschen${anySelected ? ` (${selected.size})` : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
