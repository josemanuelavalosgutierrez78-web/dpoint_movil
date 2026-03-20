import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../api/client';
import { Input, Btn, ErrorMsg, BackBtn } from '../components/UI';
import { C, S } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  async function handleSend() {
    if (!email) { setError('Ingresa tu correo'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={[S.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📧</Text>
        <Text style={[S.headingMd, { textAlign: 'center', marginBottom: 12 }]}>¡Revisa tu correo!</Text>
        <Text style={[S.body, { textAlign: 'center', marginBottom: 32 }]}>
          Si existe una cuenta con {email}, recibirás un enlace para restablecer tu contraseña.
        </Text>
        <Btn label="Volver al inicio" onPress={() => navigation.navigate('Login')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 28 }} keyboardShouldPersistTaps="handled">
          <BackBtn onPress={() => navigation.goBack()} />
          <Text style={S.headingLg}>¿Olvidaste tu{'\n'}contraseña?</Text>
          <Text style={[S.body, { marginTop: 8, marginBottom: 32 }]}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </Text>
          <ErrorMsg msg={error} />
          <Input label="Correo electrónico" placeholder="tu@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Btn label="Enviar enlace" onPress={handleSend} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
