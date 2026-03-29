import { Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export const Colors = {
  bgPrimary:    '#0B1C2C',
  bgSecondary:  '#0d2035',
  bgCard:       '#102538',
  bgElevated:   '#152d42',
  bgInput:      '#0e2236',
  accent:       '#00C2D1',
  accentDim:    'rgba(0,194,209,0.12)',
  accentGlow:   'rgba(0,194,209,0.25)',
  accent2:      '#0072ff',
  textPrimary:  '#e4f0fb',
  textSecondary:'#7ea5c4',
  textMuted:    '#3f647e',
  border:       'rgba(0,194,209,0.15)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  success:      '#00d68f',
  successDim:   'rgba(0,214,143,0.12)',
  warning:      '#ffb020',
  warningDim:   'rgba(255,176,32,0.12)',
  danger:       '#ff4d6d',
  dangerDim:    'rgba(255,77,109,0.12)',
  white:        '#ffffff',
  whatsapp:     '#25D366',
} as const;

export const Sp = {
  xs:  4,  sm:  8,  md: 12,
  lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

export const R = {
  xs: 6, sm: 10, md: 14,
  lg: 18, xl: 24, full: 999,
} as const;

export const Fs = {
  xs: 10, sm: 12, md: 14,
  lg: 16, xl: 18, xxl: 22,
  xxxl: 28, display: 34,
} as const;

export const Screen = { W, H };
