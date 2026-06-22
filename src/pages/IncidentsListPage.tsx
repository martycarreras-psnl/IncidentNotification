import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Input,
  Dropdown,
  Option,
  Button,
  Text,
  Spinner,
} from '@fluentui/react-components';
import { Add24Regular, Search24Regular, Dismiss20Regular, ArrowSortRegular, ArrowSortUp20Regular, ArrowSortDown20Regular } from '@fluentui/react-icons';
import { PageHeader, Surface, EmptyState } from '@/components/ui/Page';
import { StatusBadge, SeverityBadge, EscalationBadge } from '@/components/incidents/StatusBadges';
import { SpecialtyTagChips } from '@/components/incidents/SpecialtyTagChips';
import { MandatoryReportCountdown } from '@/components/incidents/MandatoryReportCountdown';
import { useIncidents, useAllTags, useSpecialties } from '@/hooks/useIncidents';
import type { IncidentListFilter } from '@/services/data-contracts';
import type { IncidentSpecialtyTag } from '@/types/domain-models';
import { formatDate } from '@/utils/format';
import { sortIncidents, type IncidentSortKey, type SortDir } from '@/utils/incident-sort';
import {
  investigationStatusLabels,
  investigationStatusOrder,
  severityLabels,
  escalationLabels,
} from '@/constants/incident-labels';

const useStyles = makeStyles({
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-end',
    marginBottom: tokens.spacingVerticalL,
  },
  field: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, minWidth: '150px' },
  fieldLabel: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  search: { minWidth: '260px', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': { color: tokens.colorNeutralForeground1 },
  },
  thSorted: {
    color: tokens.colorBrandForeground1,
  },
  thInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  sortIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  td: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    fontSize: tokens.fontSizeBase300,
    verticalAlign: 'middle',
  },
  row: { cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground2 } },
  titleCell: { maxWidth: '320px' },
  titleText: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  meta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  count: { color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalS },
});

export function IncidentsListPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<number | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [escalation, setEscalation] = useState<number | undefined>();
  const [specialtyId, setSpecialtyId] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  // Default sort: most recently created first.
  const [sort, setSort] = useState<{ key: IncidentSortKey; dir: SortDir }>({ key: 'created', dir: 'desc' });

  const toggleSort = (key: IncidentSortKey) =>
    setSort((cur) =>
      cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );

  const filter: IncidentListFilter = useMemo(
    () => ({
      search: search || undefined,
      severity,
      investigationStatus: status,
      escalationPath: escalation,
      fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
      toDate: toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined,
    }),
    [search, severity, status, escalation, fromDate, toDate],
  );

  const { data: incidents, isLoading } = useIncidents(filter);
  const { data: allTags } = useAllTags();
  const { data: specialties } = useSpecialties();

  const tagsByIncident = useMemo(() => {
    const map = new Map<string, IncidentSpecialtyTag[]>();
    for (const t of allTags ?? []) {
      const arr = map.get(t.incidentId) ?? [];
      arr.push(t);
      map.set(t.incidentId, arr);
    }
    return map;
  }, [allTags]);

  // Specialty filter is client-side (tag is a child table), then sort.
  const rows = useMemo(() => {
    let list = incidents ?? [];
    if (specialtyId) {
      const matching = new Set(
        (allTags ?? []).filter((t) => t.tagId === specialtyId).map((t) => t.incidentId),
      );
      list = list.filter((i) => matching.has(i.id));
    }
    const sorted = sortIncidents(list, sort.key, sort.dir);
    return sorted;
  }, [incidents, allTags, specialtyId, sort]);

  const hasFilters =
    search || severity || status || escalation || specialtyId || fromDate || toDate;

  const clear = () => {
    setSearch('');
    setSeverity(undefined);
    setStatus(undefined);
    setEscalation(undefined);
    setSpecialtyId(undefined);
    setFromDate('');
    setToDate('');
  };

  return (
    <div>
      <PageHeader
        title="Incidents"
        subtitle="All safety-incident submissions and their investigation status."
        actions={
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => navigate('/incidents/new')}>
            New incident
          </Button>
        }
      />

      <div className={styles.filterBar}>
        <div className={`${styles.field} ${styles.search}`}>
          <span className={styles.fieldLabel}>Search narrative</span>
          <Input
            value={search}
            onChange={(_e, d) => setSearch(d.value)}
            contentBefore={<Search24Regular />}
            placeholder="Search incident stories…"
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Specialty</span>
          <Dropdown
            placeholder="Any"
            selectedOptions={specialtyId ? [specialtyId] : []}
            value={specialties?.find((s) => s.id === specialtyId)?.name ?? ''}
            onOptionSelect={(_e, d) => setSpecialtyId(d.optionValue || undefined)}
          >
            <Option value="">Any</Option>
            {(specialties ?? []).map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Severity</span>
          <Dropdown
            placeholder="Any"
            selectedOptions={severity ? [String(severity)] : []}
            value={severity ? severityLabels[severity as 1] : ''}
            onOptionSelect={(_e, d) => setSeverity(d.optionValue ? Number(d.optionValue) : undefined)}
          >
            <Option value="">Any</Option>
            {[1, 2, 3, 4, 5].map((s) => (
              <Option key={s} value={String(s)}>
                {severityLabels[s as 1]}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <Dropdown
            placeholder="Any"
            selectedOptions={status ? [String(status)] : []}
            value={status ? investigationStatusLabels[status as 1] : ''}
            onOptionSelect={(_e, d) => setStatus(d.optionValue ? Number(d.optionValue) : undefined)}
          >
            <Option value="">Any</Option>
            {investigationStatusOrder.map((s) => (
              <Option key={s} value={String(s)}>
                {investigationStatusLabels[s]}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Escalation</span>
          <Dropdown
            placeholder="Any"
            selectedOptions={escalation ? [String(escalation)] : []}
            value={escalation ? escalationLabels[escalation as 1] : ''}
            onOptionSelect={(_e, d) => setEscalation(d.optionValue ? Number(d.optionValue) : undefined)}
          >
            <Option value="">Any</Option>
            {[1, 2, 3, 4, 5].map((s) => (
              <Option key={s} value={String(s)}>
                {escalationLabels[s as 1]}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>From</span>
          <Input type="date" value={fromDate} onChange={(_e, d) => setFromDate(d.value)} />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>To</span>
          <Input type="date" value={toDate} onChange={(_e, d) => setToDate(d.value)} />
        </div>

        {hasFilters ? (
          <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner label="Loading incidents…" />
        </div>
      ) : rows.length === 0 ? (
        <Surface>
          <EmptyState
            title={hasFilters ? 'No incidents match these filters' : 'No incidents yet'}
            hint={hasFilters ? 'Try clearing some filters.' : 'Incidents from the IRMA agent will appear here.'}
          />
        </Surface>
      ) : (
        <Surface padded={false}>
          <Text className={styles.count} size={200} style={{ display: 'block', padding: tokens.spacingHorizontalM }}>
            {rows.length} incident{rows.length === 1 ? '' : 's'}
            {sort.key === 'created' ? ` · newest first${sort.dir === 'asc' ? ' (oldest)' : ''}` : ''}
          </Text>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortableTh label="Incident" sortKey="title" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
                <th className={styles.th}>Specialty</th>
                <SortableTh label="Severity" sortKey="severity" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
                <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
                <SortableTh label="Esc." sortKey="escalation" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
                <SortableTh label="Mandatory report" sortKey="mandatory" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
                <SortableTh label="Event date" sortKey="event" sort={sort} onSort={toggleSort} className={styles.th} sortableClassName={styles.thSortable} sortedClassName={styles.thSorted} innerClassName={styles.thInner} iconClassName={styles.sortIcon} />
              </tr>
            </thead>
            <tbody>
              {rows.map((inc) => (
                <tr key={inc.id} className={styles.row} onClick={() => navigate(`/incidents/${inc.id}`)}>
                  <td className={`${styles.td} ${styles.titleCell}`}>
                    <div className={styles.titleText}>{inc.title || inc.narrative}</div>
                    <div className={styles.meta}>{inc.location ?? '—'}</div>
                  </td>
                  <td className={styles.td}>
                    <SpecialtyTagChips tags={tagsByIncident.get(inc.id) ?? []} max={3} />
                  </td>
                  <td className={styles.td}>
                    <SeverityBadge level={inc.severityLevel} size="sm" />
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={inc.investigationStatus} />
                  </td>
                  <td className={styles.td}>
                    <EscalationBadge path={inc.escalationPath} />
                  </td>
                  <td className={styles.td}>
                    <MandatoryReportCountdown incident={inc} size="sm" /> {!inc.extReportRequired ? <span className={styles.meta}>—</span> : null}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.meta}>{formatDate(inc.eventDateTime)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </div>
  );
}

// ── sorting ──

function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
  className,
  sortableClassName,
  sortedClassName,
  innerClassName,
  iconClassName,
}: {
  label: string;
  sortKey: IncidentSortKey;
  sort: { key: IncidentSortKey; dir: SortDir };
  onSort: (key: IncidentSortKey) => void;
  className: string;
  sortableClassName: string;
  sortedClassName: string;
  innerClassName: string;
  iconClassName: string;
}) {
  const active = sort.key === sortKey;
  const icon = !active ? (
    <ArrowSortRegular className={iconClassName} />
  ) : sort.dir === 'asc' ? (
    <ArrowSortUp20Regular className={iconClassName} />
  ) : (
    <ArrowSortDown20Regular className={iconClassName} />
  );
  return (
    <th
      className={`${className} ${sortableClassName} ${active ? sortedClassName : ''}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      role="columnheader"
    >
      <span className={innerClassName}>
        {label}
        {icon}
      </span>
    </th>
  );
}
