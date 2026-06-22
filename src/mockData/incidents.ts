// Mock dataset for prototype/test mode (VITE_USE_MOCK=true). Kept for tests (D8).
import type {
  Incident,
  Specialty,
  IncidentSpecialtyTag,
  IncidentDetail,
  InvestigationActivity,
  RemediationAction,
  UserRef,
} from '@/types/domain-models';

export const mockUsers: UserRef[] = [
  { id: 'u-1', name: 'Bethany Franklin', email: 'bethany@contoso.com' },
  { id: 'u-2', name: 'Chris Lohret', email: 'chris@contoso.com' },
  { id: 'u-3', name: 'Sunny Eltepu', email: 'sunny@contoso.com' },
];

export const mockSpecialties: Specialty[] = [
  { id: 's-med', name: 'Pharmacy / Medication', tagKey: 'medication', owningTeam: 'Pharmacy / Med Safety', reportable: 2, suggestedPath: 2, teamsChannel: 'Medication and Pharmacy', domain: 'Medication & Pharmacy', sortOrder: 1, active: true },
  { id: 's-lab', name: 'Pathology / Laboratory', tagKey: 'laboratory-pathology', owningTeam: 'Laboratory', reportable: 2, suggestedPath: 1, teamsChannel: 'Laboratory and Pathology', domain: 'Laboratory & Pathology', sortOrder: 5, active: true },
  { id: 's-npcc', name: 'Critical Care (PICU/CICU/NICU)', tagKey: 'neonatal-pediatric-critical-care', owningTeam: 'Critical Care / NICU', reportable: 2, suggestedPath: 2, teamsChannel: 'Neonatal and Pediatric Critical Care', domain: 'Neonatal & Pediatric Critical Care', sortOrder: 2, active: true },
];

export const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    title: 'Laboratory Pathology — Potassium recheck missed in PICU',
    narrative: 'Potassium recheck was missed in the PICU; a dose that likely should have been held was given. Caught on rounds, no harm.',
    status: 2,
    investigationStatus: 2,
    sourceModality: 1,
    reporterRole: 'RN',
    wantsFeedback: true,
    patientInvolved: true,
    ageBand: 3,
    location: 'PICU',
    eventDateTime: '2026-06-20T15:00:00Z',
    reachedPatient: 2,
    harmObserved: 1,
    severityLevel: 2,
    severitySource: 1,
    escalationPath: 2,
    extReportRequired: false,
    aiRecommended: true,
    humanConfirmed: true,
    reporter: mockUsers[0],
    routingOwner: mockUsers[1],
    createdOn: '2026-06-20T16:00:00Z',
  },
  {
    id: 'inc-2',
    title: 'Medication — Insulin drip 10x rate caught before harm',
    narrative: 'Insulin drip rate programmed at 10x intended on the pump. Nurse caught discrepancy before harm; pump reprogrammed.',
    status: 2,
    investigationStatus: 6,
    sourceModality: 2,
    reporterRole: 'Pharmacist',
    wantsFeedback: true,
    patientInvolved: true,
    ageBand: 4,
    location: '4 West Med/Surg',
    eventDateTime: '2026-06-18T09:00:00Z',
    reachedPatient: 3,
    harmObserved: 1,
    severityLevel: 3,
    severitySource: 2,
    escalationPath: 2,
    extReportRequired: false,
    aiRecommended: true,
    humanConfirmed: true,
    reporter: mockUsers[2],
    assignedTo: mockUsers[1],
    routingOwner: mockUsers[1],
    createdOn: '2026-06-18T10:00:00Z',
  },
  {
    id: 'inc-3',
    title: 'Critical Care — Wrong breastmilk caught at scan (NICU)',
    narrative: 'Wrong breastmilk nearly given to a NICU infant; barcode scan mismatch stopped administration.',
    status: 2,
    investigationStatus: 7,
    sourceModality: 4,
    reporterRole: 'RN',
    wantsFeedback: true,
    patientInvolved: true,
    ageBand: 1,
    location: 'NICU',
    eventDateTime: '2026-05-30T03:00:00Z',
    reachedPatient: 3,
    harmObserved: 1,
    severityLevel: 2,
    severitySource: 1,
    escalationPath: 2,
    extReportRequired: false,
    aiRecommended: true,
    humanConfirmed: true,
    reporter: mockUsers[0],
    assignedTo: mockUsers[2],
    routingOwner: mockUsers[2],
    closedOn: '2026-06-10T12:00:00Z',
    rootCause: 'Process gap addressed via remediation actions.',
    reporterFeedbackSent: true,
    createdOn: '2026-05-30T04:00:00Z',
  },
];

export const mockTags: IncidentSpecialtyTag[] = [
  { id: 't-1', incidentId: 'inc-1', tagId: 's-lab', tagName: 'Pathology / Laboratory', role: 1, confidence: 0.92, source: 1 },
  { id: 't-2', incidentId: 'inc-1', tagId: 's-med', tagName: 'Pharmacy / Medication', role: 2, confidence: 0.74, source: 1 },
  { id: 't-3', incidentId: 'inc-1', tagId: 's-npcc', tagName: 'Critical Care (PICU/CICU/NICU)', role: 2, confidence: 0.81, source: 1 },
  { id: 't-4', incidentId: 'inc-2', tagId: 's-med', tagName: 'Pharmacy / Medication', role: 1, confidence: 0.95, source: 1 },
  { id: 't-5', incidentId: 'inc-3', tagId: 's-npcc', tagName: 'Critical Care (PICU/CICU/NICU)', role: 1, confidence: 0.88, source: 1 },
];

export const mockDetails: IncidentDetail[] = [
  { id: 'd-1', incidentId: 'inc-1', fieldId: 'lab.stage', fieldValue: 'reporting/follow-up', specialty: 'laboratory-pathology', tier: 1, source: 1 },
  { id: 'd-2', incidentId: 'inc-1', fieldId: 'lab.test_specimen', fieldValue: 'potassium', specialty: 'laboratory-pathology', tier: 1, source: 1 },
  { id: 'd-3', incidentId: 'inc-2', fieldId: 'med.high_alert_class', fieldValue: 'insulin', specialty: 'medication', tier: 1, source: 2 },
];

export const mockActivities: InvestigationActivity[] = [
  { id: 'a-1', incidentId: 'inc-1', title: 'Intake received', activityType: 1, note: 'Incident received from IRMA intake agent.', author: mockUsers[1], occurredOn: '2026-06-20T16:00:00Z' },
];

export const mockRemediations: RemediationAction[] = [
  { id: 'r-1', incidentId: 'inc-2', title: 'Process update', description: 'Add hard-stop on pump rate override.', owner: mockUsers[1], status: 2, dueDate: '2026-07-09' },
];
