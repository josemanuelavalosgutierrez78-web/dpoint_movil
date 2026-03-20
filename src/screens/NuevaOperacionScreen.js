import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operacionesAPI, cuentasAPI, tasasAPI } from '../api/client';
import { Btn, ErrorMsg, BackBtn } from '../components/UI';
import { C, S } from '../theme';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function NuevaOperacionScreen({ navigation, route }) {
  const initTab = route.params?.simTab || 'usd-pen';
  const initAmt = route.params?.quickAmt || 500;

  const [step, setStep]         = useState(1);
  const [simTab, setSimTab]     = useState(initTab);
  const [quickAmt, setQuickAmt] = useState(initAmt);
  const [cuentas, setCuentas]   = useState([]);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [tasa, setTasa]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [opResult, setOpResult] = useState(null);

  const rate    = simTab === 'usd-pen' ? (tasa?.venta || 3.439) : (1 / (tasa?.compra || 3.421));
  const recv    = (quickAmt * rate).toFixed(2);
  const sendSym = simTab === 'usd-pen' ? '$' : 'S/';
  const recvSym = simTab === 'usd-pen' ? 'S/' : '$';
  const sendCurr = simTab === 'usd-pen' ? 'USD' : 'PEN';
  const recvCurr = simTab === 'usd-pen' ? 'PEN' : 'USD';

  useEffect(() => {
    tasasAPI.get().then(setTasa).catch(() => {});
    cuentasAPI.listar().then(data => {
      const list = Array.isArray(data) ? data : data.cuentas || [];
      setCuentas(list);
    }).catch(() => {});
  }, []);

  async function confirmar() {
    if (!selectedCuenta) { setError('Selecciona una cuenta destino'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        monto_origen: quickAmt,
        moneda_origen: sendCurr,
        moneda_destino: recvCurr,
        cuenta_destino_id: selectedCuenta.id,
        tasa_aplicada: rate,
      };
      const result = await operacionesAPI.crear(payload);
      setOpResult(result);
      setStep(4);
    } catch (e) {
      setError(e.message || 'Error al crear la operación');
    } finally {
      setLoading(false);
    }
  }

  // Progress bar
  const Progress = () => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
      {[1,2,3,4].map(i => (
        <View key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          backgroundColor: i <= step ? C.cyan : C.borderSub,
          opacity: i === step ? 0.6 : 1,
        }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <BackBtn onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()} />
        <Progress />
        <Text style={{ fontSize: 12, color: C.t3, marginBottom: 20 }}>
          Paso {step} de 4 · {['Datos','Cuentas','Confirmación','Estado'][step-1]}
        </Text>

        <ErrorMsg msg={error} />

        {/* PASO 1 - MONTO */}
        {step === 1 && (
          <>
            <Text style={S.headingMd}>¿Cuánto deseas cambiar?</Text>
            <Text style={[S.body, { marginTop: 6, marginBottom: 24 }]}>Selecciona el monto y la dirección</Text>

            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: C.t3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Monto a enviar</Text>
              <Text style={{ fontSize: 42, fontWeight: '800', color: C.t1 }}>
                {sendSym}{quickAmt.toLocaleString()} <Text style={{ fontSize: 18, color: C.t2 }}>{sendCurr}</Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: C.bgCard2, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {[['usd-pen','USD → PEN'],['pen-usd','PEN → USD']].map(([val, label]) => (
                <TouchableOpacity key={val} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: simTab === val ? C.cyan : 'transparent' }} onPress={() => setSimTab(val)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: simTab === val ? '#07111C' : C.t3 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity key={a} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: quickAmt === a ? C.cyanDim : C.bgCard2, borderWidth: 1, borderColor: quickAmt === a ? C.cyan : C.borderSub }} onPress={() => setQuickAmt(a)}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: quickAmt === a ? C.cyan : C.t2 }}>
                    {sendSym}{a >= 1000 ? a/1000+'k' : a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Btn label="Continuar →" onPress={() => setStep(2)} />
          </>
        )}

        {/* PASO 2 - CUENTA */}
        {step === 2 && (
          <>
            <Text style={S.headingMd}>¿Dónde quieres recibir?</Text>
            <Text style={[S.body, { marginTop: 6, marginBottom: 24 }]}>Selecciona tu cuenta bancaria</Text>

            {cuentas.length === 0 && (
              <Text style={{ color: C.t2, marginBottom: 16 }}>No tienes cuentas registradas. Agrega una primero.</Text>
            )}

            {cuentas.map((c, i) => (
              <TouchableOpacity
                key={c.id || i}
                style={{
                  backgroundColor: selectedCuenta?.id === c.id ? C.cyanDim : C.bgCard,
                  borderWidth: 1,
                  borderColor: selectedCuenta?.id === c.id ? C.cyan : C.border,
                  borderRadius: 20, padding: 18, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center',
                }}
                onPress={() => setSelectedCuenta(c)}
              >
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.bgCard2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 20 }}>🏦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{c.banco || c.bank}</Text>
                  <Text style={{ fontSize: 12, color: C.t2, marginTop: 2, fontFamily: 'monospace' }}>
                    •••• {(c.numero_cuenta || c.account_number || '').slice(-4)}
                  </Text>
                  <View style={{ backgroundColor: C.cyanDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: C.cyan, fontWeight: '600' }}>{c.moneda || c.currency}</Text>
                  </View>
                </View>
                {selectedCuenta?.id === c.id && <Text style={{ color: C.cyan, fontSize: 20 }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[S.btnOutline, { marginBottom: 20 }]}
              onPress={() => navigation.navigate('Cuentas')}
            >
              <Text style={S.btnOutlineText}>＋ Agregar cuenta</Text>
            </TouchableOpacity>

            <Btn label="Continuar →" onPress={() => { if (!selectedCuenta) { setError('Selecciona una cuenta'); return; } setError(''); setStep(3); }} />
          </>
        )}

        {/* PASO 3 - CONFIRMACIÓN */}
        {step === 3 && (
          <>
            <Text style={S.headingMd}>Revisa tu operación</Text>
            <Text style={[S.body, { marginTop: 6, marginBottom: 24 }]}>Verifica los detalles antes de confirmar</Text>

            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18, marginBottom: 20 }}>
              {[
                ['Envías', `${sendSym}${parseFloat(quickAmt).toFixed(2)} ${sendCurr}`],
                ['Recibes', `${recvSym}${parseFloat(recv).toLocaleString('en-US', {minimumFractionDigits:2})} ${recvCurr}`, true],
                ['Tipo de cambio', `1 USD = ${simTab==='usd-pen' ? tasa?.venta||'3.4390' : tasa?.compra||'3.4210'}`],
                ['Cuenta destino', `${selectedCuenta?.banco} •••• ${(selectedCuenta?.numero_cuenta||'').slice(-4)}`],
                ['Comisión', 'S/ 0.00 ✓'],
                ['Tiempo estimado', '~15 minutos'],
              ].map(([key, val, highlight]) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderSub }}>
                  <Text style={{ fontSize: 13, color: C.t2 }}>{key}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: highlight ? C.cyan : C.t1 }}>{val}</Text>
                </View>
              ))}
            </View>

            <Btn label="Confirmar operación" onPress={confirmar} loading={loading} />
          </>
        )}

        {/* PASO 4 - ÉXITO */}
        {step === 4 && opResult && (
          <>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.greenDim, borderWidth: 2, borderColor: C.green, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 36 }}>✓</Text>
            </View>
            <Text style={[S.headingMd, { textAlign: 'center', marginBottom: 8 }]}>
              {opResult.codigo || `OP-${opResult.id}`}
            </Text>
            <Text style={{ textAlign: 'center', fontSize: 14, color: C.t2, marginBottom: 24 }}>
              Tu operación está siendo procesada
            </Text>

            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18, marginBottom: 20 }}>
              {[
                ['Estado', null, 'en_proceso'],
                ['Enviaste', `${sendSym}${parseFloat(quickAmt).toFixed(2)} ${sendCurr}`],
                ['Recibirás', `${recvSym}${parseFloat(recv).toLocaleString('en-US',{minimumFractionDigits:2})} ${recvCurr}`, true],
                ['Cuenta destino', `${selectedCuenta?.banco} •••• ${(selectedCuenta?.numero_cuenta||'').slice(-4)}`],
              ].map(([key, val, highlight]) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderSub }}>
                  <Text style={{ fontSize: 13, color: C.t2 }}>{key}</Text>
                  {key === 'Estado'
                    ? <View style={{ backgroundColor: C.cyanDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontSize: 10, fontWeight: '600', color: C.cyan }}>En proceso</Text></View>
                    : <Text style={{ fontSize: 13, fontWeight: '600', color: highlight ? C.cyan : C.t1 }}>{val}</Text>
                  }
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: C.amberDim, borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: C.amber, fontWeight: '600', marginBottom: 4 }}>⏳ Esperando tu transferencia</Text>
              <Text style={{ fontSize: 12, color: C.t2 }}>
                Transfiere {sendSym}{quickAmt.toLocaleString()} {sendCurr} a nuestra cuenta y sube el comprobante.
              </Text>
            </View>

            <Btn label="Ir al inicio" onPress={() => navigation.navigate('Dashboard')} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
