import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusPill, BackBtn } from '../components/UI';
import { C, S } from '../theme';

export default function DetalleOperacionScreen({ navigation, route }) {
  const { op } = route.params;

  const rows = [
    ['Código',        op.codigo || `OP-${op.id}`],
    ['Estado',        null, op.estado],
    ['Enviaste',      `${op.monto_origen} ${op.moneda_origen}`],
    ['Recibirás',     `${op.monto_destino} ${op.moneda_destino}`, null, true],
    ['Tipo de cambio',`1 USD = ${op.tasa_aplicada || '—'}`],
    ['Cuenta destino',op.cuenta_destino ? `${op.cuenta_destino.banco} •••• ${op.cuenta_destino.numero_cuenta?.slice(-4)}` : '—'],
    ['Comisión',      'S/ 0.00'],
    ['Fecha',         op.created_at ? new Date(op.created_at).toLocaleString('es-PE') : '—'],
  ];

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <BackBtn onPress={() => navigation.goBack()} />

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 70, height: 70, borderRadius: 35,
            backgroundColor: op.estado === 'completada' ? C.greenDim : op.estado === 'pendiente' ? C.amberDim : C.cyanDim,
            borderWidth: 2,
            borderColor: op.estado === 'completada' ? C.green : op.estado === 'pendiente' ? C.amber : C.cyan,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 30 }}>
              {op.estado === 'completada' ? '✓' : op.estado === 'pendiente' ? '⏳' : '↗'}
            </Text>
          </View>
          <Text style={S.headingMd}>{op.codigo || `OP-${op.id}`}</Text>
          <View style={{ marginTop: 8 }}>
            <StatusPill status={op.estado} />
          </View>
        </View>

        <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18 }}>
          {rows.map(([key, val, status, highlight], i) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: C.borderSub }}>
              <Text style={{ fontSize: 13, color: C.t2 }}>{key}</Text>
              {status
                ? <StatusPill status={status} />
                : <Text style={{ fontSize: 13, fontWeight: '600', color: highlight ? C.cyan : C.t1 }}>{val}</Text>
              }
            </View>
          ))}
        </View>

        {op.estado === 'pendiente' && (
          <View style={{ backgroundColor: C.amberDim, borderRadius: 14, padding: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 13, color: C.amber, fontWeight: '600', marginBottom: 6 }}>
              ⏳ Acción requerida
            </Text>
            <Text style={{ fontSize: 12, color: C.t2, lineHeight: 18 }}>
              Transfiere el monto a nuestra cuenta bancaria y sube el comprobante de pago para que podamos procesar tu operación.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
