import { tokens } from '@fluentui/react-components';
import { Clock16Regular, Warning16Filled, Checkmark16Regular } from '@fluentui/react-icons';
import type { Incident } from '@/types/domain-models';

/**
 * Computes the mandatory-report deadline from the event time + clock hours and
 * renders a countdown / overdue indicator (handoff D13). Returns null when the
 * incident has no external-report requirement.
 */
export function MandatoryReportCountdown({
  incident,
  size = 'md',
}: {
  incident: Pick<Incident, 'extReportRequired' | 'extReportClockHrs' | 'eventDateTime' | 'closedOn'>;
  size?: 'sm' | 'md';
}) {
  if (!incident.extReportRequired || !incident.extReportClockHrs || !incident.eventDateTime) {
    return null;
  }
  const start = new Date(incident.eventDateTime).getTime();
  const deadline = start + incident.extReportClockHrs * 3600_000;
  const now = Date.now();
  const msLeft = deadline - now;
  const hoursLeft = msLeft / 3600_000;

  // If closed, consider the clock satisfied.
  const resolved = Boolean(incident.closedOn);

  let bg: string;
  let fg: string;
  let icon = <Clock16Regular />;
  let text: string;

  if (resolved) {
    bg = tokens.colorPaletteGreenBackground2;
    fg = tokens.colorPaletteGreenForeground2;
    icon = <Checkmark16Regular />;
    text = `Reported within ${incident.extReportClockHrs}h`;
  } else if (msLeft <= 0) {
    bg = tokens.colorPaletteRedBackground2;
    fg = tokens.colorPaletteRedForeground2;
    icon = <Warning16Filled />;
    text = `Overdue ${formatDuration(-msLeft)}`;
  } else if (hoursLeft <= 6) {
    bg = tokens.colorPaletteRedBackground2;
    fg = tokens.colorPaletteRedForeground2;
    icon = <Warning16Filled />;
    text = `${formatDuration(msLeft)} left`;
  } else {
    bg = tokens.colorPaletteYellowBackground2;
    fg = tokens.colorPaletteYellowForeground2;
    text = `${formatDuration(msLeft)} left`;
  }

  return (
    <span
      title={`Mandatory report due ${new Date(deadline).toLocaleString()} (${incident.extReportClockHrs}-hr clock)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: bg,
        color: fg,
        borderRadius: tokens.borderRadiusMedium,
        paddingInline: tokens.spacingHorizontalS,
        paddingBlock: '2px',
        fontSize: size === 'sm' ? tokens.fontSizeBase100 : tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {text}
    </span>
  );
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}
