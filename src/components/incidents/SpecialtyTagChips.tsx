import { tokens } from '@fluentui/react-components';
import { Badge } from '@/components/ui/Badge';
import type { IncidentSpecialtyTag } from '@/types/domain-models';
import { tagRoleLabels } from '@/constants/incident-labels';

/** Renders an incident's specialty tags as chips, primary first. */
export function SpecialtyTagChips({
  tags,
  max,
}: {
  tags: IncidentSpecialtyTag[];
  max?: number;
}) {
  const sorted = [...tags].sort((a, b) => (a.role ?? 9) - (b.role ?? 9));
  const shown = max ? sorted.slice(0, max) : sorted;
  const hidden = max ? sorted.length - shown.length : 0;
  if (sorted.length === 0) {
    return <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>;
  }
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {shown.map((t) => (
        <Badge
          key={t.id}
          size="sm"
          color={t.role === 1 ? 'brand' : 'subtle'}
          title={t.role ? `${tagRoleLabels[t.role]}${t.confidence != null ? ` · ${Math.round(t.confidence * 100)}%` : ''}` : undefined}
        >
          {t.tagName ?? t.tagId ?? 'Tag'}
        </Badge>
      ))}
      {hidden > 0 ? <Badge size="sm" color="subtle">{`+${hidden}`}</Badge> : null}
    </span>
  );
}
