import { describe, it, expect } from 'vitest';
import { daysBetween, formatDate } from '@/utils/format';

describe('format utils', () => {
  it('computes days between two dates', () => {
    expect(daysBetween('2026-06-01T00:00:00Z', '2026-06-11T00:00:00Z')).toBe(10);
  });

  it('returns null when a date is missing', () => {
    expect(daysBetween(undefined, '2026-06-11T00:00:00Z')).toBeNull();
    expect(daysBetween('2026-06-11T00:00:00Z', undefined)).toBeNull();
  });

  it('formats a date and dashes for empty input', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2026-06-20T00:00:00Z')).toMatch(/2026/);
  });
});
