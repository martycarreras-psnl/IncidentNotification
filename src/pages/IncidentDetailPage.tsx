import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Dropdown,
  Option,
  Textarea,
  Input,
  Divider,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Switch,
  MessageBar,
  MessageBarBody,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  Send20Regular,
  Add20Regular,
  CheckmarkCircle20Filled,
  Delete20Regular,
  Share20Regular,
} from '@fluentui/react-icons';
import { PageHeader, Surface, LoadingState, EmptyState } from '@/components/ui/Page';
import { StatusBadge, SeverityBadge, EscalationBadge } from '@/components/incidents/StatusBadges';
import { SpecialtyTagChips } from '@/components/incidents/SpecialtyTagChips';
import { MandatoryReportCountdown } from '@/components/incidents/MandatoryReportCountdown';
import { PeoplePicker } from '@/components/incidents/PeoplePicker';
import { DataverseFieldLabel, useDataverseFieldRequired } from '@/components/ui/dataverse-field-label';
import {
  useIncident,
  useSaveIncident,
  useIncidentTags,
  useIncidentDetails,
  useIncidentAudits,
  useIncidentActivities,
  useAddActivity,
  useAddAudit,
  useRemediations,
  useSaveRemediation,
  useRemoveRemediation,
  useSendReporterFeedback,
  useRecordShares,
  useGrantShare,
  useRevokeShare,
} from '@/hooks/useIncidents';
import type {
  Incident,
  InvestigationStatus,
  RemediationStatus,
  UserRef,
  AccessRight,
} from '@/types/domain-models';
import {
  investigationStatusLabels,
  investigationStatusOrder,
  reachedPatientLabels,
  harmObservedLabels,
  ageBandLabels,
  sourceModalityLabels,
  provenanceLabels,
  activityTypeLabels,
  remediationStatusLabels,
  sseOutcomeLabels,
} from '@/constants/incident-labels';
import { formatDateTime, relativeTime, formatDate } from '@/utils/format';

const TABLE = 'msftirma_incident';

const useStyles = makeStyles({
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: tokens.spacingHorizontalL, alignItems: 'start' },
  col: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, minWidth: 0 },
  sectionTitle: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase400, marginBottom: tokens.spacingVerticalS, display: 'block' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, alignItems: 'center', marginTop: tokens.spacingVerticalXS },
  factGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: tokens.spacingHorizontalL, marginTop: tokens.spacingVerticalS },
  fact: { display: 'flex', flexDirection: 'column', gap: '2px' },
  factLabel: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.03em' },
  factValue: { fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground1 },
  narrative: { whiteSpace: 'pre-wrap', lineHeight: tokens.lineHeightBase400, marginTop: tokens.spacingVerticalS },
  field: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, marginBottom: tokens.spacingVerticalM },
  detailRow: { display: 'flex', justifyContent: 'space-between', gap: tokens.spacingHorizontalM, paddingBlock: tokens.spacingVerticalXS, borderBottom: `1px solid ${tokens.colorNeutralStroke3}` },
  detailKey: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, fontFamily: tokens.fontFamilyMonospace },
  detailVal: { fontSize: tokens.fontSizeBase300, textAlign: 'right' },
  groupLabel: { fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1, textTransform: 'capitalize', marginTop: tokens.spacingVerticalS },
  timelineItem: { display: 'flex', gap: tokens.spacingHorizontalM, paddingBlock: tokens.spacingVerticalS, borderBottom: `1px solid ${tokens.colorNeutralStroke3}` },
  dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tokens.colorBrandBackground, marginTop: '6px', flexShrink: 0 },
  remRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalS, paddingBlock: tokens.spacingVerticalS, borderBottom: `1px solid ${tokens.colorNeutralStroke3}` },
  muted: { color: tokens.colorNeutralForeground3 },
});

export function IncidentDetailPage() {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: incident, isLoading } = useIncident(id);
  const { data: details } = useIncidentDetails(id);
  const { data: audits } = useIncidentAudits(id);
  const { data: activities } = useIncidentActivities(id);

  if (isLoading) return <LoadingState label="Loading incident…" />;
  if (!incident) {
    return (
      <div>
        <BackLink />
        <Surface><EmptyState title="Incident not found" /></Surface>
      </div>
    );
  }

  const detailGroups = groupDetails(details ?? []);

  return (
    <div>
      <BackLink />
      <PageHeader
        title={incident.title || 'Incident'}
        subtitle={
          <span className={styles.badges}>
            <StatusBadge status={incident.investigationStatus} />
            <SeverityBadge level={incident.severityLevel} />
            <EscalationBadge path={incident.escalationPath} />
            <MandatoryReportCountdown incident={incident} />
          </span>
        }
      />

      <div className={styles.layout}>
        {/* LEFT: facts */}
        <div className={styles.col}>
          <Surface>
            <Text className={styles.sectionTitle}>Narrative</Text>
            <Text className={styles.narrative}>{incident.narrative}</Text>
            <div className={styles.factGrid}>
              <Fact label="Event date/time" value={formatDateTime(incident.eventDateTime)} />
              <Fact label="Location" value={incident.location ?? '—'} />
              <Fact label="Reporter role" value={incident.reporterRole ?? '—'} />
              <Fact label="Source" value={incident.sourceModality ? sourceModalityLabels[incident.sourceModality] : '—'} />
              <Fact label="Age band" value={incident.ageBand ? ageBandLabels[incident.ageBand] : '—'} />
              <Fact label="Reached patient" value={incident.reachedPatient ? reachedPatientLabels[incident.reachedPatient] : '—'} />
              <Fact label="Harm observed" value={incident.harmObserved ? harmObservedLabels[incident.harmObserved] : '—'} />
              <Fact label="Ongoing hazard" value={incident.ongoingHazard ? `Yes${incident.ongoingHazardDetail ? ` — ${incident.ongoingHazardDetail}` : ''}` : 'No'} />
            </div>
            {incident.immediateActions ? (
              <>
                <Divider style={{ marginBlock: tokens.spacingVerticalM }} />
                <Fact label="Immediate actions" value={incident.immediateActions} />
              </>
            ) : null}
          </Surface>

          <SpecialtyTagsSection incidentId={incident.id} />

          {detailGroups.length > 0 ? (
            <Surface>
              <Text className={styles.sectionTitle}>Collected details</Text>
              {detailGroups.map((g) => (
                <div key={g.specialty}>
                  <div className={styles.groupLabel}>{g.specialty}</div>
                  {g.rows.map((r) => (
                    <div key={r.id} className={styles.detailRow}>
                      <span className={styles.detailKey}>{r.fieldId}{r.tier ? ` · T${r.tier}` : ''}</span>
                      <span className={styles.detailVal}>
                        {r.fieldValue ?? '—'}
                        {r.source ? <span className={styles.muted}> · {provenanceLabels[r.source as 1]}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </Surface>
          ) : null}

          {/* Activity timeline */}
          <Surface>
            <Text className={styles.sectionTitle}>Investigation timeline</Text>
            <ActivityComposer incidentId={incident.id} />
            {(activities ?? []).length === 0 ? (
              <Text className={styles.muted} size={200}>No activity yet.</Text>
            ) : (
              (activities ?? []).map((a) => (
                <div key={a.id} className={styles.timelineItem}>
                  <span className={styles.dot} />
                  <div style={{ flex: 1 }}>
                    <Text weight="semibold" size={300}>
                      {a.title || (a.activityType ? activityTypeLabels[a.activityType] : 'Activity')}
                    </Text>
                    {a.note ? <Text block size={200}>{a.note}</Text> : null}
                    <Text className={styles.muted} size={100}>
                      {a.author?.name ? `${a.author.name} · ` : ''}{formatDateTime(a.occurredOn)}
                    </Text>
                  </div>
                </div>
              ))
            )}
          </Surface>

          {/* Audit */}
          <Surface>
            <Text className={styles.sectionTitle}>Audit trail (AI vs human)</Text>
            {(audits ?? []).length === 0 ? (
              <Text className={styles.muted} size={200}>No re-classifications or overrides recorded.</Text>
            ) : (
              (audits ?? []).map((a) => (
                <div key={a.id} className={styles.detailRow}>
                  <span className={styles.detailKey}>{a.path}</span>
                  <span className={styles.detailVal}>
                    <span className={styles.muted}>{a.fromValue ?? '∅'}</span> → {a.toValue ?? '∅'}
                    <span className={styles.muted}> · {a.author?.name ?? 'system'} · {formatDate(a.occurredOn)}</span>
                  </span>
                </div>
              ))
            )}
          </Surface>
        </div>

        {/* RIGHT: investigation panel */}
        <div className={styles.col}>
          <InvestigationPanel incident={incident} />
          <RemediationSection incidentId={incident.id} />
          <ShareSection incidentId={incident.id} />
          <ReporterFeedbackCard incident={incident} />
        </div>
      </div>

      <div style={{ marginTop: tokens.spacingVerticalL }}>
        <Button appearance="subtle" onClick={() => navigate('/incidents')}>Back to list</Button>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/incidents" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12, color: tokens.colorBrandForeground1, textDecoration: 'none' }}>
      <ArrowLeft20Regular /> Incidents
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{value}</span>
    </div>
  );
}

// ── Investigation panel (status, assignment, root cause, SSE, ServiceNow) ──

function InvestigationPanel({ incident }: { incident: Incident }) {
  const styles = useStyles();
  const save = useSaveIncident();
  const addActivity = useAddActivity(incident.id);
  const addAudit = useAddAudit(incident.id);

  const [rootCause, setRootCause] = useState(incident.rootCause ?? '');
  const [serviceNow, setServiceNow] = useState(incident.serviceNowRef ?? '');
  const rootCauseRequired = useDataverseFieldRequired(TABLE, 'msftirma_rootcause');

  // SSE rule (D12): suggest when severity 5 OR external report required.
  const sseSuggested = incident.severityLevel === 5 || Boolean(incident.extReportRequired);

  const advanceStatus = async (next: InvestigationStatus) => {
    if (next === incident.investigationStatus) return;
    const patch: Partial<Incident> = { id: incident.id, investigationStatus: next };
    const nowIso = new Date().toISOString();
    if (next === 2 && !incident.triagedOn) patch.triagedOn = nowIso;
    if (next === 3 && !incident.investigationStartedOn) patch.investigationStartedOn = nowIso;
    if (next === 7) patch.closedOn = nowIso;
    await save.mutateAsync(patch);
    await addActivity.mutateAsync({
      title: `Status → ${investigationStatusLabels[next]}`,
      activityType: 2,
      note: `Advanced from ${investigationStatusLabels[incident.investigationStatus]} to ${investigationStatusLabels[next]}.`,
    });
    await addAudit.mutateAsync({
      path: 'investigationStatus',
      fromValue: investigationStatusLabels[incident.investigationStatus],
      toValue: investigationStatusLabels[next],
    });
  };

  const assign = async (field: 'assignedTo' | 'routingOwner', user: UserRef | undefined) => {
    await save.mutateAsync({ id: incident.id, [field]: user ?? undefined });
    await addActivity.mutateAsync({
      title: field === 'assignedTo' ? 'Assignment' : 'Routing owner set',
      activityType: 3,
      note: user ? `${field === 'assignedTo' ? 'Assigned to' : 'Routing owner'}: ${user.name}` : 'Cleared',
    });
  };

  const saveRootCause = async () => {
    if (rootCauseRequired && !rootCause.trim()) return;
    await save.mutateAsync({ id: incident.id, rootCause });
  };

  const toggleSseReview = async (checked: boolean) => {
    await save.mutateAsync({ id: incident.id, sseReview: checked });
    await addActivity.mutateAsync({ title: checked ? 'SSE track confirmed' : 'SSE track cleared', activityType: 5 });
  };

  const setSseOutcome = async (outcome: number) => {
    await save.mutateAsync({ id: incident.id, sseOutcome: outcome as Incident['sseOutcome'] });
  };

  return (
    <Surface>
      <Text className={styles.sectionTitle}>Investigation</Text>

      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_investigationstatus" fallback="Status" />
        <Dropdown
          value={investigationStatusLabels[incident.investigationStatus]}
          selectedOptions={[String(incident.investigationStatus)]}
          onOptionSelect={(_e, d) => d.optionValue && advanceStatus(Number(d.optionValue) as InvestigationStatus)}
        >
          {investigationStatusOrder.map((s) => (
            <Option key={s} value={String(s)}>{investigationStatusLabels[s]}</Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_assignedto" fallback="Assigned to" />
        <PeoplePicker value={incident.assignedTo} onChange={(u) => assign('assignedTo', u)} ariaLabel="Assigned to" />
      </div>

      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_routingowner" fallback="Routing owner" />
        <PeoplePicker value={incident.routingOwner} onChange={(u) => assign('routingOwner', u)} ariaLabel="Routing owner" />
      </div>

      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_rootcause" fallback="Root cause" />
        <Textarea value={rootCause} onChange={(_e, d) => setRootCause(d.value)} onBlur={saveRootCause} resize="vertical" aria-required={rootCauseRequired || undefined} />
      </div>

      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_servicenowref" fallback="ServiceNow ref" />
        <Input value={serviceNow} onChange={(_e, d) => setServiceNow(d.value)} onBlur={() => save.mutateAsync({ id: incident.id, serviceNowRef: serviceNow })} />
      </div>

      <Divider style={{ marginBlock: tokens.spacingVerticalS }} />

      {sseSuggested ? (
        <MessageBar intent="warning" style={{ marginBottom: tokens.spacingVerticalS }}>
          <MessageBarBody>
            SSE track suggested — {incident.severityLevel === 5 ? 'severity is Sentinel (L5)' : 'mandatory/never-event report flagged'}. A reviewer should confirm.
          </MessageBarBody>
        </MessageBar>
      ) : null}

      <div className={styles.field}>
        <Switch
          checked={Boolean(incident.sseReview)}
          onChange={(_e, d) => toggleSseReview(d.checked)}
          label="SSE Committee track (reviewer confirmed)"
        />
      </div>

      {incident.sseReview ? (
        <div className={styles.field}>
          <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_sseoutcome" fallback="SSE outcome" />
          <Dropdown
            value={incident.sseOutcome ? sseOutcomeLabels[incident.sseOutcome] : ''}
            selectedOptions={incident.sseOutcome ? [String(incident.sseOutcome)] : []}
            onOptionSelect={(_e, d) => d.optionValue && setSseOutcome(Number(d.optionValue))}
          >
            {[1, 2, 3, 4].map((o) => (
              <Option key={o} value={String(o)}>{sseOutcomeLabels[o as 1]}</Option>
            ))}
          </Dropdown>
        </div>
      ) : null}
    </Surface>
  );
}

// ── Specialty tags (editable + audited) ──

function SpecialtyTagsSection({ incidentId }: { incidentId: string }) {
  const styles = useStyles();
  const { data: tags } = useIncidentTags(incidentId);
  return (
    <Surface>
      <Text className={styles.sectionTitle}>Specialty tags</Text>
      <SpecialtyTagChips tags={tags ?? []} />
      <Text className={styles.muted} size={200} block style={{ marginTop: tokens.spacingVerticalS }}>
        Detected by the IRMA agent. Re-classification edits are audited.
      </Text>
    </Surface>
  );
}

// ── Activity composer ──

function ActivityComposer({ incidentId }: { incidentId: string }) {
  const styles = useStyles();
  const add = useAddActivity(incidentId);
  const [note, setNote] = useState('');
  const submit = async () => {
    if (!note.trim()) return;
    await add.mutateAsync({ title: 'Note', activityType: 1, note });
    setNote('');
  };
  return (
    <div className={styles.field}>
      <Textarea value={note} onChange={(_e, d) => setNote(d.value)} placeholder="Add an investigation note…" resize="vertical" />
      <div>
        <Button appearance="primary" size="small" icon={<Add20Regular />} onClick={submit} disabled={!note.trim() || add.isPending}>
          Add note
        </Button>
      </div>
    </div>
  );
}

// ── Remediation actions ──

function RemediationSection({ incidentId }: { incidentId: string }) {
  const styles = useStyles();
  const { data: actions } = useRemediations(incidentId);
  const save = useSaveRemediation(incidentId);
  const remove = useRemoveRemediation(incidentId);
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [owner, setOwner] = useState<UserRef | undefined>();
  const [due, setDue] = useState('');
  const descRequired = useDataverseFieldRequired('msftirma_remediationaction', 'msftirma_description');

  const add = async () => {
    if (!desc.trim()) return;
    await save.mutateAsync({ description: desc, owner, dueDate: due ? new Date(due).toISOString() : undefined, status: 1, title: desc.slice(0, 60) });
    setDesc(''); setOwner(undefined); setDue(''); setAdding(false);
  };

  const cycle = async (id: string, current?: RemediationStatus) => {
    const next = (current === 3 ? 1 : ((current ?? 1) + 1)) as RemediationStatus;
    await save.mutateAsync({ id, status: next, completedOn: next === 3 ? new Date().toISOString() : undefined });
  };

  return (
    <Surface>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>Remediation actions</Text>
        <Button appearance="subtle" size="small" icon={<Add20Regular />} onClick={() => setAdding((v) => !v)}>Add</Button>
      </div>

      {adding ? (
        <div className={styles.field} style={{ marginTop: tokens.spacingVerticalS }}>
          <DataverseFieldLabel tableLogicalName="msftirma_remediationaction" fieldLogicalName="msftirma_description" fallback="Description" />
          <Textarea value={desc} onChange={(_e, d) => setDesc(d.value)} resize="vertical" aria-required={descRequired || undefined} />
          <DataverseFieldLabel tableLogicalName="msftirma_remediationaction" fieldLogicalName="msftirma_actionowner" fallback="Owner" />
          <PeoplePicker value={owner} onChange={setOwner} ariaLabel="Remediation owner" />
          <DataverseFieldLabel tableLogicalName="msftirma_remediationaction" fieldLogicalName="msftirma_duedate" fallback="Due date" />
          <Input type="date" value={due} onChange={(_e, d) => setDue(d.value)} />
          <div>
            <Button appearance="primary" size="small" onClick={add} disabled={(descRequired && !desc.trim()) || save.isPending}>Save action</Button>
          </div>
        </div>
      ) : null}

      {(actions ?? []).length === 0 && !adding ? (
        <Text className={styles.muted} size={200}>No remediation actions yet.</Text>
      ) : (
        (actions ?? []).map((a) => (
          <div key={a.id} className={styles.remRow}>
            <div style={{ minWidth: 0 }}>
              <Text size={300} block style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description}</Text>
              <Text className={styles.muted} size={100}>
                {a.owner?.name ?? 'Unassigned'}{a.dueDate ? ` · due ${formatDate(a.dueDate)}` : ''}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Button
                size="small"
                appearance={a.status === 3 ? 'subtle' : 'outline'}
                icon={a.status === 3 ? <CheckmarkCircle20Filled /> : undefined}
                onClick={() => cycle(a.id, a.status)}
              >
                {a.status ? remediationStatusLabels[a.status] : 'Open'}
              </Button>
              <Button size="small" appearance="subtle" icon={<Delete20Regular />} aria-label="Remove" onClick={() => remove.mutate(a.id)} />
            </div>
          </div>
        ))
      )}
    </Surface>
  );
}

// ── Sharing (native Dataverse record sharing) ──

type ShareLevel = 'read' | 'readwrite' | 'coowner';

const SHARE_LEVELS: Record<ShareLevel, { label: string; access: AccessRight[] }> = {
  read: { label: 'Read', access: ['ReadAccess'] },
  readwrite: { label: 'Read & Write', access: ['ReadAccess', 'WriteAccess', 'AppendToAccess'] },
  coowner: {
    label: 'Co-owner (read, write, share, assign, delete)',
    access: ['ReadAccess', 'WriteAccess', 'AppendAccess', 'AppendToAccess', 'ShareAccess', 'AssignAccess', 'DeleteAccess'],
  },
};

const ACCESS_LABELS: Record<AccessRight, string> = {
  ReadAccess: 'Read',
  WriteAccess: 'Write',
  AppendAccess: 'Append',
  AppendToAccess: 'Append To',
  CreateAccess: 'Create',
  DeleteAccess: 'Delete',
  ShareAccess: 'Share',
  AssignAccess: 'Assign',
};

function describeAccess(access: AccessRight[]): string {
  return access.map((a) => ACCESS_LABELS[a] ?? a).join(', ') || 'No access';
}

function ShareSection({ incidentId }: { incidentId: string }) {
  const styles = useStyles();
  const { data: shares, isLoading } = useRecordShares(incidentId);
  const grant = useGrantShare(incidentId);
  const revoke = useRevokeShare(incidentId);
  const [user, setUser] = useState<UserRef | undefined>();
  const [level, setLevel] = useState<ShareLevel>('readwrite');

  const sharedIds = new Set((shares ?? []).map((s) => s.principal.id));
  const alreadyShared = Boolean(user && sharedIds.has(user.id));

  const share = async () => {
    if (!user || alreadyShared) return;
    await grant.mutateAsync({ principalId: user.id, access: SHARE_LEVELS[level].access });
    setUser(undefined);
  };

  const count = shares?.length ?? 0;

  return (
    <Surface>
      <Accordion collapsible defaultOpenItems={['share']}>
        <AccordionItem value="share">
          <AccordionHeader icon={<Share20Regular />}>
            <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              Sharing{count > 0 ? ` (${count})` : ''}
            </Text>
          </AccordionHeader>
          <AccordionPanel>
            <Text className={styles.muted} size={200} block style={{ marginTop: tokens.spacingVerticalXS }}>
              Share this incident with any user via Dataverse record sharing.
            </Text>

            <div className={styles.field} style={{ marginTop: tokens.spacingVerticalS }}>
              <DataverseFieldLabel fallback="Share with" />
              <PeoplePicker
                value={user}
                onChange={setUser}
                ariaLabel="Share with"
                placeholder="Search people to share with…"
              />
              <DataverseFieldLabel fallback="Access level" />
              <Dropdown
                aria-label="Access level"
                value={SHARE_LEVELS[level].label}
                selectedOptions={[level]}
                onOptionSelect={(_e, d) => d.optionValue && setLevel(d.optionValue as ShareLevel)}
              >
                {(Object.keys(SHARE_LEVELS) as ShareLevel[]).map((k) => (
                  <Option key={k} value={k}>{SHARE_LEVELS[k].label}</Option>
                ))}
              </Dropdown>
              <div>
                <Button
                  appearance="primary"
                  size="small"
                  icon={<Share20Regular />}
                  onClick={share}
                  disabled={!user || alreadyShared || grant.isPending}
                >
                  Share
                </Button>
              </div>
              {alreadyShared ? (
                <Text className={styles.muted} size={200}>Already shared with {user?.name}.</Text>
              ) : null}
            </div>

            <Divider style={{ marginBlock: tokens.spacingVerticalS }} />

            <span className={styles.factLabel}>Shared with</span>
            {isLoading ? (
              <Spinner size="tiny" label="Loading shares…" style={{ marginTop: tokens.spacingVerticalS }} />
            ) : count === 0 ? (
              <Text className={styles.muted} size={200} block style={{ marginTop: tokens.spacingVerticalXS }}>
                Not shared with anyone yet.
              </Text>
            ) : (
              (shares ?? []).map((s) => (
                <div key={s.principal.id} className={styles.remRow}>
                  <div style={{ minWidth: 0 }}>
                    <Text size={300} block style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.principal.name}
                    </Text>
                    <Text className={styles.muted} size={100}>{describeAccess(s.access)}</Text>
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete20Regular />}
                    aria-label={`Remove ${s.principal.name}`}
                    onClick={() => revoke.mutate(s.principal.id)}
                    disabled={revoke.isPending}
                  />
                </div>
              ))
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Surface>
  );
}

// ── Reporter feedback (close the loop — Teams) ──

function ReporterFeedbackCard({ incident }: { incident: Incident }) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const save = useSaveIncident();
  const send = useSendReporterFeedback();
  const addActivity = useAddActivity(incident.id);

  const canSend = Boolean(incident.reporter);

  const submit = async () => {
    if (!incident.reporter || !message.trim()) return;
    await send.mutateAsync({ incidentId: incident.id, reporter: incident.reporter, message });
    const nowIso = new Date().toISOString();
    await save.mutateAsync({ id: incident.id, reporterFeedbackSent: true, reporterFeedbackText: message, feedbackSentOn: nowIso });
    await addActivity.mutateAsync({ title: 'Reporter feedback sent', activityType: 4, note: 'Close-the-loop message sent via Teams.' });
    setOpen(false);
    setMessage('');
  };

  return (
    <Surface>
      <Text className={styles.sectionTitle}>Close the loop</Text>
      <div className={styles.field}>
        <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_reporter" fallback="Reporter" />
        <Text size={300}>{incident.reporter?.name ?? <span className={styles.muted}>Not identified</span>}</Text>
        {incident.reporterRole ? <Text className={styles.muted} size={200}>{incident.reporterRole}</Text> : null}
      </div>

      {incident.reporterFeedbackSent ? (
        <MessageBar intent="success">
          <MessageBarBody>
            Feedback sent {incident.feedbackSentOn ? relativeTime(incident.feedbackSentOn) : ''}.
          </MessageBarBody>
        </MessageBar>
      ) : (
        <Button appearance="primary" icon={<Send20Regular />} disabled={!canSend} onClick={() => setOpen(true)}>
          Send feedback to reporter
        </Button>
      )}
      {!canSend ? (
        <Text className={styles.muted} size={200} block style={{ marginTop: tokens.spacingVerticalXS }}>
          A reporter must be identified to close the loop.
        </Text>
      ) : null}

      <Dialog open={open} onOpenChange={(_e, d) => setOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Send feedback to {incident.reporter?.name}</DialogTitle>
            <DialogContent>
              <DataverseFieldLabel required fallback="Message" />
              <Textarea
                value={message}
                onChange={(_e, d) => setMessage(d.value)}
                placeholder="Thank you for reporting. Here's what we changed as a result…"
                resize="vertical"
                style={{ width: '100%', marginTop: 6 }}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" icon={<Send20Regular />} onClick={submit} disabled={!message.trim() || send.isPending}>
                Send via Teams
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Surface>
  );
}

// ── helpers ──

function groupDetails(details: { id: string; fieldId: string; fieldValue?: string; specialty?: string; tier?: number; source?: number }[]) {
  const map = new Map<string, typeof details>();
  for (const d of details) {
    const key = d.specialty || 'core';
    const arr = map.get(key) ?? [];
    arr.push(d);
    map.set(key, arr);
  }
  return [...map.entries()].map(([specialty, rows]) => ({ specialty, rows }));
}
