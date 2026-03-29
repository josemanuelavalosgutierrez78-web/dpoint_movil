import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { operationService } from '@/services/dataService';
import { parseApiError } from '@/services/api';
import { StatusBadge, Button, Spinner, ScreenHeader } from '@/components/ui';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import { fmt, fmtDateLong, maskAcct } from '@/utils/format';
import type { Operacion, Moneda } from '@/types';

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
  warningDim:   '#2a1f08',
};

// Extiende Operation localmente para los campos de cuenta como objetos
interface CuentaDetalle {
  banco: string;
  numero_cuenta: string;
  moneda: Moneda;
}

interface OperationDetail extends Omit<Operacion, 'cuenta_destino'> {
  cuenta_origen?: CuentaDetalle | null;
  cuenta_destino?: CuentaDetalle | string | null;
  numero_operacion?: string | null;  // ← agregar
}

export default function OperationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [op, setOp] = useState<OperationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    operationService.getById(id)
      .then((data) => setOp(data as OperationDetail))
      .catch((err) => Toast.show({ type: 'error', text1: parseApiError(err) }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!op) return;
    await Share.share({
      message: `Operación DollarPoint\nCódigo: #${op.codigo}\nEnvié: ${fmt(op.monto_envia, op.moneda_envia)}\nRecibí: ${fmt(op.monto_recibe, op.moneda_recibe)}\nEstado: ${op.estado}`,
    });
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="large" />
    </View>
  );

  if (!op) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: Sp.lg }}>
      <Text style={{ color: C.textMuted }}>Operación no encontrada</Text>
      <Button label="Volver" onPress={() => router.back()} />
    </View>
  );

  const done = op.estado === 'completada';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Detalle de operación" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Status banner */}
        <View style={[s.banner, {
          backgroundColor: done ? C.successDim : C.warningDim,
          borderColor: done ? 'rgba(0,232,154,0.2)' : 'rgba(251,191,36,0.2)',
        }]}>
          <View>
            <Text style={{ fontSize: Fs.xs, color: C.textMuted, marginBottom: 4 }}>Estado</Text>
            <StatusBadge status={op.estado} />
          </View>
          <View style={[s.estadoIcon, { backgroundColor: done ? C.successDim : C.warningDim }]}>
            <Ionicons
              name={done ? 'checkmark-done-outline' : 'time-outline'}
              size={28}
              color={done ? C.success : '#fbbf24'}
            />
          </View>
        </View>

        {/* Montos principales */}
        <View style={s.amtCard}>
          <Text style={s.amtMini}>Enviaste</Text>
          <Text style={s.amtValue}>{fmt(op.monto_envia, op.moneda_envia)}</Text>
          <View style={s.rateDivRow}>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            <Text style={s.rateDivTxt}>↓ Tasa {op.tasa?.toFixed(4)}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          </View>
          <Text style={s.amtMini}>Recibes</Text>
          <Text style={[s.amtValue, { color: C.accentLight }]}>{fmt(op.monto_recibe, op.moneda_recibe)}</Text>
        </View>

        {/* Detalles */}
        <View style={s.card}>
  <Text style={s.sLabel}>DETALLES</Text>
  <Row label="Referencia" value={`#${op.codigo}`} mono />
  <Row label="Tipo"       value={op.tipo === 'compra' ? 'Compra de USD' : 'Venta de USD'} />
  {op.numero_operacion && (
    <Row label="N° operación" value={op.numero_operacion} mono />
  )}
  <Row label="Fecha" value={fmtDateLong(op.created_at ?? '')} last />
</View>
        {/* Cuentas */}
        {(op.cuenta_destino || op.banco_destino) && (
          <View style={s.card}>
            <Text style={s.sLabel}>CUENTA DESTINO</Text>
            {op.banco_destino && (
              <Row label="Banco" value={op.banco_destino} />
            )}
            {op.cuenta_destino && (
              <Row label="Número de cuenta" value={op.cuenta_destino as string} last={!op.banco_destino} />
            )}
          </View>
        )}

        {/* Acciones */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={15} color={C.textSecond} />
            <Text style={s.actionTxt}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => Toast.show({ type: 'info', text1: 'Próximamente' })}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={15} color={C.textSecond} />
            <Text style={s.actionTxt}>Descargar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Subcomponentes ───────────────────────────────────────

const Row = ({
  label, value, mono, last,
}: {
  label: string; value: string; mono?: boolean; last?: boolean;
}) => (
  <View style={[s.row, !last && s.rowBorder]}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, mono && { fontVariant: ['tabular-nums'] }]}>{value}</Text>
  </View>
);

const AcctRow = ({
  label, bank, num, cur, last,
}: {
  label: string; bank: string; num: string; cur: string; last?: boolean;
}) => (
  <View style={[s.row, !last && s.rowBorder]}>
    <View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{bank}</Text>
      <Text style={s.rowMuted}>{num} · {cur}</Text>
    </View>
    <Ionicons name="card-outline" size={20} color={C.accent} />
  </View>
);

// ─── Estilos ──────────────────────────────────────────────

const s = StyleSheet.create({
  scroll:     { padding: Sp.xl, gap: Sp.lg, paddingBottom: 48 },

  // Banner estado
  banner:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: R.lg, borderWidth: 1, padding: Sp.lg },
  estadoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  // Card de montos
  amtCard:    { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: Sp.sm, padding: Sp.xxl },
  amtMini:    { fontSize: Fs.sm, color: C.textMuted },
  amtValue:   { fontSize: Fs.xxxl, fontWeight: '800', color: C.textPrimary, letterSpacing: -1 },
  rateDivRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm, width: '100%', marginVertical: Sp.sm },
  rateDivTxt: { fontSize: Fs.xs, color: C.textMuted, paddingHorizontal: Sp.sm },

  // Card genérica
  card:       { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: Sp.lg },
  sLabel:     { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1.2, marginBottom: Sp.md },

  // Filas
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Sp.md },
  rowBorder:  { borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel:   { fontSize: Fs.sm, color: C.textMuted },
  rowValue:   { fontSize: Fs.sm, fontWeight: '700', color: C.textPrimary, maxWidth: '55%', textAlign: 'right' },
  rowMuted:   { fontSize: Fs.xs, color: C.textMuted, marginTop: 2, textAlign: 'right' },

  // Acciones
  actions:    { flexDirection: 'row', gap: Sp.md },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, paddingVertical: 13 },
  actionTxt:  { fontSize: Fs.sm, fontWeight: '600', color: C.textSecond },
});