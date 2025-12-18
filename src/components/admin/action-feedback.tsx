'use client';

type Message = { type: 'success' | 'error'; text: string } | null;

export function ActionFeedback({ message }: { message: Message }) {
  if (!message) return null;
  const base =
    'mt-3 rounded border px-3 py-2 text-sm shadow-sm transition-all duration-150 ease-in-out';
  const tone =
    message.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-700';
  return <p className={`${base} ${tone}`}>{message.text}</p>;
}
