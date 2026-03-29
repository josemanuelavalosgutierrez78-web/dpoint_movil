import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { parseApiError } from '@/services/api';
import { Button, Input, ScreenHeader } from '@/components/ui';
import { Colors, Sp, R, Fs } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Recuperar contraseña" onBack={() => router.back()} />

        {!sent ? (
          <View style={s.body}>
            <Text style={s.desc}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
            <Controller control={control} name="email"
              rules={{ required: 'Correo requerido', pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Correo electrónico" placeholder="tu@correo.com"
                  keyboardType="email-address" autoCapitalize="none"
                  value={value} onChangeText={onChange} error={errors.email?.message}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
                />
              )} />
            <Button label="Enviar enlace" fullWidth size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />
          </View>
        ) : (
          <View style={s.successBox}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitle}>¡Correo enviado!</Text>
            <Text style={s.successDesc}>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </Text>
            <Button label="Volver al inicio" onPress={() => router.replace('/(auth)/login')} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bgPrimary },
  content:      { flexGrow: 1 },
  body:         { padding: Sp.xl, gap: Sp.xl, paddingTop: Sp.xxl },
  desc:         { fontSize: Fs.md, color: Colors.textSecondary, lineHeight: 22 },
  successBox:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Sp.xl, gap: Sp.lg },
  successIcon:  { fontSize: 64 },
  successTitle: { fontSize: Fs.xxl, fontWeight: '800', color: Colors.textPrimary },
  successDesc:  { fontSize: Fs.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
}); 