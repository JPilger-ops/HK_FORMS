import { ReservationStatus } from '@prisma/client';

const colors: Record<ReservationStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800'
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>{status}</span>;
}
