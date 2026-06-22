// Real data provider — adapts the read-only generated connector services in
// src/generated/** into the domain contracts in data-contracts.ts. The UI never
// imports generated services directly; it depends only on these adapters.

import type {
  AppDataProvider,
  IncidentListFilter,
} from '@/services/data-contracts';
import { getFieldMetadata } from '@/services/field-metadata-cache';
import type {
  Incident,
  IncidentAudit,
  IncidentDetail,
  IncidentSpecialtyTag,
  InvestigationActivity,
  RemediationAction,
  Specialty,
  UserRef,
} from '@/types/domain-models';

import { Msftirma_incidentsService } from '@/generated/services/Msftirma_incidentsService';
import { Msftirma_specialtiesService } from '@/generated/services/Msftirma_specialtiesService';
import { Msftirma_incidentspecialtytagsService } from '@/generated/services/Msftirma_incidentspecialtytagsService';
import { Msftirma_incidentdetailsService } from '@/generated/services/Msftirma_incidentdetailsService';
import { Msftirma_incidentauditsService } from '@/generated/services/Msftirma_incidentauditsService';
import { Msftirma_investigationactivitiesService } from '@/generated/services/Msftirma_investigationactivitiesService';
import { Msftirma_remediationactionsService } from '@/generated/services/Msftirma_remediationactionsService';
import { SystemusersService } from '@/generated/services/SystemusersService';
import { MicrosoftTeamsService } from '@/generated/services/MicrosoftTeamsService';

// ── helpers ──

type Row = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}
function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}
function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

/** Build a UserRef from a row's `_<lookup>_value` + `<lookup>name` formatted pair. */
function userRef(row: Row, valueField: string, nameField: string): UserRef | undefined {
  const id = str(row[valueField]);
  if (!id) return undefined;
  return { id, name: str(row[nameField]) ?? id };
}

/** Single-quote escape for OData string literals. */
function odata(v: string): string {
  return v.replace(/'/g, "''");
}

// ── Incident adapter ──

function mapIncident(r: Row): Incident {
  return {
    id: String(r.msftirma_incidentid ?? ''),
    title: str(r.msftirma_name),
    sourceModality: num(r.msftirma_sourcemodality) as Incident['sourceModality'],
    status: num(r.msftirma_status) as Incident['status'],
    narrative: str(r.msftirma_narrative) ?? '',
    reporterRole: str(r.msftirma_reporterrole),
    wantsFeedback: bool(r.msftirma_wantsfeedback),
    patientInvolved: bool(r.msftirma_patientinvolved),
    mrn: str(r.msftirma_mrn),
    encounterId: str(r.msftirma_encounterid),
    ageBand: num(r.msftirma_ageband) as Incident['ageBand'],
    location: str(r.msftirma_location),
    eventDateTime: str(r.msftirma_eventdatetime),
    reachedPatient: num(r.msftirma_reachedpatient) as Incident['reachedPatient'],
    harmObserved: num(r.msftirma_harmobserved) as Incident['harmObserved'],
    immediateActions: str(r.msftirma_immediateactions),
    ongoingHazard: bool(r.msftirma_ongoinghazard),
    ongoingHazardDetail: str(r.msftirma_ongoinghazarddetail),
    severityLevel: num(r.msftirma_severitylevel) as Incident['severityLevel'],
    severitySource: num(r.msftirma_severitysource) as Incident['severitySource'],
    severityRationale: str(r.msftirma_severityrationale),
    escalationPath: num(r.msftirma_escalationpath) as Incident['escalationPath'],
    extReportRequired: bool(r.msftirma_extreportrequired),
    extReportType: str(r.msftirma_extreporttype),
    extReportClockHrs: num(r.msftirma_extreportclockhrs),
    followupCount: num(r.msftirma_followupcount),
    mode: num(r.msftirma_mode) as Incident['mode'],
    aiRecommended: bool(r.msftirma_airecommended),
    humanConfirmed: bool(r.msftirma_humanconfirmed),
    investigationStatus: (num(r.msftirma_investigationstatus) ?? 1) as Incident['investigationStatus'],
    reporter: userRef(r, '_msftirma_reporter_value', 'msftirma_reportername'),
    assignedTo: userRef(r, '_msftirma_assignedto_value', 'msftirma_assignedtoname'),
    routingOwner: userRef(r, '_msftirma_routingowner_value', 'msftirma_routingownername'),
    triagedOn: str(r.msftirma_triagedon),
    investigationStartedOn: str(r.msftirma_investigationstartedon),
    closedOn: str(r.msftirma_closedon),
    rootCause: str(r.msftirma_rootcause),
    sseSuggested: bool(r.msftirma_ssesuggested),
    sseReview: bool(r.msftirma_ssereview),
    sseOutcome: num(r.msftirma_sseoutcome) as Incident['sseOutcome'],
    serviceNowRef: str(r.msftirma_servicenowref),
    reporterFeedbackSent: bool(r.msftirma_reporterfeedbacksent),
    reporterFeedbackText: str(r.msftirma_reporterfeedbacktext),
    feedbackSentOn: str(r.msftirma_feedbacksenton),
    createdOn: str(r.createdon),
    modifiedOn: str(r.modifiedon),
  };
}

/** Map a domain incident patch into a Dataverse write body (only present keys). */
function incidentToWrite(input: Partial<Incident>): Row {
  const w: Row = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) w[k] = v;
  };
  set('msftirma_name', input.title);
  set('msftirma_sourcemodality', input.sourceModality);
  set('msftirma_status', input.status);
  set('msftirma_narrative', input.narrative);
  set('msftirma_reporterrole', input.reporterRole);
  set('msftirma_wantsfeedback', input.wantsFeedback);
  set('msftirma_patientinvolved', input.patientInvolved);
  set('msftirma_mrn', input.mrn);
  set('msftirma_encounterid', input.encounterId);
  set('msftirma_ageband', input.ageBand);
  set('msftirma_location', input.location);
  set('msftirma_eventdatetime', input.eventDateTime);
  set('msftirma_reachedpatient', input.reachedPatient);
  set('msftirma_harmobserved', input.harmObserved);
  set('msftirma_immediateactions', input.immediateActions);
  set('msftirma_ongoinghazard', input.ongoingHazard);
  set('msftirma_ongoinghazarddetail', input.ongoingHazardDetail);
  set('msftirma_severitylevel', input.severityLevel);
  set('msftirma_severitysource', input.severitySource);
  set('msftirma_severityrationale', input.severityRationale);
  set('msftirma_escalationpath', input.escalationPath);
  set('msftirma_extreportrequired', input.extReportRequired);
  set('msftirma_extreporttype', input.extReportType);
  set('msftirma_extreportclockhrs', input.extReportClockHrs);
  set('msftirma_followupcount', input.followupCount);
  set('msftirma_mode', input.mode);
  set('msftirma_airecommended', input.aiRecommended);
  set('msftirma_humanconfirmed', input.humanConfirmed);
  set('msftirma_investigationstatus', input.investigationStatus);
  set('msftirma_triagedon', input.triagedOn);
  set('msftirma_investigationstartedon', input.investigationStartedOn);
  set('msftirma_closedon', input.closedOn);
  set('msftirma_rootcause', input.rootCause);
  set('msftirma_ssesuggested', input.sseSuggested);
  set('msftirma_ssereview', input.sseReview);
  set('msftirma_sseoutcome', input.sseOutcome);
  set('msftirma_servicenowref', input.serviceNowRef);
  set('msftirma_reporterfeedbacksent', input.reporterFeedbackSent);
  set('msftirma_reporterfeedbacktext', input.reporterFeedbackText);
  set('msftirma_feedbacksenton', input.feedbackSentOn);
  // Lookups (PascalCase nav property @odata.bind)
  if (input.reporter !== undefined)
    w['msftirma_Reporter@odata.bind'] = input.reporter ? `/systemusers(${input.reporter.id})` : null;
  if (input.assignedTo !== undefined)
    w['msftirma_AssignedTo@odata.bind'] = input.assignedTo ? `/systemusers(${input.assignedTo.id})` : null;
  if (input.routingOwner !== undefined)
    w['msftirma_RoutingOwner@odata.bind'] = input.routingOwner ? `/systemusers(${input.routingOwner.id})` : null;
  return w;
}

function buildIncidentFilter(f?: IncidentListFilter): string | undefined {
  if (!f) return undefined;
  const parts: string[] = [];
  if (f.search) parts.push(`contains(msftirma_narrative,'${odata(f.search)}')`);
  if (f.severity) parts.push(`msftirma_severitylevel eq ${f.severity}`);
  if (f.investigationStatus) parts.push(`msftirma_investigationstatus eq ${f.investigationStatus}`);
  if (f.escalationPath) parts.push(`msftirma_escalationpath eq ${f.escalationPath}`);
  if (f.fromDate) parts.push(`msftirma_eventdatetime ge ${f.fromDate}`);
  if (f.toDate) parts.push(`msftirma_eventdatetime le ${f.toDate}`);
  return parts.length ? parts.join(' and ') : undefined;
}

// ── child-row adapters ──

function mapSpecialty(r: Row): Specialty {
  return {
    id: String(r.msftirma_specialtyid ?? ''),
    name: str(r.msftirma_name) ?? '',
    tagKey: str(r.msftirma_tagkey),
    owningTeam: str(r.msftirma_owningteam),
    reportable: num(r.msftirma_reportable) as Specialty['reportable'],
    suggestedPath: num(r.msftirma_suggestedpath) as Specialty['suggestedPath'],
    teamsChannel: str(r.msftirma_teamschannel),
    domain: str(r.msftirma_domain),
    sortOrder: num(r.msftirma_sortorder),
    active: bool(r.msftirma_active),
  };
}

function mapTag(r: Row): IncidentSpecialtyTag {
  return {
    id: String(r.msftirma_incidentspecialtytagid ?? ''),
    incidentId: str(r._msftirma_incident_value) ?? '',
    tagId: str(r._msftirma_tag_value),
    tagName: str(r.msftirma_tagname),
    role: num(r.msftirma_role) as IncidentSpecialtyTag['role'],
    confidence: num(r.msftirma_confidence),
    source: num(r.msftirma_source) as IncidentSpecialtyTag['source'],
    evidence: str(r.msftirma_evidence),
  };
}

function mapDetail(r: Row): IncidentDetail {
  return {
    id: String(r.msftirma_incidentdetailid ?? ''),
    incidentId: str(r._msftirma_incident_value) ?? '',
    fieldId: str(r.msftirma_fieldid) ?? '',
    fieldValue: str(r.msftirma_fieldvalue),
    specialty: str(r.msftirma_specialty),
    tier: num(r.msftirma_tier),
    source: num(r.msftirma_source) as IncidentDetail['source'],
  };
}

function mapAudit(r: Row): IncidentAudit {
  return {
    id: String(r.msftirma_incidentauditid ?? ''),
    incidentId: str(r._msftirma_incident_value) ?? '',
    path: str(r.msftirma_path),
    fromValue: str(r.msftirma_fromvalue),
    toValue: str(r.msftirma_tovalue),
    author: userRef(r, '_msftirma_author_value', 'msftirma_authorname'),
    occurredOn: str(r.msftirma_occurredon),
  };
}

function mapActivity(r: Row): InvestigationActivity {
  return {
    id: String(r.msftirma_investigationactivityid ?? ''),
    incidentId: str(r._msftirma_incident_value) ?? '',
    title: str(r.msftirma_name),
    activityType: num(r.msftirma_activitytype) as InvestigationActivity['activityType'],
    note: str(r.msftirma_note),
    author: userRef(r, '_msftirma_author_value', 'msftirma_authorname'),
    occurredOn: str(r.msftirma_occurredon),
  };
}

function mapRemediation(r: Row): RemediationAction {
  return {
    id: String(r.msftirma_remediationactionid ?? ''),
    incidentId: str(r._msftirma_incident_value) ?? '',
    title: str(r.msftirma_name),
    description: str(r.msftirma_description) ?? '',
    owner: userRef(r, '_msftirma_actionowner_value', 'msftirma_actionownername'),
    dueDate: str(r.msftirma_duedate),
    status: num(r.msftirma_status) as RemediationAction['status'],
    completedOn: str(r.msftirma_completedon),
  };
}

function mapUser(r: Row): UserRef {
  return {
    id: String(r.systemuserid ?? ''),
    name: str(r.fullname) ?? str(r.internalemailaddress) ?? '',
    email: str(r.internalemailaddress),
  };
}

function rows<T = Row>(result: { data?: unknown } | undefined): T[] {
  const d = result?.data as unknown;
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === 'object' && Array.isArray((d as { value?: T[] }).value)) {
    return (d as { value: T[] }).value;
  }
  return [];
}

export function createRealDataProvider(): AppDataProvider {
  return {
    incidents: {
      async list(filter) {
        const result = await Msftirma_incidentsService.getAll({
          filter: buildIncidentFilter(filter),
          orderBy: ['createdon desc'],
        });
        return rows<Row>(result).map(mapIncident);
      },
      async getById(id) {
        const result = await Msftirma_incidentsService.get(id);
        return result.data ? mapIncident(result.data as unknown as Row) : null;
      },
      async save(input) {
        if (input.id) {
          const { id, ...patch } = input;
          await Msftirma_incidentsService.update(id, incidentToWrite(patch) as never);
          const after = await Msftirma_incidentsService.get(id);
          return mapIncident(after.data as unknown as Row);
        }
        const created = await Msftirma_incidentsService.create(incidentToWrite(input) as never);
        return mapIncident(created.data as unknown as Row);
      },
    },

    specialties: {
      async list() {
        const result = await Msftirma_specialtiesService.getAll({ orderBy: ['msftirma_sortorder asc'] });
        return rows<Row>(result).map(mapSpecialty);
      },
      async getById(id) {
        const result = await Msftirma_specialtiesService.get(id);
        return result.data ? mapSpecialty(result.data as unknown as Row) : null;
      },
    },

    specialtyTags: {
      async listByIncident(incidentId) {
        const result = await Msftirma_incidentspecialtytagsService.getAll({
          filter: `_msftirma_incident_value eq ${incidentId}`,
        });
        return rows<Row>(result).map(mapTag);
      },
      async listAll() {
        const result = await Msftirma_incidentspecialtytagsService.getAll({});
        return rows<Row>(result).map(mapTag);
      },
      async save(input) {
        const w: Row = {};
        if (input.incidentId) w['msftirma_Incident@odata.bind'] = `/msftirma_incidents(${input.incidentId})`;
        if (input.tagId) w['msftirma_Tag@odata.bind'] = `/msftirma_specialties(${input.tagId})`;
        if (input.role !== undefined) w.msftirma_role = input.role;
        if (input.confidence !== undefined) w.msftirma_confidence = input.confidence;
        if (input.source !== undefined) w.msftirma_source = input.source;
        if (input.evidence !== undefined) w.msftirma_evidence = input.evidence;
        if (input.tagName !== undefined) w.msftirma_name = input.tagName;
        if (input.id) {
          await Msftirma_incidentspecialtytagsService.update(input.id, w as never);
          const after = await Msftirma_incidentspecialtytagsService.get(input.id);
          return mapTag(after.data as unknown as Row);
        }
        const created = await Msftirma_incidentspecialtytagsService.create(w as never);
        return mapTag(created.data as unknown as Row);
      },
      async remove(id) {
        await Msftirma_incidentspecialtytagsService.delete(id);
      },
    },

    details: {
      async listByIncident(incidentId) {
        const result = await Msftirma_incidentdetailsService.getAll({
          filter: `_msftirma_incident_value eq ${incidentId}`,
        });
        return rows<Row>(result).map(mapDetail);
      },
    },

    audits: {
      async listByIncident(incidentId) {
        const result = await Msftirma_incidentauditsService.getAll({
          filter: `_msftirma_incident_value eq ${incidentId}`,
          orderBy: ['msftirma_occurredon desc'],
        });
        return rows<Row>(result).map(mapAudit);
      },
      async add(input) {
        const w: Row = {};
        if (input.incidentId) w['msftirma_Incident@odata.bind'] = `/msftirma_incidents(${input.incidentId})`;
        if (input.author) w['msftirma_Author@odata.bind'] = `/systemusers(${input.author.id})`;
        if (input.path !== undefined) w.msftirma_path = input.path;
        if (input.fromValue !== undefined) w.msftirma_fromvalue = input.fromValue;
        if (input.toValue !== undefined) w.msftirma_tovalue = input.toValue;
        w.msftirma_occurredon = input.occurredOn ?? new Date().toISOString();
        w.msftirma_name = input.path ?? 'change';
        const created = await Msftirma_incidentauditsService.create(w as never);
        return mapAudit(created.data as unknown as Row);
      },
    },

    activities: {
      async listByIncident(incidentId) {
        const result = await Msftirma_investigationactivitiesService.getAll({
          filter: `_msftirma_incident_value eq ${incidentId}`,
          orderBy: ['msftirma_occurredon desc'],
        });
        return rows<Row>(result).map(mapActivity);
      },
      async add(input) {
        const w: Row = {};
        if (input.incidentId) w['msftirma_Incident@odata.bind'] = `/msftirma_incidents(${input.incidentId})`;
        if (input.author) w['msftirma_Author@odata.bind'] = `/systemusers(${input.author.id})`;
        if (input.activityType !== undefined) w.msftirma_activitytype = input.activityType;
        if (input.note !== undefined) w.msftirma_note = input.note;
        w.msftirma_name = input.title ?? 'Activity';
        w.msftirma_occurredon = input.occurredOn ?? new Date().toISOString();
        const created = await Msftirma_investigationactivitiesService.create(w as never);
        return mapActivity(created.data as unknown as Row);
      },
    },

    remediations: {
      async listByIncident(incidentId) {
        const result = await Msftirma_remediationactionsService.getAll({
          filter: `_msftirma_incident_value eq ${incidentId}`,
          orderBy: ['msftirma_duedate asc'],
        });
        return rows<Row>(result).map(mapRemediation);
      },
      async save(input) {
        const w: Row = {};
        if (input.incidentId) w['msftirma_Incident@odata.bind'] = `/msftirma_incidents(${input.incidentId})`;
        if (input.owner) w['msftirma_ActionOwner@odata.bind'] = `/systemusers(${input.owner.id})`;
        if (input.title !== undefined) w.msftirma_name = input.title;
        if (input.description !== undefined) w.msftirma_description = input.description;
        if (input.dueDate !== undefined) w.msftirma_duedate = input.dueDate;
        if (input.status !== undefined) w.msftirma_status = input.status;
        if (input.completedOn !== undefined) w.msftirma_completedon = input.completedOn;
        if (input.id) {
          await Msftirma_remediationactionsService.update(input.id, w as never);
          const after = await Msftirma_remediationactionsService.get(input.id);
          return mapRemediation(after.data as unknown as Row);
        }
        const created = await Msftirma_remediationactionsService.create(w as never);
        return mapRemediation(created.data as unknown as Row);
      },
      async remove(id) {
        await Msftirma_remediationactionsService.delete(id);
      },
    },

    users: {
      async search(query) {
        const q = odata(query);
        const filter = query
          ? `isdisabled eq false and (contains(fullname,'${q}') or contains(internalemailaddress,'${q}'))`
          : 'isdisabled eq false';
        const result = await SystemusersService.getAll({
          select: ['systemuserid', 'fullname', 'internalemailaddress'],
          filter,
          top: 25,
        });
        return rows<Row>(result)
          .map(mapUser)
          .filter((u) => u.name && !u.name.startsWith('#'));
      },
    },

    notifications: {
      async sendReporterFeedback(input) {
        const recipient = input.reporter.email ?? input.reporter.id;
        // Teams "Post a notification to a user" (ADR-0006). DynamicUserNotificationRequest is loose.
        await MicrosoftTeamsService.PostUserNotification({
          recipient,
          messageBody: input.message,
        } as never);
      },
    },

    fieldMetadata: { getField: getFieldMetadata },
  } satisfies AppDataProvider;
}
