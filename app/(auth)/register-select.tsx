import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Image, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:           '#0b1929',
  card:         '#112236',
  cardActive:   'rgba(6,182,212,0.12)',
  border:       '#253f5e',
  borderActive: '#06b6d4',
  textPrimary:  '#ffffff',
  textMuted:    '#9ec4e0',
  accent:       '#06b6d4',
  accentDark:   '#083344',
  accentDim:    'rgba(6,182,212,0.08)',
  accentMid:    'rgba(6,182,212,0.2)',
};

type TipoRegistro = 'natural' | 'empresa' | null;

const CheckIcon = () => (
  <View style={st.checkCircle}>
    <Ionicons name="checkmark" size={12} color={C.accentDark} />
  </View>
);

const FeatureItem = ({ label }: { label: string }) => (
  <View style={st.featureRow}>
    <View style={st.featureDot} />
    <Text style={st.featureTxt}>{label}</Text>
  </View>
);

export default function RegisterSelectScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<TipoRegistro>(null);

  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(24)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  const handleSelect = (tipo: TipoRegistro) => {
    setSelected(tipo);
    Animated.sequence([
      Animated.timing(scaleBtn, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleBtn, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleContinuar = () => {
    if (!selected) return;
    router.push(selected === 'natural' ? '/(auth)/register' : '/(auth)/register-empresa');
  };

  return (
    <View style={[st.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Botón volver ── */}
        <TouchableOpacity
          style={st.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text style={st.backTxt}>Volver</Text>
        </TouchableOpacity>

        {/* ── Logo + título ── */}
        <Animated.View style={[st.logoWrap, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Image
            source={require('../../assets/loginicono.png')}
            style={{ width: 130, height: 50 }}
            resizeMode="contain"
          />
          <Text style={st.title}>Crea tu cuenta</Text>
          <Text style={st.subtitle}>¿Cómo quieres registrarte?</Text>
        </Animated.View>

        {/* ── Cards ── */}
        <Animated.View style={[st.cardsRow, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* Persona Natural */}
          <TouchableOpacity
            style={[
              st.card,
              selected === 'natural' && st.cardActive,
            ]}
            onPress={() => handleSelect('natural')}
            activeOpacity={0.85}
          >
            {selected === 'natural' && <CheckIcon />}
            <View style={[st.iconWrap, selected === 'natural' && st.iconWrapActive]}>
              <Ionicons name="person-outline" size={26} color={C.accent} />
            </View>
            <Text style={st.cardTitle}>Persona Natural</Text>
            <Text style={st.cardDesc}>Para cambios personales con tu DNI</Text>
            <View style={st.featureList}>
              {['Registro con DNI', 'Cambios rápidos', 'Sin límite mínimo'].map(f => (
                <FeatureItem key={f} label={f} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Empresa */}
          <TouchableOpacity
            style={[
              st.card,
              selected === 'empresa' && st.cardActive,
            ]}
            onPress={() => handleSelect('empresa')}
            activeOpacity={0.85}
          >
            {selected === 'empresa' && <CheckIcon />}
            <View style={[st.iconWrap, selected === 'empresa' && st.iconWrapActive]}>
              <Ionicons name="business-outline" size={26} color={C.accent} />
            </View>
            <Text style={st.cardTitle}>Empresa</Text>
            <Text style={st.cardDesc}>Para empresas con RUC y mayores volúmenes</Text>
            <View style={st.featureList}>
              {['Registro con RUC', 'Tasa preferencial', 'Montos mayores'].map(f => (
                <FeatureItem key={f} label={f} />
              ))}
            </View>
          </TouchableOpacity>

        </Animated.View>

        {/* ── Botón Continuar ── */}
        <Animated.View style={{ transform: [{ scale: scaleBtn }], marginHorizontal: 4, marginTop: 8 }}>
          <TouchableOpacity
            style={[st.continueBtn, !selected && st.continueBtnDisabled]}
            onPress={handleContinuar}
            activeOpacity={selected ? 0.82 : 1}
            disabled={!selected}
          >
            <Text style={[st.continueTxt, !selected && st.continueTxtDisabled]}>
              Continuar
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Link login ── */}
        <View style={st.loginRow}>
          <Text style={st.loginTxt}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.75}>
            <Text style={st.loginLink}>Ingresar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, gap: 20 },

  // Back
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    marginTop: 12, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
  },
  backTxt: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  // Logo
  logoWrap: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  title:    { fontSize: 26, fontWeight: '800', color: C.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

  // Cards row
  cardsRow: { flexDirection: 'row', gap: 12 },

  // Card
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.border,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
    position: 'relative',
  },
  cardActive: {
    backgroundColor: C.cardActive,
    borderColor: C.borderActive,
  },

  // Check
  checkCircle: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  // Icon
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: C.accentMid },

  // Card text
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  cardDesc:  { fontSize: 11, color: C.textMuted, lineHeight: 16 },

  // Features
  featureList: { gap: 6, width: '100%', marginTop: 2 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  featureTxt:  { fontSize: 11, color: C.textMuted },

  // Continuar
  continueBtn: {
    height: 54, borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(6,182,212,0.2)',
    shadowOpacity: 0, elevation: 0,
  },
  continueTxt: { fontSize: 16, fontWeight: '800', color: C.accentDark },
  continueTxtDisabled: { color: C.textMuted },

  // Login
  loginRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  loginTxt: { fontSize: 13, color: C.textMuted },
  loginLink:{ fontSize: 13, color: C.accent, fontWeight: '700' },
});