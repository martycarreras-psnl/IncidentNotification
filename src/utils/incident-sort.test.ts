import { describe, it, expect } from 'vitest';
import { sortIncidents, mandatoryDeadline } from '@/utils/incident-sort';
import type { Incident } from '@/types/domain-models';

function inc(partial: Partial<Incident>): Incident {
  return {
    id: partial.id ?? crypto.randomUUID(),
    narrative: partial.narrative ?? 'n',
    investigationStatus: partial.investigationStatus ?? 1,
    ...partial,
  } as Incident;
}

const a = inc({ id: 'a', title: 'Alpha', severityLevel: 2, investigationStatus: 1, escalationPath: 1, eventDateTime: '2026-06-01T00:00:00Z', createdOn: '2026-06-01T01:00:00Z' });
const b = inc({ id: 'b', title: 'Bravo', severityLevel: 5, investigationStatus: 7, escalationPath: 3, eventDateTime: '2026-06-10T00:00:00Z', createdOn: '2026-06-10T01:00:00Z' });
const c = inc({ id: 'c', title: 'Charlie', severityLevel: 3, investigationStatus: 4, escalationPath: 2, eventDateTime: '2026-05-20T00:00:00Z', createdOn: '2026-05-20T01:00:00Z' });

const all = [a, b, c];

describe('incident sort', () => {
  it('defaults to most recently created first (created desc)', () => {
    const sorted = sortIncidents(all, 'created', 'desc');
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts created ascending', () => {
    const sorted = sortIncidents(all, 'created', 'asc');
    expect(sorted.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts by severity descending', () => {
    const sorted = sortIncidents(all, 'severity', 'desc');
    expect(sorted.map((i) => i.severityLevel)).toEqual([5, 3, 2]);
  });

  it('sorts by status ascending', () => {
    const sorted = sortIncidents(all, 'status', 'asc');
    expect(sorted.map((i) => i.investigationStatus)).toEqual([1, 4, 7]);
  });

  it('sorts by escalation descending', () => {
    const sorted = sortIncidents(all, 'escalation', 'desc');
    expect(sorted.map((i) => i.escalationPath)).toEqual([3, 2, 1]);
  });

  it('sorts by title ascending', () => {
    const sorted = sortIncidents(all, 'title', 'asc');
    expect(sorted.map((i) => i.title)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('sorts by event date', () => {
    const sorted = sortIncidents(all, 'event', 'desc');
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not mutate the input array', () => {
    const copy = [...all];
    sortIncidents(all, 'severity', 'asc');
    expect(all).toEqual(copy);
  });

  it('treats non-reportable incidents as Infinity deadline', () => {
    expect(mandatoryDeadline(a)).toBe(Infinity);
    const reportable = inc({ extReportRequired: true, extReportClockHrs: 24, eventDateTime: '2026-06-01T00:00:00Z' });
    expect(mandatoryDeadline(reportable)).toBe(new Date('2026-06-02T00:00:00Z').getTime());
  });

  it('sorts reportable incidents before non-reportable on the mandatory key (asc)', () => {
    const reportable = inc({ id: 'r', extReportRequired: true, extReportClockHrs: 24, eventDateTime: '2026-06-01T00:00:00Z' });
    const sorted = sortIncidents([a, reportable], 'mandatory', 'asc');
    expect(sorted[0].id).toBe('r');
  });
});
