import { Badge } from '@/components/ui/Badge';
import type {
  InvestigationStatus,
  SeverityLevel,
  EscalationPath,
} from '@/types/domain-models';
import {
  investigationStatusLabels,
  investigationStatusColor,
  severityShort,
  severityColor,
  escalationLabels,
  escalationTooltip,
} from '@/constants/incident-labels';

export function StatusBadge({ status }: { status: InvestigationStatus }) {
  return (
    <Badge color={investigationStatusColor[status]}>{investigationStatusLabels[status]}</Badge>
  );
}

export function SeverityBadge({ level, size }: { level?: SeverityLevel; size?: 'sm' | 'md' }) {
  if (!level) return <Badge color="subtle" size={size}>—</Badge>;
  return (
    <Badge color={severityColor[level]} size={size} title={`Severity ${level}`}>
      {`L${level} · ${severityShort[level]}`}
    </Badge>
  );
}

export function EscalationBadge({ path }: { path?: EscalationPath }) {
  if (!path) return <Badge color="subtle">—</Badge>;
  return (
    <Badge color="brand" title={escalationTooltip(path)}>
      {escalationLabels[path]}
    </Badge>
  );
}
