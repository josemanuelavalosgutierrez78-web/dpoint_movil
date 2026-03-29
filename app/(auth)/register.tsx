import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Image
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
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

const msg = (e: any): string => {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && e.message) return String(e.message);
  return '';
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
const CheckBox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}
    style={[st.checkbox, checked && st.checkboxOn]}>
    {checked && <Ionicons name="checkmark" size={13} color={C.accentDk} />}
  </TouchableOpacity>
);

export default function RegisterScreen() {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [checks,   setChecks]   = useState({ terms: false, privacy: false, promo: false });

  const { control, handleSubmit, watch, trigger, formState: { errors } } = useForm();
  const password = watch('password') ?? '';

  const passChecks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula',        ok: /[A-Z]/.test(password) },
    { label: 'Un número',            ok: /\d/.test(password) },
  ];

  const goStep2 = async () => {
    const valid = await trigger(['email', 'password', 'password_confirm']);
    if (valid) { setApiError(''); setStep(2); }
  };

  const onSubmit = async (data: any) => {
    if (!checks.terms)   { setApiError('Debes aceptar los Términos y condiciones'); return; }
    if (!checks.privacy) { setApiError('Debes aceptar la Política de Privacidad'); return; }
    setApiError('');
    setLoading(true);
    try {
      await authService.register({
        nombre:           data.nombre,
        email:            data.email,
        dni:              data.dni,
        telefono:         data.telefono,
        password:         data.password,
        password_confirm: data.password_confirm,
        accepted_terms:   checks.terms,
        accepted_privacy: checks.privacy,
        accepted_promo:   checks.promo,
      });
      setRegEmail(data.email);
      setDone(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setApiError(
        Array.isArray(detail)
          ? detail[0]?.msg ?? 'Error al registrarse'
          : detail ?? err?.message ?? 'Error al registrarse'
      );
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla: correo enviado ──
  if (done) {
    return (
      <View style={[st.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={st.doneIcon}>
          <Ionicons name="mail-outline" size={48} color={C.accent} />
        </View>
        <Text style={st.doneTitle}>Verifica tu correo</Text>
        <Text style={st.doneDesc}>
          Enviamos un enlace a{'\n'}
          <Text style={{ color: C.accent, fontWeight: '700' }}>{regEmail}</Text>
          {'\n\n'}Haz clic en el enlace para activar tu cuenta.
        </Text>
        <TouchableOpacity style={st.submitBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={st.submitTxt}>Ir al inicio de sesión</Text>
        </TouchableOpacity>
        <Text style={st.spamTxt}>¿No lo ves? Revisa tu carpeta de spam</Text>
      </View>
    );
  }

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
          <Text style={st.title}>Crea tu cuenta</Text>
          <Text style={st.subtitle}>Regístrate gratis y empieza a operar</Text>
        </View>

        {/* ── Stepper ── */}
        <View style={st.stepperRow}>
          <Step n={1} label="Acceso"      active={step === 1} done={step > 1} />
          <View style={[st.stepLine, step > 1 && { backgroundColor: C.accent }]} />
          <Step n={2} label="Información" active={step === 2} done={false} />
        </View>

        {/* ── Card ── */}
        <View style={st.card}>

          {/* Error */}
          {!!apiError && (
            <View style={st.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={C.danger} />
              <Text style={st.errorTxt}>{apiError}</Text>
            </View>
          )}

          {/* ══ PASO 1 ══ */}
          {step === 1 && (
            <View style={st.formWrap}>
              <Field label="CORREO ELECTRÓNICO">
                <Controller control={control} name="email"
                  rules={{ required: 'Correo requerido', pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' } }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <View style={[st.inputBox, !!msg(errors.email) && st.inputErr]}>
                        <Ionicons name="person-outline" size={17} color={C.muted} style={{ marginRight: 8 }} />
                        <TextInput
                          style={st.input}
                          placeholder="mail@domain.com"
                          placeholderTextColor={C.muted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          selectionColor={C.accent}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                      </View>
                      {!!msg(errors.email) && <Text style={st.errTxt}>{msg(errors.email)}</Text>}
                    </>
                  )} />
              </Field>

              <Field label="CONTRASEÑA">
                <Controller control={control} name="password"
                  rules={{ required: 'Contraseña requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <View style={[st.inputBox, !!msg(errors.password) && st.inputErr]}>
                        <Ionicons name="lock-closed-outline" size={17} color={C.muted} style={{ marginRight: 8 }} />
                        <TextInput
                          style={[st.input, { flex: 1 }]}
                          placeholder="••••••••••••"
                          placeholderTextColor={C.muted}
                          secureTextEntry={!showPass}
                          autoCapitalize="none"
                          selectionColor={C.accent}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 4 }}>
                          <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.muted} />
                        </TouchableOpacity>
                      </View>
                      <View style={st.passReqs}>
                        {passChecks.map(({ label, ok }) => (
                          <PassReq key={label} label={label} ok={ok} />
                        ))}
                      </View>
                      {!!msg(errors.password) && <Text style={st.errTxt}>{msg(errors.password)}</Text>}
                    </>
                  )} />
              </Field>

              <Field label="CONFIRMAR CONTRASEÑA">
                <Controller control={control} name="password_confirm"
                  rules={{
                    required: 'Confirma tu contraseña',
                    validate: (v) => v === password || 'Las contraseñas no coinciden',
                  }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <View style={[st.inputBox, !!msg(errors.password_confirm) && st.inputErr]}>
                        <Ionicons name="lock-closed-outline" size={17} color={C.muted} style={{ marginRight: 8 }} />
                        <TextInput
                          style={[st.input, { flex: 1 }]}
                          placeholder="Repite tu contraseña"
                          placeholderTextColor={C.muted}
                          secureTextEntry={!showPass}
                          autoCapitalize="none"
                          selectionColor={C.accent}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                      </View>
                      {!!msg(errors.password_confirm) && <Text style={st.errTxt}>{msg(errors.password_confirm)}</Text>}
                    </>
                  )} />
              </Field>

              <TouchableOpacity style={st.submitBtn} activeOpacity={0.85} onPress={goStep2}>
                <Text style={st.submitTxt}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color={C.accentDk} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* ══ PASO 2 ══ */}
          {step === 2 && (
            <View style={st.formWrap}>
              <Field label="NOMBRE COMPLETO">
                <Controller control={control} name="nombre"
                  rules={{ required: 'Nombre requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <View style={[st.inputBox, !!msg(errors.nombre) && st.inputErr]}>
                        <Ionicons name="person-outline" size={17} color={C.muted} style={{ marginRight: 8 }} />
                        <TextInput
                          style={st.input}
                          placeholder="Juan García López"
                          placeholderTextColor={C.muted}
                          autoCapitalize="words"
                          selectionColor={C.accent}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                      </View>
                      {!!msg(errors.nombre) && <Text style={st.errTxt}>{msg(errors.nombre)}</Text>}
                    </>
                  )} />
              </Field>

              <View style={st.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="DNI">
                    <Controller control={control} name="dni"
                      rules={{ required: 'DNI requerido', pattern: { value: /^\d{8}$/, message: '8 dígitos' } }}
                      render={({ field: { onChange, value } }) => (
                        <>
                          <View style={[st.inputBox, !!msg(errors.dni) && st.inputErr]}>
                            <TextInput
                              style={st.input}
                              placeholder="12345678"
                              placeholderTextColor={C.muted}
                              keyboardType="number-pad"
                              maxLength={8}
                              selectionColor={C.accent}
                              value={value ?? ''}
                              onChangeText={onChange}
                            />
                          </View>
                          {!!msg(errors.dni) && <Text style={st.errTxt}>{msg(errors.dni)}</Text>}
                        </>
                      )} />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="TELÉFONO">
                    <Controller control={control} name="telefono"
                      rules={{ required: 'Requerido', pattern: { value: /^\d{9}$/, message: '9 dígitos' } }}
                      render={({ field: { onChange, value } }) => (
                        <>
                          <View style={[st.inputBox, !!msg(errors.telefono) && st.inputErr]}>
                            <TextInput
                              style={st.input}
                              placeholder="987654321"
                              placeholderTextColor={C.muted}
                              keyboardType="phone-pad"
                              maxLength={9}
                              selectionColor={C.accent}
                              value={value ?? ''}
                              onChangeText={onChange}
                            />
                          </View>
                          {!!msg(errors.telefono) && <Text style={st.errTxt}>{msg(errors.telefono)}</Text>}
                        </>
                      )} />
                  </Field>
                </View>
              </View>

              {/* Checkboxes */}
              <View style={st.checksWrap}>
                {([
                  { key: 'terms'   as const, label: 'He leído y acepto los Términos y condiciones' },
                  { key: 'privacy' as const, label: 'Acepto la Política de Privacidad' },
                  { key: 'promo'   as const, label: 'Quiero recibir ofertas y novedades' },
                ]).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setChecks(p => ({ ...p, [key]: !p[key] }))}
                    style={st.checkRow}
                    activeOpacity={0.8}
                  >
                    <CheckBox checked={checks[key]} onPress={() => setChecks(p => ({ ...p, [key]: !p[key] }))} />
                    <Text style={st.checkLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[st.submitBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={st.submitTxt}>{loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Link login */}
          <View style={st.regRow}>
            <Text style={st.regTxt}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={st.regLink}>Ingresar</Text>
            </TouchableOpacity>
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
    padding: 24,
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
  formWrap:  { gap: 16 },
  row2:      { flexDirection: 'row', gap: 12 },
  fieldWrap: { gap: 6 },
  label:     { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  inputBox:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inpBorder,
    borderRadius: 11, paddingHorizontal: 14, height: 50,
  },
  inputErr:  { borderColor: C.danger },
  input:     { flex: 1, color: '#ffffff', fontSize: 14 },
  errTxt:    { fontSize: 11, color: C.danger },

  // Pass reqs
  passReqs:     { gap: 4, marginTop: 6 },
  passReqRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  passReqDot:   { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(136,150,179,0.1)', borderWidth: 1, borderColor: 'rgba(136,150,179,0.3)' },
  passReqDotOk: { backgroundColor: 'rgba(6,182,212,0.15)', borderColor: C.accent },
  passReqTxt:   { fontSize: 11, color: '#e2e8f0' },

  // Checkboxes
  checksWrap: { gap: 12 },
  checkRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox:   { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#3a4a6b', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxOn: { backgroundColor: C.accent, borderColor: C.accent },
  checkLabel: { fontSize: 13, color: C.text, flex: 1, lineHeight: 20 },

  // Submit
  submitBtn: {
    height: 54, borderRadius: 14, backgroundColor: C.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginTop: 4,
  },
  submitTxt: { fontSize: 15, fontWeight: '800', color: C.accentDk },

  // Login row
  regRow:  { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  regTxt:  { fontSize: 13, color: C.muted },
  regLink: { fontSize: 13, color: C.accent, fontWeight: '700' },

  // Done screen
  doneIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  doneDesc:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  spamTxt:   { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 12 },
});