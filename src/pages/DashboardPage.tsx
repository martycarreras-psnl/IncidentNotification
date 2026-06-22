import { useMemo } from 'react';
import { makeStyles, tokens, Text, Spinner } from '@fluentui/react-components';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { PageHeader, Surface } from '@/components/ui/Page';
import { useIncidents, useAllTags } from '@/hooks/useIncidents';
import { brand } from '@/constants/brand';
import {
  severityShort,
  investigationStatusLabels,
  badgeTokens,
} from '@/constants/incident-labels';
import type { Incident, SeverityLevel } from '@/types/domain-models';
import { daysBetween } from '@/utils/format';

const useStyles = makeStyles({
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
  },
  stat: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    boxShadow: tokens.shadow2,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontWeight: tokens.fontWeightSemibold,
  },
  statValue: { fontSize: '32px', fontWeight: tokens.fontWeightBold, lineHeight: 1.1, marginTop: tokens.spacingVerticalXS },
  statHint: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  chartTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    marginBottom: tokens.spacingVerticalM,
    display: 'block',
  },
});

const SEVERITY_HEX: Record<SeverityLevel, string> = {
  1: '#107c41',
  2: '#2f6fed',
  3: '#c19c00',
  4: '#d83b01',
  5: '#a4262c',
};

export function DashboardPage() {
  const styles = useStyles();
  const { data: incidents, isLoading } = useIncidents();
  const { data: allTags } = useAllTags();

  const m = useMemo(() => computeMetrics(incidents ?? [], allTags ?? []), [incidents, allTags]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Safety Dashboard"
        subtitle="Trends across incident volume, investigation status, remediation pace, severity, specialty, and serious safety events."
      />

      {/* Stat cards */}
      <div className={styles.statRow}>
        <Stat label="Total incidents" value={m.total} hint="In the system" />
        <Stat label="Open" value={m.open} hint={`${m.closed} closed`} />
        <Stat label="Sentinel / SSE (L5)" value={m.sseCount} hint="Severity level 5" valueColor={SEVERITY_HEX[5]} />
        <Stat label="Mandatory reports" value={m.mandatory} hint="Externally reportable" />
        <Stat label="Avg. time to close" value={m.avgDaysToClose != null ? `${m.avgDaysToClose}d` : '—'} hint="Closed incidents" />
      </div>

      <div className={styles.grid}>
        {/* 1. Submission volume over time */}
        <Surface>
          <Text className={styles.chartTitle}>Submission volume over time</Text>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={m.volume} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RTooltip />
              <Line type="monotone" dataKey="count" name="Incidents" stroke={brand.blue} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Surface>

        {/* 2. Status distribution */}
        <Surface>
          <Text className={styles.chartTitle}>Investigation status distribution</Text>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={m.statusDist}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e) => `${e.count}`}
              >
                {m.statusDist.map((entry) => (
                  <Cell key={entry.value} fill={statusHex(entry.value)} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Surface>

        {/* 3. Remediation pace (aging buckets for open incidents) */}
        <Surface>
          <Text className={styles.chartTitle}>Remediation pace — open incident aging</Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={m.aging} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke3} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RTooltip />
              <Bar dataKey="count" name="Open incidents" fill={brand.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Surface>

        {/* 4. Severity Pareto */}
        <Surface>
          <Text className={styles.chartTitle}>Severity Pareto</Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={m.severityPareto} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RTooltip />
              <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                {m.severityPareto.map((entry) => (
                  <Cell key={entry.level} fill={SEVERITY_HEX[entry.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Surface>

        {/* 5. Specialty-tag Pareto */}
        <Surface>
          <Text className={styles.chartTitle}>Specialty-tag Pareto (top 10)</Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={m.specialtyPareto} layout="vertical" margin={{ left: 40, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke3} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Bar dataKey="count" name="Tagged incidents" fill={brand.navy} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Surface>

        {/* 6. SSE counts & trend */}
        <Surface>
          <Text className={styles.chartTitle}>Serious Safety Events (SSE) trend</Text>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={m.sseTrend} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RTooltip />
              <Line type="monotone" dataKey="count" name="SSE (L5)" stroke={SEVERITY_HEX[5]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Surface>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, valueColor }: { label: string; value: number | string; hint?: string; valueColor?: string }) {
  const styles = useStyles();
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {hint ? <div className={styles.statHint}>{hint}</div> : null}
    </div>
  );
}

function statusHex(status: number): string {
  const { fg } = badgeTokens(
    status === 7 ? 'success' : status === 5 ? 'danger' : status === 6 ? 'severe' : status === 4 ? 'warning' : 'brand',
  );
  return fg;
}

function monthKey(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function computeMetrics(incidents: Incident[], tags: { incidentId: string; tagName?: string; role?: number }[]) {
  const total = incidents.length;
  const closed = incidents.filter((i) => i.investigationStatus === 7).length;
  const open = total - closed;
  const sseCount = incidents.filter((i) => i.severityLevel === 5).length;
  const mandatory = incidents.filter((i) => i.extReportRequired).length;

  // Avg days to close
  const closeDurations = incidents
    .filter((i) => i.investigationStatus === 7)
    .map((i) => daysBetween(i.eventDateTime ?? i.createdOn, i.closedOn))
    .filter((d): d is number => d != null && d >= 0);
  const avgDaysToClose = closeDurations.length
    ? Math.round(closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length)
    : null;

  // 1. Volume over time
  const volMap = new Map<string, number>();
  for (const i of incidents) {
    const k = monthKey(i.eventDateTime ?? i.createdOn);
    if (k) volMap.set(k, (volMap.get(k) ?? 0) + 1);
  }
  const volume = [...volMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // 2. Status distribution
  const statusMap = new Map<number, number>();
  for (const i of incidents) statusMap.set(i.investigationStatus, (statusMap.get(i.investigationStatus) ?? 0) + 1);
  const statusDist = [...statusMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([value, count]) => ({ value, label: investigationStatusLabels[value as 1], count }));

  // 3. Aging buckets (open only, by days since event)
  const buckets = [
    { bucket: '0–3d', min: 0, max: 3 },
    { bucket: '4–7d', min: 4, max: 7 },
    { bucket: '8–14d', min: 8, max: 14 },
    { bucket: '15–30d', min: 15, max: 30 },
    { bucket: '30d+', min: 31, max: Infinity },
  ];
  const aging = buckets.map((b) => ({ bucket: b.bucket, count: 0 }));
  for (const i of incidents) {
    if (i.investigationStatus === 7) continue;
    const age = daysBetween(i.eventDateTime ?? i.createdOn, new Date().toISOString());
    if (age == null) continue;
    const idx = buckets.findIndex((b) => age >= b.min && age <= b.max);
    if (idx >= 0) aging[idx].count += 1;
  }

  // 4. Severity Pareto
  const sevMap = new Map<SeverityLevel, number>();
  for (const i of incidents) if (i.severityLevel) sevMap.set(i.severityLevel, (sevMap.get(i.severityLevel) ?? 0) + 1);
  const severityPareto = ([1, 2, 3, 4, 5] as SeverityLevel[])
    .map((level) => ({ level, label: severityShort[level], count: sevMap.get(level) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // 5. Specialty Pareto (count distinct incidents per tag)
  const specMap = new Map<string, Set<string>>();
  for (const t of tags) {
    const name = t.tagName ?? 'Unknown';
    const set = specMap.get(name) ?? new Set<string>();
    set.add(t.incidentId);
    specMap.set(name, set);
  }
  const specialtyPareto = [...specMap.entries()]
    .map(([name, set]) => ({ name, count: set.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 6. SSE trend (L5 by month)
  const sseMap = new Map<string, number>();
  for (const i of incidents) {
    if (i.severityLevel !== 5) continue;
    const k = monthKey(i.eventDateTime ?? i.createdOn);
    if (k) sseMap.set(k, (sseMap.get(k) ?? 0) + 1);
  }
  const sseTrend = volume.map((v) => ({ month: v.month, count: sseMap.get(v.month) ?? 0 }));

  return {
    total,
    open,
    closed,
    sseCount,
    mandatory,
    avgDaysToClose,
    volume,
    statusDist,
    aging,
    severityPareto,
    specialtyPareto,
    sseTrend,
  };
}
