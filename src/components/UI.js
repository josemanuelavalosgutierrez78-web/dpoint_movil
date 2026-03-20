import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet
} from 'react-native';
import { C, S } from '../theme';

// ─── Button ──────────────────────────────────────────────────────────────────
export function Btn({ label, onPress, loading, style, textStyle, outline }) {
  return (
    <TouchableOpacity
      style={[outline ? S.btnOutline : S.btnPrimary, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color={outline ? C.cyan : '#07111C'} />
        : <Text style={[outline ? S.btnOutlineText : S.btnPrimaryText, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={S.inputLabel}>{label}</Text>}
      <TextInput
        style={[S.input, error && { borderColor: C.red }, style]}
        placeholderTextColor={C.t3}
        {...props}
      />
      {error && <Text style={{ color: C.red, fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[S.card, style]}>{children}</View>;
}

// ─── StatusPill ──────────────────────────────────────────────────────────────
const pillColors = {
  completada: { bg: C.greenDim, text: C.green },
  pendiente:  { bg: C.amberDim, text: C.amber },
  en_proceso: { bg: C.cyanDim,  text: C.cyan  },
  rechazada:  { bg: C.redDim,   text: C.red   },
};

export function StatusPill({ status }) {
  const label = {
    completada: 'Completada',
    pendiente:  'Pendiente',
    en_proceso: 'En proceso',
    rechazada:  'Rechazada',
  }[status] || status;

  const colors = pillColors[status] || pillColors.pendiente;

  return (
    <View style={[S.pill, { backgroundColor: colors.bg }]}>
      <Text style={[S.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({ title, link, onLink }) {
  return (
    <View style={[S.between, { marginBottom: 14 }]}>
      <Text style={S.sectionTitle}>{title}</Text>
      {link && (
        <TouchableOpacity onPress={onLink}>
          <Text style={{ fontSize: 12, color: C.cyan }}>{link}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ErrorMsg ────────────────────────────────────────────────────────────────
export function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <View style={{ backgroundColor: C.redDim, borderRadius: 12, padding: 12, marginBottom: 16 }}>
      <Text style={{ color: C.red, fontSize: 13 }}>{msg}</Text>
    </View>
  );
}

// ─── LoadingScreen ───────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={[S.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={C.cyan} size="large" />
    </View>
  );
}

// ─── BackBtn ─────────────────────────────────────────────────────────────────
export function BackBtn({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: C.bgCard,
        borderWidth: 1, borderColor: C.borderSub,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}
    >
      <Text style={{ color: C.t1, fontSize: 18 }}>←</Text>
    </TouchableOpacity>
  );
}
