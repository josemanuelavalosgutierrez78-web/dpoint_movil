import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, ErrorMsg } from '../components/UI';
import { C, S } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      // AuthContext actualiza user → Navigator redirige automático
    } catch (e) {
      setError(e.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 28, paddingTop: 48, paddingBottom: 32 }}>
            <View style={{
              width: 60, height: 60,
              backgroundColor: C.cyan,
              borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#07111C' }}>$</Text>
            </View>
            <Text style={S.headingLg}>Bienvenido{'\n'}de vuelta 👋</Text>
            <Text style={[S.body, { marginTop: 8 }]}>Ingresa a tu cuenta DollarPoint</Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 28, flex: 1 }}>
            <ErrorMsg msg={error} />
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Btn
              label="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', marginTop: 20
            }}>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ fontSize: 13, color: C.cyan }}>Crear cuenta</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={{ fontSize: 13, color: C.cyan }}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{
            textAlign: 'center', fontSize: 11, color: C.t3,
            paddingVertical: 24
          }}>
            DollarPoint X · Casa de Cambio Digital
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
