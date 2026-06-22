import { tokens, Tooltip } from '@fluentui/react-components';
import type { CSSProperties, ReactNode } from 'react';
import { badgeTokens, type BadgeColor } from '@/constants/incident-labels';

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  size?: 'sm' | 'md';
}

/** Pill badge with a token-derived background/foreground. */
export function Badge({ color, children, title, style, size = 'md' }: BadgeProps) {
  const { bg, fg } = badgeTokens(color);
  const pill = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: bg,
        color: fg,
        borderRadius: tokens.borderRadiusCircular,
        paddingInline: size === 'sm' ? tokens.spacingHorizontalS : tokens.spacingHorizontalM,
        paddingBlock: '2px',
        fontSize: size === 'sm' ? tokens.fontSizeBase100 : tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        lineHeight: tokens.lineHeightBase200,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
  return title ? (
    <Tooltip content={title} relationship="label">
      {pill}
    </Tooltip>
  ) : (
    pill
  );
}
