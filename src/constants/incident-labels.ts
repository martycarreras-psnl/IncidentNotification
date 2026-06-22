// Display labels and visual tokens for IRMA option sets. Single source of truth
// for rendering the numeric Dataverse option-set values as human text + colors.
import { tokens } from '@fluentui/react-components';
import type {
  InvestigationStatus,
  SeverityLevel,
  EscalationPath,
  SourceModality,
  ReachedPatient,
  HarmObserved,
  AgeBand,
  TagRole,
  Provenance,
  QuestionMode,
  RemediationStatus,
  ActivityType,
  SseOutcome,
  ReportableStatus,
} from '@/types/domain-models';

export const investigationStatusLabels: Record<InvestigationStatus, string> = {
  1: 'Submitted',
  2: 'Triaged',
  3: 'Under Investigation',
  4: 'Pending Review',
  5: 'SSE Committee',
  6: 'Remediation',
  7: 'Closed',
};

/** Ordered lifecycle for steppers and dashboards. */
export const investigationStatusOrder: InvestigationStatus[] = [1, 2, 3, 4, 5, 6, 7];

export const severityLabels: Record<SeverityLevel, string> = {
  1: '1 — Near miss',
  2: '2 — Minor',
  3: '3 — Moderate',
  4: '4 — Severe',
  5: '5 — Sentinel / SSE',
};

export const severityShort: Record<SeverityLevel, string> = {
  1: 'Near miss',
  2: 'Minor',
  3: 'Moderate',
  4: 'Severe',
  5: 'Sentinel / SSE',
};

export const escalationLabels: Record<EscalationPath, string> = {
  1: 'S1',
  2: 'S2',
  3: 'S3',
  4: 'S4',
  5: 'S5',
};

export const escalationDescriptions: Record<EscalationPath, string> = {
  1: 'Tier 1 — unit / ANM review',
  2: 'Tier 2 — expedited Safety & Risk (24-hr notify)',
  3: 'Sentinel — RCA, never-event protocol',
  4: 'Domain owner — Risk / Compliance',
  5: 'Immediate owner — Incident Command',
};

export const sourceModalityLabels: Record<SourceModality, string> = {
  1: 'Voice',
  2: 'Mobile',
  3: 'Web',
  4: 'Epic launch',
};

export const reachedPatientLabels: Record<ReachedPatient, string> = {
  1: 'Reached — harm',
  2: 'Reached — no harm',
  3: 'Near miss',
  4: 'Unknown',
};

export const harmObservedLabels: Record<HarmObserved, string> = {
  1: 'None',
  2: 'Minor',
  3: 'Moderate',
  4: 'Severe',
  5: 'Death',
  6: 'Unknown',
};

export const ageBandLabels: Record<AgeBand, string> = {
  1: 'Neonate',
  2: 'Infant',
  3: 'Child',
  4: 'Adolescent',
  5: 'N/A',
};

export const tagRoleLabels: Record<TagRole, string> = {
  1: 'Primary',
  2: 'Secondary',
};

export const provenanceLabels: Record<Provenance, string> = {
  1: 'AI',
  2: 'Submitter',
  3: 'Epic',
};

export const questionModeLabels: Record<QuestionMode, string> = {
  1: 'Minimal',
  2: 'Thorough',
};

export const remediationStatusLabels: Record<RemediationStatus, string> = {
  1: 'Open',
  2: 'In Progress',
  3: 'Done',
};

export const activityTypeLabels: Record<ActivityType, string> = {
  1: 'Note',
  2: 'Status Change',
  3: 'Assignment',
  4: 'Reporter Contact',
  5: 'Review',
  6: 'Escalation',
  7: 'Re-classification',
};

export const sseOutcomeLabels: Record<SseOutcome, string> = {
  1: 'Pending Review',
  2: 'Confirmed SSE',
  3: 'Not an SSE',
  4: 'Great Catch',
};

export const reportableLabels: Record<ReportableStatus, string> = {
  1: 'No',
  2: 'Conditional',
  3: 'Yes',
};

// ── Badge color intents (Fluent token-derived) ──

export type BadgeColor =
  | 'brand'
  | 'danger'
  | 'severe'
  | 'warning'
  | 'success'
  | 'informative'
  | 'subtle';

export const severityColor: Record<SeverityLevel, BadgeColor> = {
  1: 'success',
  2: 'informative',
  3: 'warning',
  4: 'severe',
  5: 'danger',
};

export const investigationStatusColor: Record<InvestigationStatus, BadgeColor> = {
  1: 'informative',
  2: 'brand',
  3: 'brand',
  4: 'warning',
  5: 'danger',
  6: 'severe',
  7: 'success',
};

/** Maps a badge color intent to Fluent background/foreground tokens. */
export function badgeTokens(color: BadgeColor): { bg: string; fg: string } {
  switch (color) {
    case 'brand':
      return { bg: tokens.colorBrandBackground2, fg: tokens.colorBrandForeground2 };
    case 'danger':
      return { bg: tokens.colorPaletteRedBackground2, fg: tokens.colorPaletteRedForeground2 };
    case 'severe':
      return { bg: tokens.colorPaletteDarkOrangeBackground2, fg: tokens.colorPaletteDarkOrangeForeground2 };
    case 'warning':
      return { bg: tokens.colorPaletteYellowBackground2, fg: tokens.colorPaletteYellowForeground2 };
    case 'success':
      return { bg: tokens.colorPaletteGreenBackground2, fg: tokens.colorPaletteGreenForeground2 };
    case 'informative':
      return { bg: tokens.colorNeutralBackground4, fg: tokens.colorNeutralForeground2 };
    case 'subtle':
    default:
      return { bg: tokens.colorNeutralBackground3, fg: tokens.colorNeutralForeground3 };
  }
}

/** "S2" → the full escalation label for tooltips. */
export function escalationTooltip(p: EscalationPath): string {
  return `${escalationLabels[p]} — ${escalationDescriptions[p]}`;
}
