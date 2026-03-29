import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView, Animated, Easing, Image
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { operationService } from '@/services/dataService';
import { StatusBadge, Spinner } from '@/components/ui';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import { fmt, fmtDate } from '@/utils/format';
import type { Operacion } from '@/types';

/* ─── Paleta local (idéntica al HomeScreen) ───────────────── */
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

/* ─── Logo + wordmark (idéntico al HomeScreen) ────────────── */
const Logo = () => (
  <Image
    source={require('../../assets/loginicono.png')}
    style={{ width: 150, height: 50 }}
    resizeMode="contain"
  />
);

const FILTERS = [
  { label: 'Todas',      value: 'all' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Aprobadas',  value: 'aprobada' },
  { label: 'Rechazadas', value: 'rechazada' },
];

export default function OperationsScreen() {
  const insets   = useSafeAreaInsets();
  const [ops,        setOps]        = useState<Operacion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('all');

  // Animación entrada
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-16)).current;
  const fadeList   = useRef(new Animated.Value(0)).current;
  const slideList  = useRef(new Animated.Value(20)).current;

  const load = useCallback(async () => {
    setLoading(true);
    try { setOps(await operationService.getAll()); }
    catch { } finally { setLoading(false); }
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  useEffect(() => {
    load();
    const enter = (fade: Animated.Value, slide: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]);
    Animated.parallel([
      enter(fadeHeader, slideHeader, 0),
      enter(fadeList,   slideList,   140),
    ]).start();
  }, []);

  const filtered = filter === 'all' ? ops : ops.filter(o => o.estado === filter);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Header ── */}
      <Animated.View style={[s.headerWrap, { paddingTop: insets.top + 10, opacity: fadeHeader, transform: [{ translateY: slideHeader }] }]}>
        <View style={s.headerRow}>
          <Logo />
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => router.push('/operation/new')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={C.accentDark} />
          </TouchableOpacity>
        </View>

        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Operaciones</Text>
          <View style={s.countChip}>
            <Text style={s.countTxt}>{ops.length} en total</Text>
          </View>
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[s.chip, filter === value && s.chipActive]}
              onPress={() => setFilter(value)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipTxt, filter === value && s.chipTxtActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Lista ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="large" />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeList, transform: [{ translateY: slideList }] }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.accent}
                colors={[C.accent]}
              />
            }
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Ionicons name="swap-horizontal" size={44} color={C.textMuted} />
                <Text style={s.emptyTxt}>
                  {filter !== 'all' ? 'Sin operaciones con ese filtro' : 'Realiza tu primera operación'}
                </Text>
                {filter === 'all' && (
                  <TouchableOpacity
                    style={s.newOpBtn}
                    onPress={() => router.push('/operation/new')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="flash" size={16} color={C.accentDark} />
                    <Text style={s.newOpTxt}>Nueva operación</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <OpCard op={item} onPress={() => router.push(`/operation/${item.id}`)} />
            )}
          />
        </Animated.View>
      )}

      
    </View>
  );
}

/* ── Op Card ─────────────────────────────────────────────── */
const OpCard = ({ op, onPress }: { op: Operacion; onPress: () => void }) => {
  const isCompra  = op.tipo === 'compra';
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 60 }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[s.card, { transform: [{ scale: pressAnim }] }]}>

        {/* ── Fila superior: tipo + estado + flecha ── */}
        <View style={s.cardTop}>
          <View style={[s.iconBox, { backgroundColor: isCompra ? C.successDim : C.accentDim }]}>
            <Ionicons
              name={isCompra ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={isCompra ? C.success : C.accent}
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.cardType}>{isCompra ? 'Compra de USD' : 'Venta de USD'}</Text>
            <Text style={s.cardRef}>
              {op.codigo ? `#${op.codigo}` : `#${op.id.slice(0, 8).toUpperCase()}`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={op.estado} />
            <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={s.cardDivider} />

        {/* ── Fila montos ── */}
        <View style={s.cardAmounts}>
          <View style={s.amountCol}>
            <Text style={s.amountLabel}>ENVÍAS</Text>
            <Text style={s.amountValue}>{fmt(op.monto_envia, op.moneda_envia)}</Text>
          </View>
          <View style={s.amountArrow}>
            <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
          </View>
          <View style={[s.amountCol, { alignItems: 'flex-end' }]}>
            <Text style={s.amountLabel}>RECIBES</Text>
            <Text style={[s.amountValue, { color: C.accentLight }]}>
              {fmt(op.monto_recibe, op.moneda_recibe)}
            </Text>
          </View>
        </View>

        {/* ── Fila inferior: tasa + fecha ── */}
        <View style={s.cardFooter}>
          <Text style={s.cardFooterTxt}>
            Tasa{' '}
            <Text style={{ color: C.textSecond, fontWeight: '700' }}>
              {op.tasa ? op.tasa.toFixed(4) : '—'}
            </Text>
          </Text>
          <Text style={s.cardFooterTxt}>{fmtDate(op.created_at ?? '')}</Text>
        </View>

      </Animated.View>
    </TouchableOpacity>
  );
};

/* ── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({

  // Header
  headerWrap:  { paddingHorizontal: 30, paddingBottom: 6, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  countChip:   { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 3 },
  countTxt:    { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  addBtn:      { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6 },

  // Filters
  filterRow:     { paddingVertical: 10, gap: 8, paddingRight: 30 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive:    { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: C.textMuted },
  chipTxtActive: { color: C.accentDark },

  // List
  listContent: { padding: 20, paddingHorizontal: 30, gap: 10, paddingBottom: 100 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyTxt:  { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  newOpBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  newOpTxt:  { fontSize: 14, fontWeight: '800', color: C.accentDark },

  // Cards
  card:         { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:      { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardType:     { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  cardRef:      { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  cardDivider:  { height: 1, backgroundColor: C.border },
  cardAmounts:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountCol:    { gap: 4 },
  amountLabel:  { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },
  amountValue:  { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  amountArrow:  { width: 28, height: 28, borderRadius: 14, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooterTxt:{ fontSize: 11, color: C.textMuted, fontWeight: '500' },
});