import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Input,
  Textarea,
  Dropdown,
  Option,
  Button,
  Switch,
} from '@fluentui/react-components';
import { ArrowLeft20Regular } from '@fluentui/react-icons';
import { PageHeader, Surface } from '@/components/ui/Page';
import { DataverseFieldLabel, useDataverseFieldRequired } from '@/components/ui/dataverse-field-label';
import { PeoplePicker } from '@/components/incidents/PeoplePicker';
import { toDataverseFieldName } from '@/lib/dataverse-field-name';
import { useSaveIncident } from '@/hooks/useIncidents';
import type { Incident, UserRef } from '@/types/domain-models';
import {
  severityLabels,
  escalationLabels,
  reachedPatientLabels,
  harmObservedLabels,
  ageBandLabels,
  sourceModalityLabels,
} from '@/constants/incident-labels';

const TABLE = 'msftirma_incident';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '760px' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: tokens.spacingHorizontalL },
  field: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalM },
});

export function IncidentNewPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const save = useSaveIncident();

  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [location, setLocation] = useState('');
  const [reporterRole, setReporterRole] = useState('');
  const [reporter, setReporter] = useState<UserRef | undefined>();
  const [eventDateTime, setEventDateTime] = useState('');
  const [sourceModality, setSourceModality] = useState<number | undefined>(3); // Web
  const [ageBand, setAgeBand] = useState<number | undefined>();
  const [reachedPatient, setReachedPatient] = useState<number | undefined>();
  const [harmObserved, setHarmObserved] = useState<number | undefined>();
  const [severityLevel, setSeverityLevel] = useState<number | undefined>();
  const [escalationPath, setEscalationPath] = useState<number | undefined>();
  const [patientInvolved, setPatientInvolved] = useState(true);
  const [wantsFeedback, setWantsFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const narrativeRequired = useDataverseFieldRequired(TABLE, 'msftirma_narrative');

  const submit = async () => {
    setError(null);
    if (narrativeRequired && !narrative.trim()) {
      setError('Narrative is required.');
      return;
    }
    const input: Partial<Incident> = {
      title: title.trim() || narrative.slice(0, 80),
      narrative,
      location: location || undefined,
      reporterRole: reporterRole || undefined,
      reporter,
      eventDateTime: eventDateTime ? new Date(eventDateTime).toISOString() : undefined,
      sourceModality: sourceModality as Incident['sourceModality'],
      ageBand: ageBand as Incident['ageBand'],
      reachedPatient: reachedPatient as Incident['reachedPatient'],
      harmObserved: harmObserved as Incident['harmObserved'],
      severityLevel: severityLevel as Incident['severityLevel'],
      severitySource: severityLevel ? 2 : undefined, // Submitter
      escalationPath: escalationPath as Incident['escalationPath'],
      patientInvolved,
      wantsFeedback,
      status: 2, // Submitted
      investigationStatus: 1, // Submitted
      aiRecommended: false,
      humanConfirmed: true,
      mode: 1,
    };
    const created = await save.mutateAsync(input);
    navigate(`/incidents/${created.id}`);
  };

  return (
    <div>
      <Link to="/incidents" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12, color: tokens.colorBrandForeground1, textDecoration: 'none' }}>
        <ArrowLeft20Regular /> Incidents
      </Link>
      <PageHeader title="New incident" subtitle="Manual entry fallback — the IRMA agent is the primary intake path." />

      <Surface>
        <div className={styles.form}>
          <div className={styles.field}>
            <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName={toDataverseFieldName('name')} fallback="Title" />
            <Input value={title} onChange={(_e, d) => setTitle(d.value)} placeholder="Short summary (optional — derived from narrative if blank)" />
          </div>

          <div className={styles.field}>
            <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_narrative" fallback="Narrative" />
            <Textarea
              value={narrative}
              onChange={(_e, d) => setNarrative(d.value)}
              placeholder="In your own words, what happened?"
              resize="vertical"
              rows={5}
              aria-required={narrativeRequired || undefined}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_eventdatetime" fallback="Event date/time" />
              <Input type="datetime-local" value={eventDateTime} onChange={(_e, d) => setEventDateTime(d.value)} />
            </div>
            <div className={styles.field}>
              <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_location" fallback="Location" />
              <Input value={location} onChange={(_e, d) => setLocation(d.value)} placeholder="Unit / area" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_reporterrole" fallback="Reporter role" />
              <Input value={reporterRole} onChange={(_e, d) => setReporterRole(d.value)} placeholder="RN, MD, Pharmacist…" />
            </div>
            <div className={styles.field}>
              <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName="msftirma_reporter" fallback="Reporter" />
              <PeoplePicker value={reporter} onChange={setReporter} ariaLabel="Reporter" />
            </div>
          </div>

          <div className={styles.row}>
            <SelectField label="Source" field="sourcemodality" value={sourceModality} onChange={setSourceModality} options={sourceModalityLabels} />
            <SelectField label="Age band" field="ageband" value={ageBand} onChange={setAgeBand} options={ageBandLabels} />
          </div>

          <div className={styles.row}>
            <SelectField label="Reached patient" field="reachedpatient" value={reachedPatient} onChange={setReachedPatient} options={reachedPatientLabels} />
            <SelectField label="Harm observed" field="harmobserved" value={harmObserved} onChange={setHarmObserved} options={harmObservedLabels} />
          </div>

          <div className={styles.row}>
            <SelectField label="Severity" field="severitylevel" value={severityLevel} onChange={setSeverityLevel} options={severityLabels} />
            <SelectField label="Escalation path" field="escalationpath" value={escalationPath} onChange={setEscalationPath} options={escalationLabels} />
          </div>

          <div className={styles.row}>
            <Switch checked={patientInvolved} onChange={(_e, d) => setPatientInvolved(d.checked)} label="Patient involved" />
            <Switch checked={wantsFeedback} onChange={(_e, d) => setWantsFeedback(d.checked)} label="Reporter wants feedback" />
          </div>

          {error ? <div style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</div> : null}

          <div className={styles.actions}>
            <Button appearance="primary" onClick={submit} disabled={(narrativeRequired && !narrative.trim()) || save.isPending}>
              {save.isPending ? 'Submitting…' : 'Submit incident'}
            </Button>
            <Button appearance="subtle" onClick={() => navigate('/incidents')}>Cancel</Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function SelectField({
  label,
  field,
  value,
  onChange,
  options,
}: {
  label: string;
  field: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  options: Record<number, string>;
}) {
  const styles = useStyles();
  const logical = toDataverseFieldName(field);
  return (
    <div className={styles.field}>
      <DataverseFieldLabel tableLogicalName={TABLE} fieldLogicalName={logical} fallback={label} />
      <Dropdown
        placeholder="Select…"
        value={value ? options[value] : ''}
        selectedOptions={value ? [String(value)] : []}
        onOptionSelect={(_e, d) => onChange(d.optionValue ? Number(d.optionValue) : undefined)}
        clearable
      >
        {Object.entries(options).map(([val, lbl]) => (
          <Option key={val} value={val}>{lbl}</Option>
        ))}
      </Dropdown>
    </div>
  );
}
