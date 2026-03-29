import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Easing, Switch, Linking, TextInput, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/context/authStore';
import { api } from '@/services/api';
import { Colors, Sp, R, Fs } from '@/constants/theme';

/* ─── Paleta local ───────────────────────────────────────── */
const C = {
  bg:           '#0b1929',
  card:         '#112236',
  cardHigh:     '#162d44',
  input:        '#1a3050',
  border:       '#253f5e',
  borderBright: '#3a6a94',
  textPrimary:  '#ffffff',
  textSecond:   '#cce4f8',
  textMuted:    '#9ec4e0',
  accent:       '#06b6d4',
  accentLight:  '#7ef0ff',
  accentDark:   '#083344',
  accentDim:    '#082030',
  success:      '#00e89a',
  successDim:   '#072e1f',
  danger:       '#f87171',
  dangerDim:    '#2e0f0f',
  warning:      '#fbbf24',
  warningDim:   '#2a1f08',
};

export default function ProfileScreen() {
  const insets  = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const initials = user?.nombre?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'U';
  const esEmpresa = (user as any)?.tipo_cliente === 'empresa';

  // Toggles notificaciones
  const [notifPush,  setNotifPush]  = useState(true);
  const [notifWA,    setNotifWA]    = useState(true);
  const [notifTasa,  setNotifTasa]  = useState(false);

  // Sub-secciones expandibles
  const [showNotif,  setShowNotif]  = useState(false);
  const [showSegur,  setShowSegur]  = useState(false);
  const [showApar,   setShowApar]   = useState(false);

  // Cambiar contraseña
  const [showPassForm,   setShowPassForm]   = useState(false);
  const [passActual,     setPassActual]     = useState('');
  const [passNuevo,      setPassNuevo]      = useState('');
  const [passConfirmar,  setPassConfirmar]  = useState('');
  const [showActual,     setShowActual]     = useState(false);
  const [showNuevo,      setShowNuevo]      = useState(false);
  const [showConfirmar,  setShowConfirmar]  = useState(false);
  const [passLoading,    setPassLoading]    = useState(false);

  // Eliminar cuenta
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Animaciones entrada
  const fadeAvatar  = useRef(new Animated.Value(0)).current;
  const slideAvatar = useRef(new Animated.Value(-20)).current;
  const fadeCards   = useRef(new Animated.Value(0)).current;
  const slideCards  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const enter = (fade: Animated.Value, slide: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]);
    Animated.parallel([
      enter(fadeAvatar, slideAvatar, 0),
      enter(fadeCards,  slideCards,  160),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive',
        onPress: async () => {
          await authService.logout();
          logout();
          router.replace('/(auth)/login');
          Toast.show({ type: 'success', text1: 'Sesión cerrada' });
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!passActual || !passNuevo || !passConfirmar) {
      Toast.show({ type: 'error', text1: 'Completa todos los campos' }); return;
    }
    if (passNuevo !== passConfirmar) {
      Toast.show({ type: 'error', text1: 'Las contraseñas nuevas no coinciden' }); return;
    }
    setPassLoading(true);
    try {
      await api.post('/auth/change-password', {
        password_actual: passActual,
        password_nuevo:  passNuevo,
      });
      Toast.show({ type: 'success', text1: 'Contraseña actualizada' });
      setPassActual(''); setPassNuevo(''); setPassConfirmar('');
      setShowPassForm(false);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail || 'Error al cambiar contraseña' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/delete-account');
      logout();
      router.replace('/(auth)/login');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail || 'Error al eliminar cuenta' });
    } finally {
      setDeleteLoading(false);
      setDeleteModal(false);
    }
  };

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Sp.lg, paddingBottom: 100 }]}
      >
        {/* ── Avatar ── */}
        <Animated.View style={[s.avatarWrap, { opacity: fadeAvatar, transform: [{ translateY: slideAvatar }] }]}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.name}>{user?.nombre || '—'}</Text>
              {esEmpresa && (
                <View style={s.empresaBadge}>
                  <Ionicons name="business-outline" size={10} color={C.accent} />
                  <Text style={s.empresaBadgeTxt}>EMPRESA</Text>
                </View>
              )}
            </View>
            <Text style={s.email}>{user?.email}</Text>
          </View>
          <View style={s.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={11} color={C.success} />
            <Text style={s.verifiedTxt}>Cuenta verificada</Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ gap: 14 }, { opacity: fadeCards, transform: [{ translateY: slideCards }] }]}>

          {/* ── Datos personales ── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>DATOS PERSONALES</Text>
            <ProfileRow icon="person-outline" label="Nombre"   value={user?.nombre   || '—'} />
            <ProfileRow icon="mail-outline"   label="Email"    value={user?.email    || '—'} />
            <ProfileRow icon="call-outline"   label="Teléfono" value={user?.telefono || '—'} />
            <ProfileRow icon="card-outline"   label="DNI"      value={(user as any)?.dni || '—'} last />
          </View>

          {/* ── Datos empresa ── */}
          {esEmpresa && (
            <View style={s.card}>
              <View style={s.empresaHeader}>
                <Text style={[s.sectionLabel, { color: C.accent, borderBottomWidth: 0, paddingBottom: 0 }]}>DATOS DE EMPRESA</Text>
                <View style={s.empresaHeaderBadge}>
                  <Ionicons name="business-outline" size={11} color={C.accent} />
                  <Text style={s.empresaHeaderBadgeTxt}>Tasa preferencial activa</Text>
                </View>
              </View>
              <View style={s.empresaHeaderDivider} />
              <ProfileRow icon="business-outline"   label="RUC"              value={(user as any)?.ruc              || '—'} />
              <ProfileRow icon="briefcase-outline"  label="Razón Social"     value={(user as any)?.razon_social     || '—'} />
              <ProfileRow icon="storefront-outline" label="Nombre Comercial" value={(user as any)?.nombre_comercial || '—'} />
              <ProfileRow icon="call-outline"       label="Tel. Empresa"     value={(user as any)?.telefono_empresa || '—'} />
              <ProfileRow icon="mail-outline"       label="Email Factura"    value={(user as any)?.email_factura    || '—'} last />
            </View>
          )}

          {/* ── Configuración ── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>CONFIGURACIÓN</Text>

            {/* Notificaciones */}
            <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => Toast.show({ type: 'info', text1: 'Próximamente' })}>
              <View style={s.rowIcon}>
                <Ionicons name="notifications-outline" size={15} color={C.textMuted} />
              </View>
              <Text style={[s.rowLabel, { flex: 1 }]}>Notificaciones</Text>
              <View style={s.soonBadge}>
                <Text style={s.soonTxt}>Pronto</Text>
              </View>
            </TouchableOpacity>

            <View style={s.rowDivider} />

            {/* Seguridad */}
            <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => setShowSegur(v => !v)}>
              <View style={s.rowIcon}>
                <Ionicons name="shield-outline" size={15} color={C.textMuted} />
              </View>
              <Text style={[s.rowLabel, { flex: 1 }]}>Seguridad</Text>
              <Ionicons name={showSegur ? 'chevron-down' : 'chevron-forward'} size={14} color={C.textMuted} />
            </TouchableOpacity>
            {showSegur && (
              <View style={s.subSection}>
                <TouchableOpacity
                  style={s.subRow}
                  activeOpacity={0.75}
                  onPress={() => setShowPassForm(v => !v)}
                >
                  <Ionicons name="key-outline" size={14} color={C.textMuted} />
                  <Text style={[s.subRowLabel, { flex: 1 }]}>Cambiar contraseña</Text>
                  <Ionicons name={showPassForm ? 'chevron-down' : 'chevron-forward'} size={13} color={C.textMuted} />
                </TouchableOpacity>

                {/* Form cambiar contraseña */}
                {showPassForm && (
                  <View style={s.passForm}>
                    <PassField
                      label="Contraseña actual"
                      value={passActual}
                      onChange={setPassActual}
                      show={showActual}
                      onToggle={() => setShowActual(v => !v)}
                    />
                    <PassField
                      label="Nueva contraseña"
                      value={passNuevo}
                      onChange={setPassNuevo}
                      show={showNuevo}
                      onToggle={() => setShowNuevo(v => !v)}
                    />
                    <PassField
                      label="Confirmar contraseña"
                      value={passConfirmar}
                      onChange={setPassConfirmar}
                      show={showConfirmar}
                      onToggle={() => setShowConfirmar(v => !v)}
                    />
                    <TouchableOpacity
                      style={[s.passBtn, passLoading && { opacity: 0.6 }]}
                      onPress={handleChangePassword}
                      activeOpacity={0.85}
                      disabled={passLoading}
                    >
                      <Text style={s.passBtnTxt}>{passLoading ? 'Guardando...' : 'Actualizar contraseña'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={s.subDivider} />
                <TouchableOpacity style={s.subRow} activeOpacity={0.75}>
                  <Ionicons name="phone-portrait-outline" size={14} color={C.textMuted} />
                  <Text style={[s.subRowLabel, { flex: 1 }]}>Autenticación en 2 pasos</Text>
                  <View style={s.soonBadge}>
                    <Text style={s.soonTxt}>Pronto</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.rowDivider} />

            {/* Apariencia */}
            <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => setShowApar(v => !v)}>
              <View style={s.rowIcon}>
                <Ionicons name="moon-outline" size={15} color={C.textMuted} />
              </View>
              <Text style={[s.rowLabel, { flex: 1 }]}>Apariencia</Text>
              <Ionicons name={showApar ? 'chevron-down' : 'chevron-forward'} size={14} color={C.textMuted} />
            </TouchableOpacity>
            {showApar && (
              <View style={s.subSection}>
                <View style={s.subRow}>
                  <Ionicons name="contrast-outline" size={14} color={C.textMuted} />
                  <Text style={[s.subRowLabel, { flex: 1 }]}>Tema de la app</Text>
                  <View style={s.soonBadge}>
                    <Text style={s.soonTxt}>Pronto</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ── Soporte ── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>SOPORTE</Text>
            <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => openLink('https://www.dollarpointx.com/contactanos')}>
              <View style={s.rowIcon}>
                <Ionicons name="help-circle-outline" size={15} color={C.textMuted} />
              </View>
              <Text style={[s.rowLabel, { flex: 1 }]}>Centro de ayuda</Text>
              <Ionicons name="open-outline" size={14} color={C.textMuted} />
            </TouchableOpacity>
            <View style={s.rowDivider} />
            <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => openLink('https://www.dollarpointx.com/terminos')}>
              <View style={s.rowIcon}>
                <Ionicons name="document-text-outline" size={15} color={C.textMuted} />
              </View>
              <Text style={[s.rowLabel, { flex: 1 }]}>Términos y condiciones</Text>
              <Ionicons name="open-outline" size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Eliminar cuenta ── */}
          <View style={[s.card, { borderColor: 'rgba(248,113,113,0.2)' }]}>
            <Text style={[s.sectionLabel, { color: C.danger }]}>ZONA DE PELIGRO</Text>
            <View style={s.row}>
              <View style={[s.rowIcon, { backgroundColor: C.dangerDim, borderColor: 'rgba(248,113,113,0.2)' }]}>
                <Ionicons name="trash-outline" size={15} color={C.danger} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.rowLabel, { color: C.danger }]}>Eliminar cuenta</Text>
                <Text style={{ fontSize: 11, color: C.textMuted }}>Esta acción es irreversible</Text>
              </View>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => setDeleteModal(true)}
                activeOpacity={0.85}
              >
                <Text style={s.deleteBtnTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={C.danger} />
            <Text style={s.logoutTxt}>Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={s.version}>DollarPoint X v1.0.0 · Regulado por SBS</Text>

        </Animated.View>
      </ScrollView>

      {/* ── Modal eliminar cuenta ── */}
      <Modal visible={deleteModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <View style={[s.rowIcon, { backgroundColor: C.dangerDim, borderColor: 'rgba(248,113,113,0.2)', width: 40, height: 40 }]}>
                <Ionicons name="trash-outline" size={18} color={C.danger} />
              </View>
              <Text style={s.modalTitle}>¿Eliminar cuenta?</Text>
            </View>
            <Text style={s.modalDesc}>
              Esta acción es permanente e irreversible. Todos tus datos, operaciones e historial serán eliminados.
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setDeleteModal(false)}
                activeOpacity={0.8}
                disabled={deleteLoading}
              >
                <Text style={s.modalCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalDeleteBtn, deleteLoading && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.85}
                disabled={deleteLoading}
              >
                <Text style={s.modalDeleteTxt}>{deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Subcomponentes ──────────────────────────────────────── */
const ProfileRow = ({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) => (
  <>
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Ionicons name={icon} size={15} color={C.accent} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
    </View>
    {!last && <View style={s.rowDivider} />}
  </>
);

const PassField = ({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) => (
  <View style={{ gap: 6 }}>
    <Text style={s.passLabel}>{label}</Text>
    <View style={s.passInputWrap}>
      <TextInput
        style={s.passInput}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        placeholder="••••••••"
        placeholderTextColor={C.textMuted}
        selectionColor={C.accent}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={s.passEye} activeOpacity={0.7}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
);

/* ── Styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  scroll: { paddingHorizontal: 30, gap: 20 },

  avatarWrap:    { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar:        { width: 84, height: 84, borderRadius: 42, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  avatarTxt:     { fontSize: Fs.xxl, fontWeight: '800', color: C.accentDark },
  name:          { fontSize: Fs.xl, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  email:         { fontSize: Fs.sm, color: C.textMuted },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,232,154,0.2)' },
  verifiedTxt:   { fontSize: 11, color: C.success, fontWeight: '700' },

  // Badge empresa en avatar
  empresaBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)' },
  empresaBadgeTxt: { fontSize: 9, fontWeight: '700', color: C.accent, letterSpacing: 0.8 },

  // Header card empresa
  empresaHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  empresaHeaderBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)' },
  empresaHeaderBadgeTxt: { fontSize: 9, fontWeight: '700', color: C.accent },
  empresaHeaderDivider: { height: 1, backgroundColor: C.border, marginBottom: 0 },

  card:         { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1.2, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  rowIcon:    { width: 30, height: 30, borderRadius: 9, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  rowLabel:   { fontSize: Fs.sm, color: C.textSecond },
  rowValue:   { flex: 1, fontSize: Fs.sm, fontWeight: '700', color: C.textPrimary, textAlign: 'right' },

  subSection:  { backgroundColor: C.input, borderTopWidth: 1, borderTopColor: C.border },
  subRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 13 },
  subDivider:  { height: 1, backgroundColor: C.border, marginHorizontal: 20 },
  subRowLabel: { fontSize: 13, color: C.textMuted },

  soonBadge: { backgroundColor: C.warningDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.warning + '44' },
  soonTxt:   { fontSize: 10, fontWeight: '700', color: C.warning },

  // Password form
  passForm:      { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: C.border },
  passLabel:     { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  passInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  passInput:     { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.textPrimary },
  passEye:       { paddingHorizontal: 12 },
  passBtn:       { height: 44, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  passBtnTxt:    { fontSize: 14, fontWeight: '700', color: C.accentDark },

  // Delete
  deleteBtn:    { backgroundColor: C.dangerDim, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)', paddingHorizontal: 12, paddingVertical: 7 },
  deleteBtnTxt: { fontSize: 12, fontWeight: '700', color: C.danger },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerDim, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', padding: 14 },
  logoutTxt: { fontSize: Fs.md, fontWeight: '700', color: C.danger },

  version: { textAlign: 'center', fontSize: Fs.xs, color: C.textMuted, paddingBottom: 8 },

  // Modal eliminar
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:       { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, gap: 14 },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle:     { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  modalDesc:      { fontSize: 13, color: C.textMuted, lineHeight: 20 },
  modalBtns:      { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, padding: 12, backgroundColor: C.input, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: C.textSecond },
  modalDeleteBtn: { flex: 1, padding: 12, backgroundColor: C.dangerDim, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', alignItems: 'center' },
  modalDeleteTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
});