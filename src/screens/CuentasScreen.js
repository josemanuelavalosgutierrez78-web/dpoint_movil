import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cuentasAPI } from '../api/client';
import { Btn, Input, ErrorMsg, LoadingScreen } from '../components/UI';
import { C, S } from '../theme';

const BANCOS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'BanBif', 'Pichincha', 'Otro'];
const MONEDAS = ['PEN', 'USD'];

export default function CuentasScreen() {
  const [cuentas, setCuentas]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm] = useState({
    banco: 'BCP', numero_cuenta: '', tipo_cuenta: 'ahorros', moneda: 'PEN', cci: ''
  });

  function set(field) { return v => setForm(f => ({ ...f, [field]: v })); }

  async function load() {
    try {
      const data = await cuentasAPI.listar();
      setCuentas(Array.isArray(data) ? data : data.cuentas || []);
    } catch {}
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function guardar() {
    if (!form.numero_cuenta) { setError('Ingresa el número de cuenta'); return; }
    setSaving(true); setError('');
    try {
      await cuentasAPI.agregar(form);
      await load();
      setModal(false);
      setForm({ banco: 'BCP', numero_cuenta: '', tipo_cuenta: 'ahorros', moneda: 'PEN', cci: '' });
    } catch (e) {
      setError(e.message || 'Error al agregar la cuenta');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id) {
    Alert.alert('Eliminar cuenta', '¿Seguro que deseas eliminar esta cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await cuentasAPI.eliminar(id); await load(); } catch {}
        }
      }
    ]);
  }

  if (loading) return <LoadingScreen />;

  const bankBgColor = { BCP: '#003F8A20', BBVA: '#F2B70020', Interbank: '#E3000B20' };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <Text style={S.headingMd}>Cuentas Bancarias</Text>
        <Text style={[S.body, { marginTop: 4 }]}>Gestiona tus cuentas vinculadas</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {cuentas.map((c, i) => (
          <View key={c.id || i} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: bankBgColor[c.banco] || C.bgCard2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 20 }}>🏦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{c.banco}</Text>
              <Text style={{ fontSize: 12, color: C.t2, marginTop: 2, fontFamily: 'monospace' }}>
                •••• •••• {(c.numero_cuenta || '').slice(-4)}
              </Text>
              <View style={{ backgroundColor: c.moneda === 'USD' ? C.cyanDim : C.greenDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: c.moneda === 'USD' ? C.cyan : C.green }}>{c.moneda}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => eliminar(c.id)} style={{ padding: 8 }}>
              <Text style={{ color: C.red, fontSize: 16 }}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[S.btnOutline, { marginTop: 4 }]} onPress={() => setModal(true)}>
          <Text style={S.btnOutlineText}>＋ Agregar nueva cuenta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal agregar cuenta */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={[S.screen, { padding: 24 }]}>
          <View style={S.between}>
            <Text style={S.headingMd}>Nueva cuenta</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={{ color: C.t2, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginTop: 24 }} keyboardShouldPersistTaps="handled">
            <ErrorMsg msg={error} />

            <Text style={S.inputLabel}>Banco</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BANCOS.map(b => (
                  <TouchableOpacity key={b} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: form.banco === b ? C.cyanDim : C.bgCard, borderWidth: 1, borderColor: form.banco === b ? C.cyan : C.borderSub }} onPress={() => set('banco')(b)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: form.banco === b ? C.cyan : C.t2 }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={S.inputLabel}>Moneda</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {MONEDAS.map(m => (
                <TouchableOpacity key={m} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: form.moneda === m ? C.cyanDim : C.bgCard, borderWidth: 1, borderColor: form.moneda === m ? C.cyan : C.borderSub }} onPress={() => set('moneda')(m)}>
                  <Text style={{ fontWeight: '600', color: form.moneda === m ? C.cyan : C.t2 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Número de cuenta" placeholder="Ej: 19123456789" value={form.numero_cuenta} onChangeText={set('numero_cuenta')} keyboardType="number-pad" />
            <Input label="CCI (opcional)" placeholder="Código de cuenta interbancario" value={form.cci} onChangeText={set('cci')} keyboardType="number-pad" />

            <Btn label="Guardar cuenta" onPress={guardar} loading={saving} style={{ marginTop: 8 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
