import React, { useState } from 'react';
import {
  View, Text, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, ErrorMsg, BackBtn } from '../components/UI';
import { C, S } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', dni: '',
    phone: '', email: '', password: '', confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  function set(field) { return (v) => setForm(f => ({ ...f, [field]: v })); }

  async function handleRegister() {
    const { first_name, last_name, dni, phone, email, password, confirm } = form;
    if (!first_name || !last_name || !dni || !email || !password)
      { setError('Completa todos los campos'); return; }
    if (password !== confirm)
      { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8)
      { setError('La contraseña debe tener al menos 8 caracteres'); return; }

    setLoading(true); setError('');
    try {
      await register({ first_name, last_name, dni, phone, email, password });
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={[S.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📧</Text>
        <Text style={[S.headingMd, { textAlign: 'center', marginBottom: 12 }]}>
          ¡Revisa tu correo!
        </Text>
        <Text style={[S.body, { textAlign: 'center', marginBottom: 32 }]}>
          Te enviamos un enlace para verificar tu cuenta en {form.email}
        </Text>
        <Btn label="Ir al inicio de sesión" onPress={() => navigation.navigate('Login')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          <BackBtn onPress={() => navigation.goBack()} />
          <Text style={S.headingLg}>Crea tu{'\n'}cuenta</Text>
          <Text style={[S.body, { marginTop: 8, marginBottom: 28 }]}>
            Regístrate en DollarPoint X
          </Text>

          <ErrorMsg msg={error} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Nombres" placeholder="Carlos" value={form.first_name} onChangeText={set('first_name')} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Apellidos" placeholder="Ríos" value={form.last_name} onChangeText={set('last_name')} />
            </View>
          </View>

          <Input label="DNI" placeholder="12345678" value={form.dni} onChangeText={set('dni')} keyboardType="number-pad" maxLength={8} />
          <Input label="Teléfono" placeholder="+51 999 999 999" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Input label="Correo electrónico" placeholder="tu@correo.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Contraseña" placeholder="Mínimo 8 caracteres" value={form.password} onChangeText={set('password')} secureTextEntry />
          <Input label="Confirmar contraseña" placeholder="Repite tu contraseña" value={form.confirm} onChangeText={set('confirm')} secureTextEntry />

          <Btn label="Crear cuenta" onPress={handleRegister} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
