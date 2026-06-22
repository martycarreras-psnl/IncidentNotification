/** Formatting helpers for the UI. */

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "3 days ago" / "in 2 hours" relative formatting. */
export function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const day = 86400_000;
  const hour = 3600_000;
  const min = 60_000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (abs >= day) return rtf.format(Math.round(diff / day), 'day');
  if (abs >= hour) return rtf.format(Math.round(diff / hour), 'hour');
  return rtf.format(Math.round(diff / min), 'minute');
}

/** Days between two ISO dates (b - a), or null if either missing. */
export function daysBetween(aIso?: string, bIso?: string): number | null {
  if (!aIso || !bIso) return null;
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (b - a) / 86400_000;
}
