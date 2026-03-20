import { StyleSheet } from 'react-native';

export const C = {
  bg:         '#07111C',
  bgCard:     '#0D1E2E',
  bgCard2:    '#112030',
  cyan:       '#00C2D1',
  cyanDim:    'rgba(0,194,209,0.12)',
  cyanGlow:   'rgba(0,194,209,0.25)',
  green:      '#1CE8B5',
  greenDim:   'rgba(28,232,181,0.12)',
  amber:      '#F4B942',
  amberDim:   'rgba(244,185,66,0.12)',
  red:        '#FF5C72',
  redDim:     'rgba(255,92,114,0.15)',
  t1:         '#F0F4F8',
  t2:         '#8DA3B5',
  t3:         '#4A6070',
  border:     'rgba(0,194,209,0.15)',
  borderSub:  'rgba(255,255,255,0.06)',
};

export const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: C.cyan,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#07111C',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.cyanGlow,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: C.cyan,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderSub,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: C.t1,
    fontSize: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.t2,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.t1,
  },
  headingLg: {
    fontSize: 28,
    fontWeight: '800',
    color: C.t1,
    lineHeight: 34,
  },
  headingMd: {
    fontSize: 22,
    fontWeight: '800',
    color: C.t1,
  },
  body: {
    fontSize: 14,
    color: C.t2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
