import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { makeStyles, tokens, Avatar, Text } from '@fluentui/react-components';
import {
  Board24Regular,
  DocumentBulletList24Regular,
  Add24Regular,
  ShieldTask24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import { brand } from '@/constants/brand';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: '248px 1fr',
    gridTemplateRows: '60px 1fr',
    gridTemplateAreas: `'header header' 'sidebar content'`,
    height: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    gridArea: 'header',
    backgroundColor: brand.navy,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: tokens.spacingHorizontalL,
    gap: tokens.spacingHorizontalM,
  },
  brandBox: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM },
  brandIcon: {
    width: '34px',
    height: '34px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: brand.blue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  brandText: { display: 'flex', flexDirection: 'column', lineHeight: 1.1 },
  brandTitle: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase400, color: '#fff' },
  brandSub: { fontSize: tokens.fontSizeBase100, color: 'rgba(255,255,255,0.7)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM },
  sidebar: {
    gridArea: 'sidebar',
    backgroundColor: brand.sidebarBg,
    borderRight: `1px solid ${brand.border}`,
    paddingBlock: tokens.spacingVerticalL,
    paddingInline: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    overflowY: 'auto',
  },
  navSection: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXS,
    paddingInline: tokens.spacingHorizontalS,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingInline: tokens.spacingHorizontalM,
    paddingBlock: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase300,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground2 },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: brand.blue,
    fontWeight: tokens.fontWeightSemibold,
  },
  content: {
    gridArea: 'content',
    backgroundColor: brand.contentBg,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalXXL,
    boxSizing: 'border-box',
  },
});

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: <Board24Regular /> }],
  },
  {
    title: 'Incidents',
    items: [
      { to: '/incidents', label: 'All Incidents', icon: <DocumentBulletList24Regular />, end: true },
      { to: '/incidents/new', label: 'New Incident', icon: <Add24Regular /> },
    ],
  },
  {
    title: 'Reference',
    items: [{ to: '/specialties', label: 'Specialty Tags', icon: <Tag24Regular /> }],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const location = useLocation();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brandBox}>
          <div className={styles.brandIcon}>
            <ShieldTask24Regular color="#fff" />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>IRMA</span>
            <span className={styles.brandSub}>Incident Report Management · Children's Healthcare of Atlanta</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: tokens.fontSizeBase200 }}>Safety Team</Text>
          <Avatar name="Safety Team" color="colorful" size={32} />
        </div>
      </header>

      <nav className={styles.sidebar} aria-label="Primary">
        {sections.map((section) => (
          <div key={section.title}>
            <div className={styles.navSection}>{section.title}</div>
            {section.items.map((item) => {
              const active =
                item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
