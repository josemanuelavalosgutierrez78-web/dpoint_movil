import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operacionesAPI } from '../api/client';
import { StatusPill, LoadingScreen } from '../components/UI';
import { C, S } from '../theme';

export default function OperacionesScreen({ navigation }) {
  const [ops, setOps]           = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await operacionesAPI.misOperaciones();
      setOps(Array.isArray(data) ? data : data.operaciones || []);
    } catch {}
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = ops.filter(op => {
    if (filter === 'all') return true;
    if (filter === 'pend') return op.estado === 'pendiente';
    if (filter === 'comp') return op.estado === 'completada';
    return true;
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <Text style={S.headingMd}>Mis Operaciones</Text>
        <Text style={[S.body, { marginTop: 4 }]}>Historial completo</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: C.bgCard2, borderRadius: 12, padding: 4, marginHorizontal: 16, marginBottom: 12 }}>
        {[['all','Todas'],['pend','Pendientes'],['comp','Completadas']].map(([val, label]) => (
          <TouchableOpacity key={val} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: filter === val ? C.bgCard : 'transparent' }} onPress={() => setFilter(val)}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === val ? C.t1 : C.t3 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
            <Text style={{ color: C.t2, fontSize: 15 }}>Sin operaciones</Text>
          </View>
        ) : filtered.map((op, i) => (
          <TouchableOpacity
            key={op.id || i}
            style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => navigation.navigate('DetalleOperacion', { op })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: op.estado === 'completada' ? C.greenDim : op.estado === 'pendiente' ? C.amberDim : C.cyanDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18 }}>{op.estado === 'completada' ? '✓' : op.estado === 'pendiente' ? '⏳' : '↗'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{op.codigo || `OP-${op.id}`}</Text>
              <Text style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                {op.created_at ? new Date(op.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.t1 }}>
                {op.monto_origen} {op.moneda_origen}
              </Text>
              <Text style={{ fontSize: 11, color: C.t2 }}>
                {op.monto_destino} {op.moneda_destino}
              </Text>
              <StatusPill status={op.estado} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
