/**
 * Raw hex values mirroring the CSS theme tokens in src/index.css.
 * Recharts needs literal color strings (it can't read Tailwind classes),
 * so this is the single place chart colors are defined to stay in sync.
 */
export const CHART_COLORS = {
  primary: '#1e3a5f',
  primaryLight: '#3f6f9c',
  secondary: '#475569',
  accent: '#0f766e',
  accentLight: '#6cd7c2',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export const STATUS_BADGE_COLORS = {
  success: { bg: 'bg-success-50', text: 'text-success-600', dot: 'bg-success-500' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', dot: 'bg-warning-500' },
  danger: { bg: 'bg-danger-50', text: 'text-danger-600', dot: 'bg-danger-500' },
  neutral: { bg: 'bg-secondary-100', text: 'text-secondary-600', dot: 'bg-secondary-400' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-700', dot: 'bg-accent-500' },
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500' },
} as const;
