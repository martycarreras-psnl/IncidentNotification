// Mock data provider for prototype/test mode (VITE_USE_MOCK=true). Kept for tests (D8).
import type { AppDataProvider } from '@/services/data-contracts';
import type {
  Incident,
  IncidentAudit,
  IncidentSpecialtyTag,
  InvestigationActivity,
  RecordShare,
  RemediationAction,
} from '@/types/domain-models';
import {
  mockIncidents,
  mockSpecialties,
  mockTags,
  mockDetails,
  mockActivities,
  mockRemediations,
  mockUsers,
} from '@/mockData/incidents';

function clone<T>(record: T): T {
  return JSON.parse(JSON.stringify(record)) as T;
}

export function createMockDataProvider(): AppDataProvider {
  const incidents = mockIncidents.map(clone);
  const specialties = mockSpecialties.map(clone);
  const tags = mockTags.map(clone);
  const details = mockDetails.map(clone);
  const audits: IncidentAudit[] = [];
  const activities = mockActivities.map(clone);
  const remediations = mockRemediations.map(clone);
  const shares = new Map<string, RecordShare[]>();

  return {
    incidents: {
      async list(filter) {
        let list = incidents.map(clone);
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          list = list.filter((i) => i.narrative.toLowerCase().includes(q));
        }
        if (filter?.severity) list = list.filter((i) => i.severityLevel === filter.severity);
        if (filter?.investigationStatus) list = list.filter((i) => i.investigationStatus === filter.investigationStatus);
        if (filter?.escalationPath) list = list.filter((i) => i.escalationPath === filter.escalationPath);
        if (filter?.specialtyTagId) {
          const ids = new Set(tags.filter((t) => t.tagId === filter.specialtyTagId).map((t) => t.incidentId));
          list = list.filter((i) => ids.has(i.id));
        }
        return list;
      },
      async getById(id) {
        const found = incidents.find((i) => i.id === id);
        return found ? clone(found) : null;
      },
      async save(input) {
        if (input.id) {
          const idx = incidents.findIndex((i) => i.id === input.id);
          if (idx >= 0) {
            incidents[idx] = { ...incidents[idx], ...input } as Incident;
            return clone(incidents[idx]);
          }
        }
        const record = {
          id: input.id || crypto.randomUUID(),
          narrative: input.narrative ?? '',
          investigationStatus: input.investigationStatus ?? 1,
          ...input,
        } as Incident;
        incidents.unshift(record);
        return clone(record);
      },
    },

    specialties: {
      async list() {
        return specialties.map(clone);
      },
      async getById(id) {
        const found = specialties.find((s) => s.id === id);
        return found ? clone(found) : null;
      },
    },

    specialtyTags: {
      async listByIncident(incidentId) {
        return tags.filter((t) => t.incidentId === incidentId).map(clone);
      },
      async listAll() {
        return tags.map(clone);
      },
      async save(input) {
        if (input.id) {
          const idx = tags.findIndex((t) => t.id === input.id);
          if (idx >= 0) {
            tags[idx] = { ...tags[idx], ...input } as IncidentSpecialtyTag;
            return clone(tags[idx]);
          }
        }
        const record = { id: crypto.randomUUID(), incidentId: input.incidentId ?? '', ...input } as IncidentSpecialtyTag;
        tags.push(record);
        return clone(record);
      },
      async remove(id) {
        const idx = tags.findIndex((t) => t.id === id);
        if (idx >= 0) tags.splice(idx, 1);
      },
    },

    details: {
      async listByIncident(incidentId) {
        return details.filter((d) => d.incidentId === incidentId).map(clone);
      },
    },

    audits: {
      async listByIncident(incidentId) {
        return audits.filter((a) => a.incidentId === incidentId).map(clone);
      },
      async add(input) {
        const record = {
          id: crypto.randomUUID(),
          incidentId: input.incidentId ?? '',
          occurredOn: input.occurredOn ?? new Date().toISOString(),
          ...input,
        } as IncidentAudit;
        audits.unshift(record);
        return clone(record);
      },
    },

    activities: {
      async listByIncident(incidentId) {
        return activities.filter((a) => a.incidentId === incidentId).map(clone);
      },
      async add(input) {
        const record = {
          id: crypto.randomUUID(),
          incidentId: input.incidentId ?? '',
          occurredOn: input.occurredOn ?? new Date().toISOString(),
          ...input,
        } as InvestigationActivity;
        activities.unshift(record);
        return clone(record);
      },
    },

    remediations: {
      async listByIncident(incidentId) {
        return remediations.filter((r) => r.incidentId === incidentId).map(clone);
      },
      async save(input) {
        if (input.id) {
          const idx = remediations.findIndex((r) => r.id === input.id);
          if (idx >= 0) {
            remediations[idx] = { ...remediations[idx], ...input } as RemediationAction;
            return clone(remediations[idx]);
          }
        }
        const record = {
          id: crypto.randomUUID(),
          incidentId: input.incidentId ?? '',
          description: input.description ?? '',
          ...input,
        } as RemediationAction;
        remediations.push(record);
        return clone(record);
      },
      async remove(id) {
        const idx = remediations.findIndex((r) => r.id === id);
        if (idx >= 0) remediations.splice(idx, 1);
      },
    },

    users: {
      async search(query) {
        const q = query.toLowerCase();
        return mockUsers.filter((u) => !q || u.name.toLowerCase().includes(q)).map(clone);
      },
    },

    sharing: {
      async listShares(incidentId) {
        return (shares.get(incidentId) ?? []).map(clone);
      },
      async grant(incidentId, principalId, access) {
        const user = mockUsers.find((u) => u.id === principalId) ?? { id: principalId, name: principalId };
        const list = shares.get(incidentId) ?? [];
        const existing = list.find((s) => s.principal.id === principalId);
        if (existing) {
          existing.access = access;
        } else {
          list.push({ principal: clone(user), principalType: 'systemuser', access });
        }
        shares.set(incidentId, list);
      },
      async revoke(incidentId, principalId) {
        const list = shares.get(incidentId) ?? [];
        shares.set(
          incidentId,
          list.filter((s) => s.principal.id !== principalId),
        );
      },
    },

    notifications: {
      async sendReporterFeedback() {
        // no-op in mock mode
      },
    },

    fieldMetadata: {
      async getField() {
        return null;
      },
    },
  } satisfies AppDataProvider;
}
