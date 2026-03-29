import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/authService';
import { parseApiError } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import type { LoginPayload } from '@/types';

const msg = (e: any): string => {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && e.message) return String(e.message);
  return '';
};

// Logo SVG idéntico al de la web
const Logo = () => (
  <Image
    source={require('../../assets/loginicono.png')}
    style={{ width: 200, height: 80 }}
    resizeMode="contain"
  />
);
export default function LoginScreen() {
  const setUser   = useAuthStore((s) => s.setUser);
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<LoginPayload>();

  const onSubmit = async (data: LoginPayload) => {
    setApiError('');
    setLoading(true);
    try {
      const { user } = await authService.login(data);
      setUser(user);
      const nombre = (user as any)?.nombre?.split(' ')[0] || 'Usuario';
      Toast.show({ type: 'success', text1: `¡Bienvenido, ${nombre}!` });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setApiError('Demasiados intentos. Espera un minuto e intenta de nuevo.');
      } else {
        setApiError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + título */}
        <View style={s.logoWrap}>
          <Logo />
          <Text style={s.title}>Bienvenido de vuelta</Text>
          <Text style={s.subtitle}>Ingresa a tu cuenta DollarPoint X</Text>
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* Error banner */}
          {!!apiError && (
            <View style={s.errorBanner}>
              <Text style={s.errorTxt}>{apiError}</Text>
            </View>
          )}

          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>EMAIL</Text>
            <Controller control={control} name="email"
              rules={{ required: 'El correo es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' } }}
              render={({ field: { onChange, value } }) => (
                <>
                  <View style={[s.inputBox, !!msg(errors.email) && s.inputErr]}>
                    <TextInput
                      style={s.input}
                      placeholder="tu@email.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      selectionColor={Colors.accent}
                      value={value ?? ''}
                      onChangeText={onChange}
                    />
                  </View>
                  {!!msg(errors.email) && <Text style={s.errTxt}>{msg(errors.email)}</Text>}
                </>
              )}
            />
          </View>

          {/* Contraseña */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <Controller control={control} name="password"
              rules={{ required: 'La contraseña es requerida' }}
              render={({ field: { onChange, value } }) => (
                <>
                  <View style={[s.inputBox, !!msg(errors.password) && s.inputErr]}>
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      selectionColor={Colors.accent}
                      value={value ?? ''}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 4 }}>
                      <Ionicons
                        name={showPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20} color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!msg(errors.password) && <Text style={s.errTxt}>{msg(errors.password)}</Text>}
                </>
              )}
            />
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                <Text style={s.forgotTxt}>Olvidé mi contraseña</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Botón Ingresar */}
          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={s.submitTxt}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
          </TouchableOpacity>

          {/* Link registro */}
          <View style={s.regRow}>
            <Text style={s.regTxt}>¿No tienes cuenta? </Text>
            <Link href="/(auth)/register-select" asChild>
              <TouchableOpacity>
                <Text style={s.regLink}>Registrarse gratis</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bgPrimary },
  content:  { padding: Sp.xl, paddingTop: 72, paddingBottom: 48 },

  // Logo
  logoWrap: { alignItems: 'center', gap: 12, marginBottom: 36 },
  title:    { fontSize: Fs.xxxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: Fs.md, color: Colors.textSecondary, textAlign: 'center' },

  // Card — igual que web
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Sp.xxl,
    gap: Sp.xl,
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: R.md,
    paddingHorizontal: Sp.lg,
    paddingVertical: Sp.md,
  },
  errorTxt: { color: Colors.danger, fontSize: Fs.sm },

  // Campos
  fieldWrap: { gap: Sp.sm },
  label:     { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.2 },
  inputBox:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: R.md,
    paddingHorizontal: Sp.lg,
    height: 54,
  },
  inputErr:  { borderColor: Colors.danger },
  input:     { flex: 1, color: Colors.textPrimary, fontSize: Fs.md },
  errTxt:    { fontSize: Fs.xs, color: Colors.danger },
  forgotTxt: { fontSize: Fs.sm, color: Colors.textSecondary },

  // Botón — cyan igual que web
  submitBtn: {
    height: 56,
    borderRadius: R.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitTxt: { fontSize: Fs.lg, fontWeight: '700', color: '#0a1628' },

  // Registro
  regRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  regTxt: { fontSize: Fs.md, color: Colors.textSecondary },
  regLink:{ fontSize: Fs.md, color: Colors.accent, fontWeight: '700' },
});