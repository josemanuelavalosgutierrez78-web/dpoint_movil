import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Image, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/authService';

const C = {
  bg:       '#0f1729',
  card:     '#0e1f3a',
  border:   'rgba(255,255,255,0.08)',
  accent:   '#06b6d4',
  accentDk: '#0a1628',
  muted:    '#9ec4e0',
  text:     '#e2e8f0',
  danger:   '#f87171',
  input:    'rgba(6,12,28,0.6)',
  inpBorder:'rgba(255,255,255,0.1)',
  stepLine: '#253f5e',
};

/* ── Stepper ── */
const Step = ({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) => (
  <View style={st.stepWrap}>
    <View style={[
      st.stepCircle,
      active && st.stepCircleActive,
      done   && st.stepCircleDone,
    ]}>
      {done ? (
        <Ionicons name="checkmark" size={13} color={C.accentDk} />
      ) : (
        <Text style={[st.stepN, active && { color: C.accent }]}>{n}</Text>
      )}
    </View>
    <Text style={[st.stepLabel, active && { color: C.accent }]}>{label}</Text>
  </View>
);

/* ── Field wrapper ── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={st.fieldWrap}>
    <Text style={st.label}>{label}</Text>
    {children}
  </View>
);

/* ── Password req item ── */
const PassReq = ({ label, ok }: { label: string; ok: boolean }) => (
  <View style={st.passReqRow}>
    <View style={[st.passReqDot, ok && st.passReqDotOk]}>
      {ok && <Ionicons name="checkmark" size={8} color={C.accent} />}
    </View>
    <Text style={[st.passReqTxt, ok && { color: C.accent }]}>{label}</Text>
  </View>
);

/* ── Checkbox ── */
const CheckItem = ({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <TouchableOpacity style={st.checkRow} onPress={onToggle} activeOpacity={0.75}>
    <View style={[st.checkbox, checked && st.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={12} color={C.accentDk} />}
    </View>
    <Text style={st.checkTxt}>{children}</Text>
  </TouchableOpacity>
);

export default function RegisterEmpresaScreen() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [checks, setChecks] = useState({ terms: false, privacy: false, promo: false });

  const [form, setForm] = useState({
    ruc: '', razon_social: '', nombre_comercial: '',
    email_factura: '', telefono_empresa: '',
    nombre: '', dni: '', telefono: '',
    email: '', confirmEmail: '',
    password: '', confirmPassword: '',
  });

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleCheck = (k: 'terms' | 'privacy' | 'promo') =>
    setChecks(p => ({ ...p, [k]: !p[k] }));

  const nextStep = () => {
    if (!form.ruc || form.ruc.length !== 11)
      return setError('El RUC debe tener 11 dígitos');
    if (!form.razon_social)
      return setError('La razón social es requerida');
    if (!form.telefono_empresa)
      return setError('El teléfono es requerido');
    setError('');
    setStep(2);
  };

  const submit = async () => {
    if (!form.nombre)   return setError('El nombre del responsable es requerido');
    if (!form.dni || form.dni.length !== 8) return setError('El DNI debe tener 8 dígitos');
    if (!form.telefono) return setError('El teléfono del responsable es requerido');
    if (!form.email)    return setError('El correo es requerido');
    if (form.email !== form.confirmEmail) return setError('Los correos no coinciden');
    if (!form.password || form.password.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres');
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden');
    if (!checks.terms)   return setError('Debes aceptar los Términos y condiciones');
    if (!checks.privacy) return setError('Debes aceptar la Política de Privacidad');

    setError('');
    setLoading(true);
    try {
      await authService.registerEmpresa({
        ruc:              form.ruc,
        razon_social:     form.razon_social,
        nombre_comercial: form.nombre_comercial || undefined,
        email_factura:    form.email_factura    || undefined,
        telefono_empresa: form.telefono_empresa,
        nombre:           form.nombre,
        dni:              form.dni,
        telefono:         form.telefono,
        email:            form.email,
        password:         form.password,
        accepted_terms:   checks.terms,
        accepted_privacy: checks.privacy,
        accepted_promo:   checks.promo,
      });
      Toast.show({
        type: 'success',
        text1: '¡Cuenta empresarial creada!',
        text2: 'Revisa tu correo para verificar tu cuenta',
      });
      router.replace('/(auth)/login');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const passChecks = [
    { label: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
    { label: 'Una letra mayúscula',  ok: /[A-Z]/.test(form.password) },
    { label: 'Un número',            ok: /\d/.test(form.password) },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={st.screen}
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Volver ── */}
        <TouchableOpacity
          style={st.backBtn}
          onPress={() => step === 1 ? router.back() : setStep(1)}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text style={st.backTxt}>Volver</Text>
        </TouchableOpacity>

        {/* ── Logo ── */}
        <View style={st.logoWrap}>
          <Image
            source={require('../../assets/loginicono.png')}
            style={{ width: 130, height: 50 }}
            resizeMode="contain"
          />
          <Text style={st.title}>Registro Empresa</Text>
          <Text style={st.subtitle}>Accede a tasas preferenciales para tu empresa</Text>
        </View>

        {/* ── Stepper ── */}
        <View style={st.stepperRow}>
          <Step n={1} label="Datos empresa" active={step === 1} done={step > 1} />
          <View style={[st.stepLine, step > 1 && { backgroundColor: C.accent }]} />
          <Step n={2} label="Responsable"   active={step === 2} done={false} />
        </View>

        {/* ── Card ── */}
        <View style={st.card}>

          {/* Error */}
          {!!error && (
            <View style={st.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={C.danger} />
              <Text style={st.errorTxt}>{error}</Text>
            </View>
          )}

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <View style={st.formWrap}>
              <Field label="RUC">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="20123456789"
                    placeholderTextColor={C.muted} keyboardType="numeric"
                    maxLength={11} value={form.ruc} onChangeText={set('ruc')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Razón social">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="Empresa SAC"
                    placeholderTextColor={C.muted} value={form.razon_social}
                    onChangeText={set('razon_social')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Nombre comercial (opcional)">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="Alias de la empresa"
                    placeholderTextColor={C.muted} value={form.nombre_comercial}
                    onChangeText={set('nombre_comercial')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Correo de facturación (opcional)">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="facturacion@empresa.com"
                    placeholderTextColor={C.muted} keyboardType="email-address"
                    autoCapitalize="none" value={form.email_factura}
                    onChangeText={set('email_factura')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Teléfono de la empresa">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="987654321"
                    placeholderTextColor={C.muted} keyboardType="phone-pad"
                    maxLength={9} value={form.telefono_empresa}
                    onChangeText={set('telefono_empresa')} selectionColor={C.accent} />
                </View>
              </Field>

              <TouchableOpacity style={st.submitBtn} onPress={nextStep} activeOpacity={0.85}>
                <Text style={st.submitTxt}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color={C.accentDk} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <View style={st.formWrap}>
              <Field label="Nombre completo del responsable">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="Juan García López"
                    placeholderTextColor={C.muted} value={form.nombre}
                    onChangeText={set('nombre')} selectionColor={C.accent} />
                </View>
              </Field>

              <View style={st.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="DNI">
                    <View style={st.inputBox}>
                      <TextInput style={st.input} placeholder="12345678"
                        placeholderTextColor={C.muted} keyboardType="numeric"
                        maxLength={8} value={form.dni}
                        onChangeText={set('dni')} selectionColor={C.accent} />
                    </View>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Teléfono">
                    <View style={st.inputBox}>
                      <TextInput style={st.input} placeholder="987654321"
                        placeholderTextColor={C.muted} keyboardType="phone-pad"
                        maxLength={9} value={form.telefono}
                        onChangeText={set('telefono')} selectionColor={C.accent} />
                    </View>
                  </Field>
                </View>
              </View>

              <Field label="Email">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="tu@email.com"
                    placeholderTextColor={C.muted} keyboardType="email-address"
                    autoCapitalize="none" value={form.email}
                    onChangeText={set('email')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Confirmar email">
                <View style={st.inputBox}>
                  <TextInput style={st.input} placeholder="Repite tu correo"
                    placeholderTextColor={C.muted} keyboardType="email-address"
                    autoCapitalize="none" value={form.confirmEmail}
                    onChangeText={set('confirmEmail')} selectionColor={C.accent} />
                </View>
              </Field>

              <Field label="Contraseña">
                <View style={st.inputBox}>
                  <TextInput style={[st.input, { flex: 1 }]} placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={C.muted} secureTextEntry={!showPass}
                    autoCapitalize="none" value={form.password}
                    onChangeText={set('password')} selectionColor={C.accent} />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ paddingRight: 4 }}>
                    <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.muted} />
                  </TouchableOpacity>
                </View>
                <View style={st.passReqs}>
                  {passChecks.map(r => <PassReq key={r.label} label={r.label} ok={r.ok} />)}
                </View>
              </Field>

              <Field label="Confirmar contraseña">
                <View style={st.inputBox}>
                  <TextInput style={[st.input, { flex: 1 }]} placeholder="Repite tu contraseña"
                    placeholderTextColor={C.muted} secureTextEntry={!showConfirmPass}
                    autoCapitalize="none" value={form.confirmPassword}
                    onChangeText={set('confirmPassword')} selectionColor={C.accent} />
                  <TouchableOpacity onPress={() => setShowConfirmPass(v => !v)} style={{ paddingRight: 4 }}>
                    <Ionicons name={showConfirmPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.muted} />
                  </TouchableOpacity>
                </View>
              </Field>

              {/* Checkboxes */}
              <View style={st.checksWrap}>
                <CheckItem checked={checks.terms} onToggle={() => toggleCheck('terms')}>
                  He leído y acepto los{' '}
                  <Text style={{ color: C.accent }}>Términos y condiciones</Text>
                </CheckItem>
                <CheckItem checked={checks.privacy} onToggle={() => toggleCheck('privacy')}>
                  Acepto la{' '}
                  <Text style={{ color: C.accent }}>Política de Privacidad</Text>
                </CheckItem>
                <CheckItem checked={checks.promo} onToggle={() => toggleCheck('promo')}>
                  Quiero recibir ofertas exclusivas y novedades
                </CheckItem>
              </View>

              <TouchableOpacity
                style={[st.submitBtn, loading && { opacity: 0.7 }]}
                onPress={submit} activeOpacity={0.85} disabled={loading}
              >
                <Text style={st.submitTxt}>{loading ? 'Creando cuenta...' : 'Crear cuenta empresarial'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Link login */}
          <View style={st.regRow}>
            <Text style={st.regTxt}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={st.regLink}>Ingresar</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },

  // Back
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', marginBottom: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
  },
  backTxt: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  // Logo
  logoWrap: { alignItems: 'center', gap: 8, marginBottom: 20 },
  title:    { fontSize: 24, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },

  // Stepper
  stepperRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
  stepWrap:         { alignItems: 'center', gap: 4 },
  stepCircle:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: C.stepLine },
  stepCircleActive: { backgroundColor: 'rgba(6,182,212,0.2)', borderColor: C.accent },
  stepCircleDone:   { backgroundColor: C.accent, borderColor: C.accent },
  stepN:            { fontSize: 13, fontWeight: '700', color: C.muted },
  stepLabel:        { fontSize: 11, fontWeight: '500', color: C.muted },
  stepLine:         { flex: 1, maxWidth: 60, height: 1, backgroundColor: C.stepLine },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 24, gap: 0,
  },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorTxt: { color: C.danger, fontSize: 13, flex: 1 },

  // Form
  formWrap: { gap: 16 },
  row2:     { flexDirection: 'row', gap: 12 },
  fieldWrap:{ gap: 6 },
  label:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inpBorder,
    borderRadius: 11, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, color: '#ffffff', fontSize: 14 },

  // Pass reqs
  passReqs:     { gap: 4, marginTop: 6 },
  passReqRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  passReqDot:   { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(136,150,179,0.1)', borderWidth: 1, borderColor: 'rgba(136,150,179,0.3)' },
  passReqDotOk: { backgroundColor: 'rgba(6,182,212,0.15)', borderColor: C.accent },
  passReqTxt:   { fontSize: 11, color: '#e2e8f0' },

  // Checkboxes
  checksWrap: { gap: 12 },
  checkRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox:   { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#3a4a6b', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
  checkTxt:   { fontSize: 13, color: C.text, flex: 1, lineHeight: 20 },

  // Submit
  submitBtn: {
    height: 54, borderRadius: 14, backgroundColor: C.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitTxt: { fontSize: 15, fontWeight: '800', color: C.accentDk },

  // Login row
  regRow:  { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  regTxt:  { fontSize: 13, color: C.muted },
  regLink: { fontSize: 13, color: C.accent, fontWeight: '700' },
});