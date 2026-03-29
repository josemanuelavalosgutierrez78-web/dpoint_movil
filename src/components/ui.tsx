import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
  TextInputProps, TouchableOpacityProps,
} from 'react-native';
import { Colors, Sp, R, Fs } from '@/constants/theme';

// ── Button ────────────────────────────────────────────────────────────────
interface BtnProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}
export const Button: React.FC<BtnProps> = ({
  label, variant = 'primary', size = 'md', loading, leftIcon,
  fullWidth, disabled, style, ...rest
}) => {
  const off = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!!off}
      style={[
        s.btn,
        size === 'sm' && s.btnSm, size === 'lg' && s.btnLg,
        variant === 'primary'   && s.btnPrimary,
        variant === 'secondary' && s.btnSecondary,
        variant === 'ghost'     && s.btnGhost,
        variant === 'danger'    && s.btnDanger,
        fullWidth && { width: '100%' },
        off && { opacity: 0.55 },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'primary' ? Colors.white : Colors.accent} />
        : <>
            {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
            <Text style={[
              s.btnTxt,
              size === 'sm' && { fontSize: Fs.sm }, size === 'lg' && { fontSize: Fs.lg },
              variant === 'primary'   && { color: Colors.white },
              variant === 'secondary' && { color: Colors.textPrimary },
              variant === 'ghost'     && { color: Colors.accent },
              variant === 'danger'    && { color: Colors.danger },
            ]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: any;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
export const Input: React.FC<InputProps> = ({
  label, error, leftIcon, rightIcon, style, ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const errMsg: string | undefined =
    !error ? undefined :
    typeof error === 'string' ? error :
    typeof error === 'object' && error.message ? String(error.message) :
    undefined;
  return (
    <View style={s.inputWrap}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <View style={[s.inputBox, focused && s.inputFocused, !!errMsg && s.inputError]}>
        {leftIcon ? <View style={s.inputLeft}>{leftIcon}</View> : null}
        <TextInput
          style={[s.input, style as TextStyle]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon ? <View style={s.inputRight}>{rightIcon}</View> : null}
      </View>
      {errMsg ? <Text style={s.inputErrTxt}>{errMsg}</Text> : null}
    </View>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  glow?: boolean;
}
export const Card: React.FC<CardProps> = ({ children, style, onPress, glow }) => {
  const cs: ViewStyle[] = [s.card, glow && s.cardGlow as ViewStyle, style as ViewStyle].filter(Boolean) as ViewStyle[];
  if (onPress) return <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={cs}>{children}</TouchableOpacity>;
  return <View style={cs}>{children}</View>;
};

// ── Status Badge ──────────────────────────────────────────────────────────
const BADGE: Record<string, { color: string; bg: string; label: string }> = {
  // Español (backend)
  pendiente:  { color: Colors.warning, bg: Colors.warningDim, label: 'Pendiente' },
  aprobada:   { color: Colors.success, bg: Colors.successDim, label: 'Aprobada' },
  rechazada:  { color: Colors.danger,  bg: Colors.dangerDim,  label: 'Rechazada' },
  en_proceso: { color: Colors.accent,  bg: Colors.accentDim,  label: 'En proceso' },
  // Inglés (fallback)
  pending:    { color: Colors.warning, bg: Colors.warningDim, label: 'Pendiente' },
  completed:  { color: Colors.success, bg: Colors.successDim, label: 'Completada' },
  cancelled:  { color: Colors.danger,  bg: Colors.dangerDim,  label: 'Cancelada' },
  processing: { color: Colors.accent,  bg: Colors.accentDim,  label: 'Procesando' },
};
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const b = BADGE[status] || BADGE.pending;
  return (
    <View style={[s.badge, { backgroundColor: b.bg }]}>
      <View style={[s.badgeDot, { backgroundColor: b.color }]} />
      <Text style={[s.badgeTxt, { color: b.color }]}>{b.label}</Text>
    </View>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'small'|'large'; color?: string }> = ({
  size = 'small', color = Colors.accent,
}) => <ActivityIndicator size={size} color={color} />;

// ── Divider ───────────────────────────────────────────────────────────────
export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <View style={s.divRow}>
    <View style={s.divLine} />
    {label && <Text style={s.divLabel}>{label}</Text>}
    <View style={s.divLine} />
  </View>
);

// ── Empty State ───────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <View style={s.empty}>
    <View style={{ opacity: 0.4 }}>{icon}</View>
    <Text style={s.emptyTitle}>{title}</Text>
    {subtitle && <Text style={s.emptySub}>{subtitle}</Text>}
    {action && <View style={{ marginTop: Sp.lg }}>{action}</View>}
  </View>
);

// ── Section Header ────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({
  title, action, onAction,
}) => (
  <View style={s.sectionRow}>
    <Text style={s.sectionTitle}>{title}</Text>
    {action && <TouchableOpacity onPress={onAction}><Text style={s.sectionAction}>{action}</Text></TouchableOpacity>}
  </View>
);

// ── ScreenHeader ──────────────────────────────────────────────────────────
export const ScreenHeader: React.FC<{
  title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode;
}> = ({ title, subtitle, onBack, right }) => (
  <View style={s.headerWrap}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={{ color: Colors.textPrimary, fontSize: 20 }}>‹</Text>
      </TouchableOpacity>
    )}
    <View style={{ flex: 1 }}>
      <Text style={s.headerTitle}>{title}</Text>
      {subtitle && <Text style={s.headerSub}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Button
  btn:          { flexDirection:'row', alignItems:'center', justifyContent:'center', borderRadius:R.md, paddingVertical:Sp.md, paddingHorizontal:Sp.xl, gap:6 },
  btnSm:        { paddingVertical:Sp.sm, paddingHorizontal:Sp.md },
  btnLg:        { paddingVertical:Sp.lg+2, paddingHorizontal:Sp.xxl },
  btnPrimary:   { backgroundColor: Colors.accent },
  btnSecondary: { backgroundColor: Colors.bgElevated, borderWidth:1, borderColor: Colors.borderSubtle },
  btnGhost:     { backgroundColor: 'transparent' },
  btnDanger:    { backgroundColor: Colors.dangerDim, borderWidth:1, borderColor:'rgba(255,77,109,0.2)' },
  btnTxt:       { fontSize:Fs.md, fontWeight:'600', color: Colors.textPrimary },

  // Input
  inputWrap:    { gap: 5 },
  inputLabel:   { fontSize:Fs.sm, fontWeight:'500', color:Colors.textSecondary },
  inputBox:     { flexDirection:'row', alignItems:'center', backgroundColor:Colors.bgInput, borderWidth:1, borderColor:Colors.border, borderRadius:R.sm, overflow:'hidden' },
  inputFocused: { borderColor: Colors.accent },
  inputError:   { borderColor: Colors.danger },
  input:        { flex:1, paddingHorizontal:Sp.lg, paddingVertical:Sp.md, fontSize:Fs.md, color:Colors.textPrimary, height:50 },
  inputLeft:    { paddingLeft:Sp.lg, paddingRight:Sp.sm, opacity:0.6 },
  inputRight:   { paddingRight:Sp.lg },
  inputErrTxt:  { fontSize:Fs.xs, color:Colors.danger },

  // Card
  card:     { backgroundColor:Colors.bgCard, borderRadius:R.md, borderWidth:1, borderColor:Colors.borderSubtle, padding:Sp.xl },
  cardGlow: { borderColor:Colors.border, shadowColor:Colors.accent, shadowOffset:{width:0,height:0}, shadowOpacity:0.3, shadowRadius:12, elevation:8 },

  // Badge
  badge:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:9, paddingVertical:3, borderRadius:R.full, alignSelf:'flex-start' },
  badgeDot: { width:5, height:5, borderRadius:99 },
  badgeTxt: { fontSize:Fs.xs, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.4 },

  // Divider
  divRow:   { flexDirection:'row', alignItems:'center', gap:10, marginVertical:Sp.sm },
  divLine:  { flex:1, height:1, backgroundColor:Colors.borderSubtle },
  divLabel: { fontSize:Fs.xs, color:Colors.textMuted },

  // Empty
  empty:      { alignItems:'center', justifyContent:'center', paddingVertical:48, paddingHorizontal:Sp.xxl, gap:8 },
  emptyTitle: { fontSize:Fs.lg, fontWeight:'700', color:Colors.textPrimary, textAlign:'center' },
  emptySub:   { fontSize:Fs.sm, color:Colors.textSecondary, textAlign:'center' },

  // Section
  sectionRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:Sp.md },
  sectionTitle:  { fontSize:Fs.lg, fontWeight:'700', color:Colors.textPrimary },
  sectionAction: { fontSize:Fs.sm, color:Colors.accent, fontWeight:'500' },

  // Header
  headerWrap:  { flexDirection:'row', alignItems:'center', gap:Sp.md, padding:Sp.xl, paddingTop:Sp.xl, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle },
  backBtn:     { width:38, height:38, borderRadius:R.sm, alignItems:'center', justifyContent:'center', backgroundColor:Colors.bgElevated, borderWidth:1, borderColor:Colors.borderSubtle },
  headerTitle: { fontSize:Fs.xl, fontWeight:'800', color:Colors.textPrimary },
  headerSub:   { fontSize:Fs.xs, color:Colors.textSecondary, marginTop:1 },

  // White color helper
  white: { color: Colors.white },
});
