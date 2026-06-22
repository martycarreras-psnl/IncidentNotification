import { describe, it, expect } from 'vitest';
import { createMockDataProvider } from '@/services/mock-data-provider';

describe('mock data provider', () => {
  it('lists seeded incidents', async () => {
    const provider = createMockDataProvider();
    const incidents = await provider.incidents.list();
    expect(incidents.length).toBeGreaterThan(0);
    expect(incidents[0].narrative).toBeTruthy();
  });

  it('filters incidents by severity', async () => {
    const provider = createMockDataProvider();
    const all = await provider.incidents.list();
    const sev3 = await provider.incidents.list({ severity: 3 });
    expect(sev3.every((i) => i.severityLevel === 3)).toBe(true);
    expect(sev3.length).toBeLessThanOrEqual(all.length);
  });

  it('filters incidents by investigation status', async () => {
    const provider = createMockDataProvider();
    const closed = await provider.incidents.list({ investigationStatus: 7 });
    expect(closed.every((i) => i.investigationStatus === 7)).toBe(true);
  });

  it('searches narrative text case-insensitively', async () => {
    const provider = createMockDataProvider();
    const results = await provider.incidents.list({ search: 'INSULIN' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((i) => i.narrative.toLowerCase().includes('insulin'))).toBe(true);
  });

  it('returns specialty tags for an incident', async () => {
    const provider = createMockDataProvider();
    const tags = await provider.specialtyTags.listByIncident('inc-1');
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.some((t) => t.role === 1)).toBe(true); // has a primary
  });

  it('adds an activity and reads it back', async () => {
    const provider = createMockDataProvider();
    await provider.activities.add({ incidentId: 'inc-1', title: 'Test note', activityType: 1, note: 'hello' });
    const list = await provider.activities.listByIncident('inc-1');
    expect(list.some((a) => a.title === 'Test note')).toBe(true);
  });

  it('saves a new incident with a generated id', async () => {
    const provider = createMockDataProvider();
    const created = await provider.incidents.save({ narrative: 'brand new', investigationStatus: 1 });
    expect(created.id).toBeTruthy();
    const fetched = await provider.incidents.getById(created.id);
    expect(fetched?.narrative).toBe('brand new');
  });

  it('lists the seeded specialties', async () => {
    const provider = createMockDataProvider();
    const specialties = await provider.specialties.list();
    expect(specialties.length).toBeGreaterThan(0);
  });
});
