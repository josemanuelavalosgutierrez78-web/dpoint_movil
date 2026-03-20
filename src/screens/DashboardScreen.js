import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { tasasAPI, operacionesAPI } from '../api/client';
import { Card, SectionHeader, StatusPill, LoadingScreen } from '../components/UI';
import { C, S } from '../theme';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [tasa, setTasa]           = useState(null);
  const [ops, setOps]             = useState([]);
  const [simTab, setSimTab]       = useState('usd-pen');
  const [quickAmt, setQuickAmt]   = useState(500);
  const [opsFilter, setOpsFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]     = useState(true);

  const rate    = simTab === 'usd-pen' ? (tasa?.venta || 3.439) : (1 / (tasa?.compra || 3.421));
  const recv    = (quickAmt * rate).toFixed(2);
  const sendSym = simTab === 'usd-pen' ? '$' : 'S/';
  const recvSym = simTab === 'usd-pen' ? 'S/' : '$';

  async function loadData() {
    try {
      const [t, o] = await Promise.all([
        tasasAPI.get(),
        operacionesAPI.misOperaciones(),
      ]);
      setTasa(t);
      setOps(Array.isArray(o) ? o : o.operaciones || []);
    } catch {}
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    const interval = setInterval(() => tasasAPI.get().then(setTasa).catch(() => {}), 60000);
    return () => clearInterval(interval);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const filteredOps = ops.filter(op => {
    if (opsFilter === 'all') return true;
    if (opsFilter === 'pend') return op.estado === 'pendiente';
    if (opsFilter === 'comp') return op.estado === 'completada';
    return true;
  }).slice(0, 5);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          backgroundColor: 'rgba(0,194,209,0.05)',
        }}>
          <View style={S.between}>
            <View>
              <Text style={{ fontSize: 13, color: C.t2 }}>Buenos días,</Text>
              <Text style={[S.headingMd, { marginTop: 2 }]}>
                {user?.first_name} {user?.last_name} 👋
              </Text>
              <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{today}</Text>
            </View>
            <View style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: C.cyan,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: C.cyanGlow,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#07111C' }}>
                {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
              </Text>
            </View>
          </View>
        </View>

        <View style={S.scrollContent}>
          {/* Nueva Operación */}
          <TouchableOpacity
            style={[S.btnPrimary, {
              flexDirection: 'row', gap: 8,
              marginTop: 16, marginBottom: 16
            }]}
            onPress={() => navigation.navigate('NuevaOperacion')}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 18, color: '#07111C' }}>⇄</Text>
            <Text style={S.btnPrimaryText}>Nueva operación</Text>
          </TouchableOpacity>

          {/* Tipo de Cambio Card */}
          <Card>
            <View style={S.between}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.t2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Tipo de Cambio
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.redDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <View style={{ width: 6, height: 6, backgroundColor: C.red, borderRadius: 3 }} />
                <Text style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>LIVE</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 14 }}>
              {[
                { label: 'Compra', val: tasa?.compra || '3.4210' },
                { label: 'Venta',  val: tasa?.venta  || '3.4390' },
              ].map(r => (
                <View key={r.label} style={{ flex: 1, backgroundColor: C.bgCard2, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{r.label}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: C.t1 }}>{r.val}</Text>
                  <Text style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>PEN por USD</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ backgroundColor: C.greenDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, color: C.green, fontWeight: '500' }}>↑ Mejor TC del mercado</Text>
              </View>
              <View style={{ backgroundColor: C.cyanDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, color: C.cyan, fontWeight: '500' }}>Sin comisión</Text>
              </View>
              <View style={{ backgroundColor: C.amberDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, color: C.amber, fontWeight: '500' }}>~15 min</Text>
              </View>
            </View>
          </Card>

          {/* Simulador */}
          <Card>
            <SectionHeader title="Simulador" />

            {/* Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {[['usd-pen','USD → PEN'],['pen-usd','PEN → USD']].map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: simTab === val ? C.cyan : 'transparent',
                  }}
                  onPress={() => setSimTab(val)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: simTab === val ? '#07111C' : C.t3 }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick amounts */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={{
                    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                    backgroundColor: quickAmt === a ? C.cyanDim : C.bgCard2,
                    borderWidth: 1,
                    borderColor: quickAmt === a ? C.cyan : C.borderSub,
                  }}
                  onPress={() => setQuickAmt(a)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: quickAmt === a ? C.cyan : C.t2 }}>
                    {sendSym}{a >= 1000 ? a/1000+'k' : a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs display */}
            <View style={{ backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.borderSub }}>
              <Text style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Envías</Text>
              <View style={S.between}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: C.t1 }}>
                  {quickAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <View style={{ backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.borderSub }}>
                  <Text>{simTab === 'usd-pen' ? '🇺🇸' : '🇵🇪'}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.t1 }}>{simTab === 'usd-pen' ? 'USD' : 'PEN'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.cyanDim, borderWidth: 1.5, borderColor: C.cyan, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
              onPress={() => setSimTab(t => t === 'usd-pen' ? 'pen-usd' : 'usd-pen')}
            >
              <Text style={{ color: C.cyan, fontSize: 16 }}>⇅</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.borderSub }}>
              <Text style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recibes</Text>
              <View style={S.between}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: C.t1 }}>
                  {parseFloat(recv).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <View style={{ backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.borderSub }}>
                  <Text>{simTab === 'usd-pen' ? '🇵🇪' : '🇺🇸'}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.t1 }}>{simTab === 'usd-pen' ? 'PEN' : 'USD'}</Text>
                </View>
              </View>
            </View>

            <Text style={{ textAlign: 'center', fontSize: 12, color: C.t3, marginBottom: 14 }}>
              TC aplicado:{' '}
              <Text style={{ color: C.cyan, fontWeight: '600' }}>
                1 USD = {simTab === 'usd-pen' ? tasa?.venta || '3.4390' : tasa?.compra || '3.4210'} PEN
              </Text>
            </Text>

            <TouchableOpacity
              style={S.btnPrimary}
              onPress={() => navigation.navigate('NuevaOperacion', { simTab, quickAmt })}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>Iniciar operación</Text>
            </TouchableOpacity>
          </Card>

          {/* Operaciones */}
          <Card>
            <SectionHeader
              title="Mis operaciones"
              link="Ver todas"
              onLink={() => navigation.navigate('Operaciones')}
            />

            <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 4, marginBottom: 14 }}>
              {[['all','Todas'],['pend','Pendientes'],['comp','Listas']].map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: opsFilter === val ? C.bgCard : 'transparent' }}
                  onPress={() => setOpsFilter(val)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: opsFilter === val ? C.t1 : C.t3 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredOps.length === 0 ? (
              <Text style={{ color: C.t3, textAlign: 'center', paddingVertical: 20 }}>Sin operaciones</Text>
            ) : filteredOps.map((op, i) => (
              <TouchableOpacity
                key={op.id || i}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < filteredOps.length - 1 ? 1 : 0, borderBottomColor: C.borderSub }}
                onPress={() => navigation.navigate('DetalleOperacion', { op })}
              >
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: op.estado === 'completada' ? C.greenDim : op.estado === 'pendiente' ? C.amberDim : C.cyanDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16 }}>
                    {op.estado === 'completada' ? '✓' : op.estado === 'pendiente' ? '⏳' : '↗'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.t1 }}>
                    {op.codigo || `OP-${op.id}`}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                    {op.created_at ? new Date(op.created_at).toLocaleDateString('es-PE') : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.t1 }}>
                    {op.monto_origen} {op.moneda_origen}
                  </Text>
                  <StatusPill status={op.estado} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
