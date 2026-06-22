// IRMA domain models — the UI-facing contract.
// These are intentionally decoupled from the generated connector shapes in
// src/generated/**. Adapters in src/services/real-data-provider.ts map between
// the two. Edit dataverse/planning-payload.json when the schema changes.

/** A reference to a Dataverse systemuser (people-picker value). */
export interface UserRef {
  id: string;
  name: string;
  email?: string;
}

// ── Enumerations (numeric option-set values mirror the Dataverse global option sets) ──

export type IncidentStatus = 1 | 2; // Draft | Submitted

export type InvestigationStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7;
// Submitted | Triaged | Under Investigation | Pending Review | SSE Committee | Remediation | Closed

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type EscalationPath = 1 | 2 | 3 | 4 | 5; // S1..S5
export type SourceModality = 1 | 2 | 3 | 4; // Voice | Mobile | Web | Epic launch
export type ReachedPatient = 1 | 2 | 3 | 4;
export type HarmObserved = 1 | 2 | 3 | 4 | 5 | 6;
export type AgeBand = 1 | 2 | 3 | 4 | 5;
export type TagRole = 1 | 2; // Primary | Secondary
export type Provenance = 1 | 2 | 3; // AI | Submitter | Epic
export type QuestionMode = 1 | 2; // Minimal | Thorough
export type RemediationStatus = 1 | 2 | 3; // Open | In Progress | Done
export type ActivityType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SseOutcome = 1 | 2 | 3 | 4;
export type ReportableStatus = 1 | 2 | 3; // No | Conditional | Yes

/** Primary incident record. */
export interface Incident {
  id: string;
  title?: string;

  // Intake (agent-owned)
  sourceModality?: SourceModality;
  status?: IncidentStatus;
  narrative: string;
  reporterRole?: string;
  wantsFeedback?: boolean;
  patientInvolved?: boolean;
  mrn?: string;
  encounterId?: string;
  ageBand?: AgeBand;
  location?: string;
  eventDateTime?: string;
  reachedPatient?: ReachedPatient;
  harmObserved?: HarmObserved;
  immediateActions?: string;
  ongoingHazard?: boolean;
  ongoingHazardDetail?: string;
  severityLevel?: SeverityLevel;
  severitySource?: Provenance;
  severityRationale?: string;
  escalationPath?: EscalationPath;
  extReportRequired?: boolean;
  extReportType?: string;
  extReportClockHrs?: number;
  followupCount?: number;
  mode?: QuestionMode;
  aiRecommended?: boolean;
  humanConfirmed?: boolean;

  // Investigation (app-owned)
  investigationStatus: InvestigationStatus;
  reporter?: UserRef;
  assignedTo?: UserRef;
  routingOwner?: UserRef;
  triagedOn?: string;
  investigationStartedOn?: string;
  closedOn?: string;
  rootCause?: string;
  sseSuggested?: boolean;
  sseReview?: boolean;
  sseOutcome?: SseOutcome;
  serviceNowRef?: string;
  reporterFeedbackSent?: boolean;
  reporterFeedbackText?: string;
  feedbackSentOn?: string;

  // System
  createdOn?: string;
  modifiedOn?: string;
}

/** Reference specialty tag (one of the 32). */
export interface Specialty {
  id: string;
  name: string;
  tagKey?: string;
  owningTeam?: string;
  reportable?: ReportableStatus;
  suggestedPath?: EscalationPath;
  teamsChannel?: string;
  domain?: string;
  sortOrder?: number;
  active?: boolean;
}

/** A detected/confirmed specialty tag on an incident. */
export interface IncidentSpecialtyTag {
  id: string;
  incidentId: string;
  tagId?: string;
  tagName?: string;
  role?: TagRole;
  confidence?: number;
  source?: Provenance;
  evidence?: string;
}

/** An EAV detail row (variable per-specialty fact). */
export interface IncidentDetail {
  id: string;
  incidentId: string;
  fieldId: string;
  fieldValue?: string;
  specialty?: string;
  tier?: number;
  source?: Provenance;
}

/** An audit row (override or re-classification). */
export interface IncidentAudit {
  id: string;
  incidentId: string;
  path?: string;
  fromValue?: string;
  toValue?: string;
  author?: UserRef;
  occurredOn?: string;
}

/** A timeline activity on an investigation. */
export interface InvestigationActivity {
  id: string;
  incidentId: string;
  title?: string;
  activityType?: ActivityType;
  note?: string;
  author?: UserRef;
  occurredOn?: string;
}

/** A remediation action tracked against an incident. */
export interface RemediationAction {
  id: string;
  incidentId: string;
  title?: string;
  description: string;
  owner?: UserRef;
  dueDate?: string;
  status?: RemediationStatus;
  completedOn?: string;
}

/** Payload for sending close-the-loop feedback to a reporter (via Teams — ADR-0006). */
export interface ReporterFeedbackInput {
  incidentId: string;
  reporter: UserRef;
  message: string;
}
