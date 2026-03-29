import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Animated, Easing, Image
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { cuentaUsuarioService } from '@/services/dataService';
import { parseApiError } from '@/services/api';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import { maskAcct } from '@/utils/format';
import type { CuentaUsuario } from '@/types';

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
  danger:       '#f87171',
  dangerDim:    '#2e0f0f',
  skeleton:     '#1e3d5c',
};

const BANK_COLORS: Record<string, string> = {
  BCP: '#1a69dd', BBVA: '#004481', Interbank: '#00a14b',
  Scotiabank: '#da291c', BanBif: '#e4002b', default: C.accent,
};

const Logo = () => (
  <Image
    source={require('../../assets/loginicono.png')}
    style={{ width: 150, height: 50 }}
    resizeMode="contain"
  />
);

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const [accounts,   setAccounts]   = useState<CuentaUsuario[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const fadeHeader  = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-16)).current;
  const fadeList    = useRef(new Animated.Value(0)).current;
  const slideList   = useRef(new Animated.Value(20)).current;

  const load = useCallback(async () => {
    setLoading(true);
    try { setAccounts(await cuentaUsuarioService.getAll()); }
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

  const handleDelete = (id: string, bankName: string) => {
    Alert.alert(
      'Eliminar cuenta',
      `¿Seguro que quieres eliminar la cuenta de ${bankName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              await cuentaUsuarioService.remove(id);
              setAccounts(prev => prev.filter(a => a.id !== id));
              Toast.show({ type: 'success', text1: 'Cuenta eliminada' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: parseApiError(err) });
            } finally { setDeleting(null); }
          },
        },
      ]
    );
  };

  const penAccounts = accounts.filter(a => a.moneda === 'PEN');
  const usdAccounts = accounts.filter(a => a.moneda === 'USD');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Header ── */}
      <Animated.View style={[s.headerWrap, { paddingTop: insets.top + 10, opacity: fadeHeader, transform: [{ translateY: slideHeader }] }]}>
        <View style={s.headerRow}>
          <Logo />
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/accounts/new')} activeOpacity={0.85}>
            <Ionicons name="add" size={22} color={C.accentDark} />
          </TouchableOpacity>
        </View>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Mis cuentas</Text>
          <View style={s.countChip}>
            <Text style={s.countTxt}>
              {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="large" />
        </View>
      ) : accounts.length === 0 ? (
        <Animated.View style={{ flex: 1, justifyContent: 'center', opacity: fadeList, transform: [{ translateY: slideList }] }}>
          <EmptyState
            icon={<Ionicons name="card-outline" size={52} color={C.textMuted} />}
            title="Sin cuentas registradas"
            subtitle="Agrega tus cuentas bancarias para operar"
            action={
              <Button
                label="Agregar cuenta"
                leftIcon={<Ionicons name="add" size={15} color={C.accentDark} />}
                onPress={() => router.push('/accounts/new')}
              />
            }
          />
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeList, transform: [{ translateY: slideList }] }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />
            }
          >
            {penAccounts.length > 0 && (
              <AccountGroup label="Soles (PEN)" accounts={penAccounts} onDelete={handleDelete} deleting={deleting} />
            )}
            {usdAccounts.length > 0 && (
              <AccountGroup label="Dólares (USD)" accounts={usdAccounts} onDelete={handleDelete} deleting={deleting} />
            )}

            <TouchableOpacity style={s.addDashed} onPress={() => router.push('/accounts/new')} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={20} color={C.accent} />
              <Text style={s.addDashedTxt}>Agregar otra cuenta</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

/* ── Account Group ─────────────────────────────────────────── */
const AccountGroup = ({
  label, accounts, onDelete, deleting,
}: {
  label: string;
  accounts: CuentaUsuario[];
  onDelete: (id: string, name: string) => void;
  deleting: string | null;
}) => (
  <View style={{ gap: 10 }}>
    <Text style={s.groupLabel}>{label}</Text>
    {accounts.map(acc => (
      <AccCard key={acc.id} acc={acc} onDelete={onDelete} deleting={deleting} />
    ))}
  </View>
);

/* ── Acc Card ──────────────────────────────────────────────── */
const AccCard = ({ acc, onDelete, deleting }: {
  acc: CuentaUsuario;
  onDelete: (id: string, name: string) => void;
  deleting: string | null;
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 60 }).start();

  return (
    <Animated.View style={[s.accCard, { transform: [{ scale: pressAnim }] }]}
      onTouchStart={onPressIn} onTouchEnd={onPressOut} onTouchCancel={onPressOut}
    >
      {/* Bank badge */}
      <View style={[s.accBadge, { backgroundColor: BANK_COLORS[acc.banco] || BANK_COLORS.default }]}>
        <Text style={s.accBadgeTxt}>{(acc.banco ?? '?')[0]}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.accBank}>{acc.banco}</Text>
        <Text style={s.accNum}>{maskAcct(acc.numero_cuenta)}</Text>
        <Text style={s.accSub}>{acc.titular}{acc.cci ? ` · CCI: ${maskAcct(acc.cci)}` : ''}</Text>
      </View>

      {/* Right */}
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={[s.curBadge, {
          backgroundColor: acc.moneda === 'USD' ? 'rgba(0,114,255,0.15)' : C.successDim,
        }]}>
          <Text style={[s.curTxt, { color: acc.moneda === 'USD' ? '#4da8ff' : C.success }]}>
            {acc.moneda}
          </Text>
        </View>
        <TouchableOpacity
          style={s.delBtn}
          disabled={deleting === acc.id}
          onPress={() => onDelete(acc.id, acc.banco)}
          activeOpacity={0.8}
        >
          {deleting === acc.id
            ? <Spinner size="small" color={C.danger} />
            : <Ionicons name="trash-outline" size={15} color={C.danger} />
          }
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  headerWrap:  { paddingHorizontal: 30, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  countChip:   { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 3 },
  countTxt:    { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  addBtn:      { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6 },

  listContent: { padding: 20, paddingHorizontal: 30, gap: 16, paddingBottom: 100 },
  groupLabel:  { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  accCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  accBadge:    { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accBadgeTxt: { fontSize: 20, fontWeight: '800', color: '#fff' },
  accBank:     { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  accNum:      { fontSize: 12, color: C.textMuted, fontVariant: ['tabular-nums'] },
  accSub:      { fontSize: 11, color: C.textSecond },

  curBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  curTxt:      { fontSize: 11, fontWeight: '700' },

  delBtn:      { width: 32, height: 32, borderRadius: 9, backgroundColor: C.dangerDim, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', alignItems: 'center', justifyContent: 'center' },

  addDashed:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.borderBright, borderStyle: 'dashed', borderRadius: 16, padding: 16 },
  addDashedTxt: { fontSize: 14, fontWeight: '600', color: C.accent },
});