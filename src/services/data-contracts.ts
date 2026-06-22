// Provider contracts are the seam between mock UX and real connectors.
// The UI depends only on these interfaces — never on src/generated/**.

import type {
  Incident,
  Specialty,
  IncidentSpecialtyTag,
  IncidentDetail,
  IncidentAudit,
  InvestigationActivity,
  RemediationAction,
  ReporterFeedbackInput,
  UserRef,
  RecordShare,
  AccessRight,
} from '@/types/domain-models';

export type DataverseFieldRequiredLevel = 'none' | 'recommended' | 'application' | 'system';

export interface DataverseFieldMetadata {
  tableLogicalName: string;
  fieldLogicalName: string;
  displayName?: string;
  requiredLevel: DataverseFieldRequiredLevel;
  isRequired: boolean;
  maxLength?: number;   // String/Memo columns
  minValue?: number;    // Money/Decimal/Integer columns
  maxValue?: number;    // Money/Decimal/Integer columns
  precision?: number;   // Money/Decimal columns
}

export interface FieldMetadataRepository {
  getField(tableLogicalName: string, fieldLogicalName: string): Promise<DataverseFieldMetadata | null>;
}

/** Optional filter inputs for the incident list. */
export interface IncidentListFilter {
  search?: string;
  specialtyTagId?: string;
  severity?: number;
  investigationStatus?: number;
  escalationPath?: number;
  fromDate?: string;
  toDate?: string;
}

export interface IncidentRepository {
  list(filter?: IncidentListFilter): Promise<Incident[]>;
  getById(id: string): Promise<Incident | null>;
  save(input: Partial<Incident>): Promise<Incident>;
}

export interface SpecialtyRepository {
  list(): Promise<Specialty[]>;
  getById(id: string): Promise<Specialty | null>;
}

export interface IncidentSpecialtyTagRepository {
  listByIncident(incidentId: string): Promise<IncidentSpecialtyTag[]>;
  /** All tags across all incidents — used by the list page for chips + specialty filtering. */
  listAll(): Promise<IncidentSpecialtyTag[]>;
  save(input: Partial<IncidentSpecialtyTag>): Promise<IncidentSpecialtyTag>;
  remove(id: string): Promise<void>;
}

export interface IncidentDetailRepository {
  listByIncident(incidentId: string): Promise<IncidentDetail[]>;
}

export interface IncidentAuditRepository {
  listByIncident(incidentId: string): Promise<IncidentAudit[]>;
  add(input: Partial<IncidentAudit>): Promise<IncidentAudit>;
}

export interface InvestigationActivityRepository {
  listByIncident(incidentId: string): Promise<InvestigationActivity[]>;
  add(input: Partial<InvestigationActivity>): Promise<InvestigationActivity>;
}

export interface RemediationActionRepository {
  listByIncident(incidentId: string): Promise<RemediationAction[]>;
  save(input: Partial<RemediationAction>): Promise<RemediationAction>;
  remove(id: string): Promise<void>;
}

/** People-picker / user lookup (resolves systemuser references). */
export interface UserDirectory {
  search(query: string): Promise<UserRef[]>;
}

/** Close-the-loop notification (Teams — ADR-0006). Channel-agnostic by design. */
export interface NotificationService {
  sendReporterFeedback(input: ReporterFeedbackInput): Promise<void>;
}

/**
 * Native Dataverse record sharing for incidents — backed by the GrantAccess /
 * RevokeAccess / RetrieveSharedPrincipalsAndAccess messages.
 */
export interface RecordSharingRepository {
  /** All principals the incident has been shared with. */
  listShares(incidentId: string): Promise<RecordShare[]>;
  /** Share (or re-share) the incident with a user using the given access rights. */
  grant(incidentId: string, principalId: string, access: AccessRight[]): Promise<void>;
  /** Remove all sharing access for a principal. */
  revoke(incidentId: string, principalId: string): Promise<void>;
}

export interface AppDataProvider {
  incidents: IncidentRepository;
  specialties: SpecialtyRepository;
  specialtyTags: IncidentSpecialtyTagRepository;
  details: IncidentDetailRepository;
  audits: IncidentAuditRepository;
  activities: InvestigationActivityRepository;
  remediations: RemediationActionRepository;
  users: UserDirectory;
  notifications: NotificationService;
  sharing: RecordSharingRepository;
  fieldMetadata: FieldMetadataRepository;
}
