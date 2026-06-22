import type { ReactNode } from 'react';
import { Title2, Text, tokens, Spinner } from '@fluentui/react-components';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalL,
        marginBottom: tokens.spacingVerticalL,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Title2 as="h1" block>
          {title}
        </Title2>
        {subtitle ? (
          <Text style={{ color: tokens.colorNeutralForeground2 }}>{subtitle}</Text>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>{actions}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXXL }}>
      <Spinner label={label} />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: tokens.spacingVerticalXXXL,
        color: tokens.colorNeutralForeground3,
      }}
    >
      <Text block weight="semibold" size={400} style={{ marginBottom: tokens.spacingVerticalXS }}>
        {title}
      </Text>
      {hint ? <Text size={200}>{hint}</Text> : null}
    </div>
  );
}

export function Surface({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusLarge,
        padding: padded ? tokens.spacingHorizontalL : 0,
        boxShadow: tokens.shadow2,
      }}
    >
      {children}
    </div>
  );
}
