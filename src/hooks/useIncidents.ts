import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataProvider } from '@/services/provider';
import type { IncidentListFilter } from '@/services/data-contracts';
import type {
  Incident,
  IncidentAudit,
  IncidentSpecialtyTag,
  InvestigationActivity,
  RemediationAction,
  ReporterFeedbackInput,
  AccessRight,
} from '@/types/domain-models';

const provider = getDataProvider();

export const queryKeys = {
  incidents: (filter?: IncidentListFilter) => ['incidents', filter ?? {}] as const,
  incident: (id: string) => ['incidents', id] as const,
  specialties: ['specialties'] as const,
  tags: (incidentId: string) => ['tags', incidentId] as const,
  details: (incidentId: string) => ['details', incidentId] as const,
  audits: (incidentId: string) => ['audits', incidentId] as const,
  activities: (incidentId: string) => ['activities', incidentId] as const,
  remediations: (incidentId: string) => ['remediations', incidentId] as const,
  shares: (incidentId: string) => ['shares', incidentId] as const,
  users: (q: string) => ['users', q] as const,
};

// ── Incidents ──

export function useIncidents(filter?: IncidentListFilter) {
  return useQuery({
    queryKey: queryKeys.incidents(filter),
    queryFn: () => provider.incidents.list(filter),
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.incident(id || 'new'),
    queryFn: () => (id ? provider.incidents.getById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useSaveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Incident>) => provider.incidents.save(input),
    onSuccess: (saved, input) => {
      // Merge user input over server record (Dataverse read replicas lag).
      const merged = input.id
        ? ({ ...(qc.getQueryData<Incident>(queryKeys.incident(input.id)) ?? saved), ...input } as Incident)
        : saved;
      qc.setQueryData(queryKeys.incident(merged.id), merged);
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

// ── Specialties ──

export function useSpecialties() {
  return useQuery({
    queryKey: queryKeys.specialties,
    queryFn: () => provider.specialties.list(),
    staleTime: 30 * 60 * 1000,
  });
}

// ── Specialty tags ──

export function useIncidentTags(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tags(incidentId || ''),
    queryFn: () => (incidentId ? provider.specialtyTags.listByIncident(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

export function useAllTags() {
  return useQuery({
    queryKey: ['tags', 'all'] as const,
    queryFn: () => provider.specialtyTags.listAll(),
  });
}

export function useSaveIncidentTag(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<IncidentSpecialtyTag>) => provider.specialtyTags.save({ ...input, incidentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags(incidentId) }),
  });
}

export function useRemoveIncidentTag(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => provider.specialtyTags.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags(incidentId) }),
  });
}

// ── EAV details ──

export function useIncidentDetails(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.details(incidentId || ''),
    queryFn: () => (incidentId ? provider.details.listByIncident(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

// ── Audits ──

export function useIncidentAudits(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audits(incidentId || ''),
    queryFn: () => (incidentId ? provider.audits.listByIncident(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

export function useAddAudit(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<IncidentAudit>) => provider.audits.add({ ...input, incidentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.audits(incidentId) }),
  });
}

// ── Activities ──

export function useIncidentActivities(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities(incidentId || ''),
    queryFn: () => (incidentId ? provider.activities.listByIncident(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

export function useAddActivity(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<InvestigationActivity>) => provider.activities.add({ ...input, incidentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activities(incidentId) }),
  });
}

// ── Remediation actions ──

export function useRemediations(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.remediations(incidentId || ''),
    queryFn: () => (incidentId ? provider.remediations.listByIncident(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

export function useSaveRemediation(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RemediationAction>) => provider.remediations.save({ ...input, incidentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.remediations(incidentId) }),
  });
}

export function useRemoveRemediation(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => provider.remediations.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.remediations(incidentId) }),
  });
}

// ── User directory (people picker) ──

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.users(query),
    queryFn: () => provider.users.search(query),
    enabled: query.length >= 2,
  });
}

// ── Record sharing (native Dataverse GrantAccess / RevokeAccess) ──

export function useRecordShares(incidentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.shares(incidentId || ''),
    queryFn: () => (incidentId ? provider.sharing.listShares(incidentId) : Promise.resolve([])),
    enabled: Boolean(incidentId),
  });
}

export function useGrantShare(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ principalId, access }: { principalId: string; access: AccessRight[] }) =>
      provider.sharing.grant(incidentId, principalId, access),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.shares(incidentId) }),
  });
}

export function useRevokeShare(incidentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (principalId: string) => provider.sharing.revoke(incidentId, principalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.shares(incidentId) }),
  });
}

// ── Notifications (close the loop — Teams) ──

export function useSendReporterFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReporterFeedbackInput) => provider.notifications.sendReporterFeedback(input),
    onSuccess: (_data, input) => qc.invalidateQueries({ queryKey: queryKeys.incident(input.incidentId) }),
  });
}
