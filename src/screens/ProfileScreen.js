import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { C, S } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '');

  const sections = [
    {
      items: [
        { icon: '👤', label: 'Datos personales', onPress: () => {} },
        { icon: '📱', label: 'Teléfono verificado', value: user?.phone || '' },
        { icon: '✉️', label: 'Correo electrónico', value: user?.email || '' },
      ]
    },
    {
      items: [
        { icon: '🔐', label: 'Cambiar contraseña', onPress: () => navigation.navigate('ChangePassword') },
        { icon: '🔔', label: 'Notificaciones push', onPress: () => {} },
        { icon: '📄', label: 'Términos y condiciones', onPress: () => {} },
        { icon: '🤝', label: 'Enviar reclamación', onPress: () => navigation.navigate('Reclamacion') },
      ]
    },
    {
      items: [
        { icon: '🚪', label: 'Cerrar sesión', onPress: handleLogout, danger: true },
      ]
    }
  ];

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: 'rgba(0,194,209,0.05)' }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: C.cyan,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            borderWidth: 2, borderColor: C.cyanGlow,
          }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#07111C' }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.t1 }}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
            {user?.email}
            {user?.dni ? ` · DNI ${user.dni}` : ''}
          </Text>
          {user?.is_verified && (
            <View style={{ backgroundColor: C.greenDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: C.green, fontWeight: '600' }}>✓ Cuenta verificada</Text>
            </View>
          )}
        </View>

        {/* Sections */}
        <View style={{ padding: 16, gap: 12 }}>
          {sections.map((section, si) => (
            <View key={si} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 }}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: ii < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: C.borderSub,
                  }}
                  onPress={item.onPress}
                  activeOpacity={item.onPress ? 0.7 : 1}
                >
                  <Text style={{ fontSize: 18, marginRight: 14 }}>{item.icon}</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: item.danger ? C.red : C.t1 }}>{item.label}</Text>
                  {item.value ? (
                    <Text style={{ fontSize: 12, color: C.t3 }}>{item.value}</Text>
                  ) : (
                    <Text style={{ fontSize: 16, color: item.danger ? C.red : C.t3 }}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <Text style={{ textAlign: 'center', fontSize: 11, color: C.t3, paddingVertical: 16 }}>
          DollarPoint X v1.0.0 · Todos los derechos reservados
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
