import type { Incident } from '@/types/domain-models';

export type IncidentSortKey =
  | 'title'
  | 'severity'
  | 'status'
  | 'escalation'
  | 'mandatory'
  | 'event'
  | 'created';
export type SortDir = 'asc' | 'desc';

function ts(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Numeric key for the mandatory-report deadline (Infinity when not reportable). */
export function mandatoryDeadline(i: Incident): number {
  if (!i.extReportRequired || !i.extReportClockHrs || !i.eventDateTime) return Infinity;
  return new Date(i.eventDateTime).getTime() + i.extReportClockHrs * 3600_000;
}

/** Stable field comparator (ascending). The caller negates for descending. */
export function compareIncidents(a: Incident, b: Incident, key: IncidentSortKey): number {
  switch (key) {
    case 'title':
      return (a.title || a.narrative || '').localeCompare(b.title || b.narrative || '');
    case 'severity':
      return (a.severityLevel ?? 0) - (b.severityLevel ?? 0);
    case 'status':
      return a.investigationStatus - b.investigationStatus;
    case 'escalation':
      return (a.escalationPath ?? 0) - (b.escalationPath ?? 0);
    case 'mandatory':
      return mandatoryDeadline(a) - mandatoryDeadline(b);
    case 'event':
      return ts(a.eventDateTime) - ts(b.eventDateTime);
    case 'created':
    default:
      // Fall back to event date when createdOn is absent (mock data / drafts).
      return (ts(a.createdOn) || ts(a.eventDateTime)) - (ts(b.createdOn) || ts(b.eventDateTime));
  }
}

/** Returns a new sorted array of incidents by key + direction. */
export function sortIncidents(list: Incident[], key: IncidentSortKey, dir: SortDir): Incident[] {
  return [...list].sort((a, b) => {
    const cmp = compareIncidents(a, b, key);
    return dir === 'asc' ? cmp : -cmp;
  });
}
