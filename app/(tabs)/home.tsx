import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, Animated, Easing, Image} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { exchangeService } from '@/services/dataService';
import { useAuthStore } from '@/context/authStore';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import { fmt, fmtDate } from '@/utils/format';
import type { TasaCambio, Moneda } from '@/types';

/* ─── Paleta local ────────────────────────────────────────── */
const C = {
  bg:           '#0b1929',
  card:         '#112236',
  cardHigh:     '#162d44',
  input:        '#1a3050',
  border:       '#253f5e',
  borderBright: '#3a6a94',
  textPrimary:  '#ffffff',
  textSecond:   '#cce4f8',
  textMuted:    '#9ec4e0',
  accent:       '#06b6d4',
  accentLight:  '#7ef0ff',
  accentDark:   '#083344',
  accentDim:    '#082030',
  success:      '#00e89a',
  successDim:   '#072e1f',
  skeleton:     '#1e3d5c',
};

/* ─── Logo + wordmark (estilo web) ───────────────────────── */
const Logo = () => (
  <Image
    source={require('../../assets/loginicono.png')}
    style={{ width: 150, height: 50}}
    resizeMode="contain"
  />
);
/* ─── Animated pulse dot ──────────────────────────────────── */
const PulseDot = () => {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 850, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 1,    duration: 850, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[p.dot, { opacity: anim }]} />;
};

type Tab = 'compra' | 'venta';

export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const user     = useAuthStore((s) => s.user);
  const name     = (user as any)?.nombre?.split(' ')[0] || 'Usuario';
  const initials = (user as any)?.nombre?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'U';

  const [rate,        setRate]        = useState<TasaCambio | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [simAmt,      setSimAmt]      = useState('');
  const [activeTab,   setActiveTab]   = useState<Tab>('compra');

  // Animaciones de entrada escalonadas
  const fadeHeader  = useRef(new Animated.Value(0)).current;
  const fadeTabs    = useRef(new Animated.Value(0)).current;
  const fadeSim     = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-16)).current;
  const slideTabs   = useRef(new Animated.Value(20)).current;
  const slideSim    = useRef(new Animated.Value(24)).current;

  // Animación botón swap
  const swapRotate = useRef(new Animated.Value(0)).current;

  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const loadRate = useCallback(async (silent = false) => {
    if (!silent) setLoadingRate(true);
    try { setRate(await exchangeService.getRate()); }
    catch { } finally { setLoadingRate(false); }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRate(true);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRate();
    const t = setInterval(() => loadRate(true), 60_000);

    const enter = (fade: Animated.Value, slide: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]);

    Animated.parallel([
      enter(fadeHeader, slideHeader, 0),
      enter(fadeTabs,   slideTabs,   140),
      enter(fadeSim,    slideSim,    260),
    ]).start();

    return () => clearInterval(t);
  }, []);

  const BONUS_EMPRESA = 0.002;
  const esEmpresa = user?.tipo_cliente === 'empresa';
  const buyRate   = rate ? rate.compra + (esEmpresa ? BONUS_EMPRESA : 0) : 0;
  const sellRate  = rate ? rate.venta  - (esEmpresa ? BONUS_EMPRESA : 0) : 0;
  const amtNum      = parseFloat(simAmt) || 0;
  const sendCur: Moneda    = activeTab === 'compra' ? 'USD' : 'PEN';
  const receiveCur: Moneda = activeTab === 'compra' ? 'PEN' : 'USD';
  const appliedRate        = activeTab === 'compra' ? buyRate : sellRate;
  const result             = amtNum > 0
    ? (activeTab === 'compra' ? amtNum * buyRate : amtNum / sellRate)
    : 0;

  const handleSwap = () => {
    Animated.sequence([
      Animated.timing(swapRotate, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.back(1.4)) }),
      Animated.timing(swapRotate, { toValue: 0, duration: 0,   useNativeDriver: true }),
    ]).start();
    setActiveTab(t => t === 'compra' ? 'venta' : 'compra');
  };

  const handleTabChange = (tab: Tab) => { setActiveTab(tab); setSimAmt(''); };

  const swapSpin = swapRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8, paddingBottom: 110 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[s.header, { opacity: fadeHeader, transform: [{ translateY: slideHeader }] }]}>
  <Logo />
  <View style={{ alignItems: 'flex-end' }}>
    <Text style={s.greet}>{greet},</Text>
    <Text style={s.username}>{name}</Text>
  </View>
</Animated.View>

        {/* ── Tabs Compra / Venta ── */}
        <Animated.View style={[s.tabsRow, { opacity: fadeTabs, transform: [{ translateY: slideTabs }] }]}>
          {(['compra', 'venta'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            const tabRate  = tab === 'compra' ? buyRate : sellRate;
            return (
              <TouchableOpacity
                key={tab}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.75}
              >
                <View style={s.tabTopRow}>
                  <Ionicons
                    name={tab === 'compra' ? 'trending-up' : 'trending-down'}
                    size={13}
                    color={isActive ? C.accentDark : (tab === 'compra' ? C.success : C.accent)}
                  />
                  <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                    {tab === 'compra' ? 'COMPRA' : 'VENTA'}
                  </Text>
                </View>
                {loadingRate
                  ? <View style={s.tabRateSkeleton} />
                  : <Text style={[s.tabRate, isActive && s.tabRateActive]}>
                      {tabRate > 0 ? tabRate.toFixed(3) : '–'}
                    </Text>
                }
                <Text style={[s.tabSub, isActive && { color: C.accentDark + 'bb' }]}>
                  {tab === 'compra' ? 'USD → PEN' : 'PEN → USD'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── Simulador ── */}
        <Animated.View style={[s.simCard, { opacity: fadeSim, transform: [{ translateY: slideSim }] }]}>

          <Text style={s.simTitle}>Simulador de cambio</Text>

          {/* Envías */}
          <View style={[s.simRow, s.simRowReceive]}>
            <View style={s.simRowLeft}>
              <Text style={[s.simRowLabel, { color: C.accentLight }]}>Envías</Text>
              <TextInput
                style={s.simBigInput}
                placeholder="0.00"
                placeholderTextColor={C.textMuted}
                keyboardType="decimal-pad"
                value={simAmt}
                onChangeText={setSimAmt}
                selectionColor={C.accent}
              />
            </View>
            <View style={[s.curPill, { backgroundColor: C.cardHigh, borderWidth: 1, borderColor: C.borderBright }]}>
              <Text style={[s.curPillTxt, { color: C.textSecond }]}>{sendCur}</Text>
            </View>
          </View>

          {/* Swap */}
          <View style={s.swapRow}>
            <View style={s.swapLine} />
            <TouchableOpacity onPress={handleSwap} activeOpacity={0.75}>
              <Animated.View style={[s.swapBtn, { transform: [{ rotate: swapSpin }] }]}>
                <Ionicons name="swap-vertical" size={22} color={C.accentDark} />
              </Animated.View>
            </TouchableOpacity>
            <View style={s.swapLine} />
          </View>

          {/* Recibes */}
          <View style={[s.simRow, s.simRowReceive]}>
            <View style={s.simRowLeft}>
              <Text style={[s.simRowLabel, { color: C.accentLight }]}>Recibes</Text>
              <Text style={[s.simBigResult, result > 0 && { color: C.accentLight }]}>
                {result > 0 ? result.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={[s.curPill, { backgroundColor: C.cardHigh, borderWidth: 1, borderColor: C.borderBright }]}>
              <Text style={[s.curPillTxt, { color: C.textSecond }]}>{receiveCur}</Text>
            </View>
          </View>

          {/* Info tasa */}
          <View style={s.rateInfoRow}>
            <View style={s.rateChip}>
              <Text style={s.rateChipTxt}>
                Tasa{'  '}
                <Text style={{ color: C.accentLight, fontWeight: '800' }}>
                  {appliedRate > 0 ? appliedRate.toFixed(4) : '–'}
                </Text>
              </Text>
          {esEmpresa && (
  <Text style={{ fontSize: 10, color: C.accent, fontWeight: '700' }}>
    ✦ Tasa preferencial
  </Text>
)}
            </View>
            <View style={s.liveChip}>
              <PulseDot />
              <Text style={s.liveTxt}>En vivo</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.newOpBtn}
            activeOpacity={0.82}
            onPress={() => router.push('/operation/new')}
          >
            <Ionicons name="flash" size={18} color={C.accentDark} />
            <Text style={s.newOpTxt}>Iniciar operación</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Banner empresas ── */}
        <View style={s.banner}>
          <View style={s.bannerLeft}>
            <View style={s.bannerBadge}>
              <View style={s.bannerBadgeDot} />
              <Text style={s.bannerBadgeTxt}>PARA EMPRESAS</Text>
            </View>
            <Text style={s.bannerTitle}>
              Cambia divisas al{' '}
              <Text style={{ color: C.accent }}>mejor tipo de cambio</Text>
              {' '}para tu empresa
            </Text>
            <View style={s.bannerStats}>
              <View style={s.bannerStat}>
                <Text style={s.bannerStatVal}>24/7</Text>
                <Text style={s.bannerStatLbl}>Disponible</Text>
              </View>
              <View style={s.bannerDivider} />
              <View style={s.bannerStat}>
                <Text style={s.bannerStatVal}>&lt;2min</Text>
                <Text style={s.bannerStatLbl}>Por operación</Text>
              </View>
            </View>
          </View>
          <View style={s.bannerRight}>
            <Text style={s.bannerContactLbl}>Contáctanos</Text>
            <TouchableOpacity style={s.bannerBtn} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={15} color={C.accentDark} />
              <Text style={s.bannerBtnTxt}>927 457 619</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <WhatsAppFAB />
    </View>
  );
}

/* ─── Pulse dot styles ───────────────────────────────────── */
const p = StyleSheet.create({
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
});

/* ── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  scroll: { gap: 14, paddingHorizontal: 30 },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  greet:      { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  username:   { fontSize: 17, fontWeight: '800', color: C.accent, letterSpacing: -0.2 },

  // Tabs
  tabsRow:         { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginHorizontal: 6 },
  tab:             { flex: 1, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 3 },
  tabActive:       { backgroundColor: C.accent },
  tabTopRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabLabel:        { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
  tabLabelActive:  { color: C.accentDark },
  tabRate:         { fontSize: 24, fontWeight: '800', color: C.textPrimary, letterSpacing: -1 },
  tabRateActive:   { color: C.accentDark },
  tabSub:          { fontSize: 10, color: C.textMuted, fontWeight: '500' },
  tabRateSkeleton: { width: 70, height: 28, borderRadius: 7, backgroundColor: C.skeleton },

  // Sim card
  simCard:      { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 14, gap: 9, marginHorizontal: 6 },
  simTitle:     { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  simRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', minHeight: 66 },
  simRowReceive:{ borderColor: C.borderBright, backgroundColor: C.accentDim },
  simRowLeft:   { flex: 1, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center', gap: 2 },
  simRowLabel:  { fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  simBigInput:  { fontSize: 26, fontWeight: '800', color: C.textPrimary, padding: 0, margin: 0, letterSpacing: -1 },
  simBigResult: { fontSize: 26, fontWeight: '800', color: C.textMuted, letterSpacing: -1 },
  curPill:      { width: 60, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  curPillTxt:   { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Swap
  swapRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: -4 },
  swapLine: { flex: 1, height: 1, backgroundColor: C.border },
  swapBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },

  // Rate info
  rateInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  rateChip:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rateChipTxt: { fontSize: 12, color: C.textSecond, fontWeight: '600' },
  rateChipSub: { fontSize: 11, color: C.textMuted },
  liveChip:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveTxt:     { fontSize: 11, color: C.textMuted, fontWeight: '500' },

  // CTA
  newOpBtn: { height: 46, borderRadius: 14, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 9 },
  newOpTxt: { fontSize: 15, fontWeight: '800', color: C.accentDark, letterSpacing: 0.2 },

  // Banner empresas
  banner:         { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.borderBright, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 6 },
  bannerLeft:     { flex: 1, gap: 8 },
  bannerBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.borderBright, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  bannerBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  bannerBadgeTxt: { fontSize: 9, fontWeight: '700', color: C.accent, letterSpacing: 1 },
  bannerTitle:    { fontSize: 13, fontWeight: '700', color: C.textPrimary, lineHeight: 19 },
  bannerStats:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  bannerStat:     { gap: 1 },
  bannerStatVal:  { fontSize: 14, fontWeight: '800', color: C.accent, letterSpacing: -0.3 },
  bannerStatLbl:  { fontSize: 10, color: C.textMuted, fontWeight: '500' },
  bannerDivider:  { width: 1, height: 24, backgroundColor: C.border },
  bannerRight:    { alignItems: 'center', gap: 5 },
  bannerContactLbl: { fontSize: 10, color: C.textMuted, fontWeight: '500' },
  bannerBtn:      { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5, shadowColor: C.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  bannerBtnTxt:   { fontSize: 13, fontWeight: '800', color: C.accentDark, letterSpacing: 0.3 },

});