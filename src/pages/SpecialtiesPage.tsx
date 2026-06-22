import { makeStyles, tokens, Spinner } from '@fluentui/react-components';
import { PageHeader, Surface, EmptyState } from '@/components/ui/Page';
import { Badge } from '@/components/ui/Badge';
import { useSpecialties } from '@/hooks/useIncidents';
import { reportableLabels, escalationLabels } from '@/constants/incident-labels';
import type { ReportableStatus } from '@/types/domain-models';

const useStyles = makeStyles({
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
  },
  td: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    fontSize: tokens.fontSizeBase300,
  },
  name: { fontWeight: tokens.fontWeightSemibold },
  meta: { color: tokens.colorNeutralForeground3 },
});

const reportableColor: Record<ReportableStatus, 'success' | 'warning' | 'danger'> = {
  1: 'success',
  2: 'warning',
  3: 'danger',
};

export function SpecialtiesPage() {
  const styles = useStyles();
  const { data: specialties, isLoading } = useSpecialties();

  return (
    <div>
      <PageHeader
        title="Specialty Tags"
        subtitle="The 32 routing-taxonomy specialty tags — owner, reportable flag, and suggested escalation path."
      />
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner label="Loading specialties…" />
        </div>
      ) : !specialties || specialties.length === 0 ? (
        <Surface>
          <EmptyState title="No specialties found" />
        </Surface>
      ) : (
        <Surface padded={false}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Specialty</th>
                <th className={styles.th}>Owning team</th>
                <th className={styles.th}>Reportable</th>
                <th className={styles.th}>Suggested path</th>
                <th className={styles.th}>Teams channel</th>
              </tr>
            </thead>
            <tbody>
              {specialties.map((s) => (
                <tr key={s.id}>
                  <td className={styles.td}>
                    <div className={styles.name}>{s.name}</div>
                    <div className={styles.meta} style={{ fontSize: tokens.fontSizeBase200 }}>
                      {s.domain}
                    </div>
                  </td>
                  <td className={styles.td}>{s.owningTeam ?? '—'}</td>
                  <td className={styles.td}>
                    {s.reportable ? (
                      <Badge color={reportableColor[s.reportable]} size="sm">
                        {reportableLabels[s.reportable]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={styles.td}>{s.suggestedPath ? escalationLabels[s.suggestedPath] : '—'}</td>
                  <td className={`${styles.td} ${styles.meta}`}>{s.teamsChannel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </div>
  );
}
