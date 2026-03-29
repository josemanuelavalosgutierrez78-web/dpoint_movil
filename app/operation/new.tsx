import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Easing, Alert, Clipboard, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { exchangeService, operationService, cuentaUsuarioService } from '@/services/dataService';
import { parseApiError } from '@/services/api';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/context/authStore';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import { fmt } from '@/utils/format';
import { api } from '@/services/api';
import type { TasaCambio, CuentaUsuario, Moneda, Operacion } from '@/types';

/* ─── Paleta local ───────────────────────────────────────── */
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
  warning:      '#fbbf24',
  warningDim:   '#2a1f08',
  skeleton:     '#1e3d5c',
};

const BANCOS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'BanBif', 'Pichincha', 'Otros'];
const ORIGENES = ['Trabajo dependiente', 'Trabajo independiente', 'Negocio propio', 'Ahorros', 'Otros'];

type Step = 1 | 2 | 3;

export default function NewOperacionScreen() {
  const insets = useSafeAreaInsets();


  const [step,       setStep]       = useState<Step>(1);
  const [rate,       setRate]       = useState<TasaCambio | null>(null);
  const [accounts,   setAccounts]   = useState<CuentaUsuario[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdOp,  setCreatedOp]  = useState<Operacion | null>(null);
  const [done,       setDone]       = useState(false);
  const [copied,     setCopied]     = useState<string | null>(null);
  const [showDetalle,    setShowDetalle]    = useState(false);
const [cuentaDeposito, setCuentaDeposito] = useState<any>(null);

  // Step 1
  const [monedaEnvio,  setMonedaEnvio]  = useState<Moneda>('PEN');
  const [montoEnvio,   setMontoEnvio]   = useState('');
  const [bancoOrigen,  setBancoOrigen]  = useState('');
  const [origenFondos, setOrigenFondos] = useState('');
  const [dstAcctId,    setDstAcctId]    = useState<string | null>(null);
  const [showCuentas,  setShowCuentas]  = useState(false);

  // Step 2 — timer
  const [timer, setTimer] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3
  const [numOp,      setNumOp]      = useState('');
  const [sending,    setSending]    = useState(false);

  // Bottom sheet animation
  const sheetAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Promise.all([exchangeService.getRate(), cuentaUsuarioService.getAll()])
      .then(([r, a]) => { setRate(r); setAccounts(a); })
      .catch((e) => Toast.show({ type: 'error', text1: parseApiError(e) }))
      .finally(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const copyText = (text: string, key: string) => {
    Clipboard.setString(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const startTimer = () => {
    setTimer(300);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          Alert.alert('Tasa expirada', 'El tiempo para esta tasa ha vencido. La operación continuará con la tasa actualizada.', [{ text: 'Entendido' }]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const BONUS_EMPRESA        = 0.002;
  const user                 = useAuthStore((s) => s.user);
  const esEmpresa            = user?.tipo_cliente === 'empresa';
  const amtNum               = parseFloat(montoEnvio) || 0;
  const monedaRecibe: Moneda = monedaEnvio === 'PEN' ? 'USD' : 'PEN';
  const buyRate              = rate ? rate.compra + (esEmpresa ? BONUS_EMPRESA : 0) : 0;
  const sellRate             = rate ? rate.venta  - (esEmpresa ? BONUS_EMPRESA : 0) : 0;
  const appliedRate          = rate ? (monedaEnvio === 'PEN' ? sellRate : buyRate) : 0;
  const montoRecibe          = rate && amtNum > 0
    ? (monedaEnvio === 'PEN' ? amtNum / sellRate : amtNum * buyRate)
  : 0;

  const cuentasFiltradas = accounts.filter(a => a.moneda === monedaRecibe);
  const dstAcct          = accounts.find(a => a.id === dstAcctId);
  

  // Abrir/cerrar bottom sheet cuentas
  const openSheet = () => {
    setShowCuentas(true);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: 300, duration: 250, useNativeDriver: true, easing: Easing.in(Easing.ease) })
      .start(() => setShowCuentas(false));
  };

  // Confirmar operación (modal de confirmación antes de crear)
  const confirmar = () => {
    Alert.alert(
      'Confirmar operación',
      `Envías ${monedaEnvio === 'PEN' ? 'S/' : '$'} ${amtNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })} y recibirás aprox. ${monedaRecibe === 'PEN' ? 'S/' : '$'} ${montoRecibe.toFixed(2)}.\n\nTasa: ${appliedRate.toFixed(4)}`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Confirmar', onPress: crearOperacion },
      ]
    );
  };

  const crearOperacion = async () => {
    setSubmitting(true);
    try {
      const op = await operationService.create({
        monto_envia:    amtNum,
        moneda_envia:   monedaEnvio,
        cuenta_destino: dstAcctId ?? null,
        banco_destino:  dstAcct?.banco ?? bancoOrigen ?? null,
      });
      const res = op as any;
      setCreatedOp(res.operacion ?? res);
      setCuentaDeposito(res.cuenta_deposito ?? null);
      setStep(2);
      startTimer();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: parseApiError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const enviarConstancia = async () => {
  if (!numOp.trim()) { Toast.show({ type: 'error', text1: 'Ingresa el número de operación' }); return; }
  setSending(true);
  try {
    await api.post(`/operaciones/${createdOp!.id}/constancia`, {
      numero_operacion: numOp.trim(),
    });
    setDone(true);
  } catch (err: any) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err?.response?.data?.detail || 'No se pudo enviar la constancia',
    });
  } finally {
    setSending(false);
  }
};

  const stepLabels = ['Completa', 'Transfiere', 'Constancia'];

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="large" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => step === 1 ? router.back() : setStep((p) => (p - 1) as Step)}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva operación</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Step indicator ── */}
      {!done && (
        <View style={s.stepIndicator}>
          {stepLabels.map((label, i) => {
            const num     = i + 1;
            const active  = step === num;
            const passed  = step > num;
            return (
              <React.Fragment key={num}>
                <View style={s.stepItem}>
                  <View style={[s.stepCircle,
                    active ? s.stepCircleActive : null,
                    passed ? s.stepCirclePassed : null,
                  ]}>
                    {passed
                      ? <Ionicons name="checkmark" size={14} color={C.accent} />
                      : <Text style={[s.stepNum, active && { color: C.accentDark }]}>{num}</Text>
                    }
                  </View>
                  <Text style={[s.stepLabel, active ? { color: C.accent } : null]}>{label}</Text>
                </View>
                {i < 2 && (
                  <View style={[s.stepLine, passed ? { backgroundColor: C.accent } : null]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ STEP 1 — Completa ══ */}
        {step === 1 && (
          <View style={s.stepWrap}>
            <View style={s.stepHeader}>
              <Text style={s.stepTitle}>Nueva operación</Text>
              <Text style={s.stepDesc}>Ingresa el monto y te mostramos cuánto recibirás.</Text>
            </View>

            {/* Toggle moneda envío */}
            <View style={s.toggleRow}>
              {(['USD', 'PEN'] as Moneda[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.toggleBtn, monedaEnvio === m ? s.toggleBtnActive : null]}
                  onPress={() => { setMonedaEnvio(m); setMontoEnvio(''); setDstAcctId(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.toggleTxt, monedaEnvio === m ? s.toggleTxtActive : null]}>
                    Envío {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resumen tu envías / recibes */}
            <View style={s.summaryCard}>
              {[
                ['Tu envías',       `${monedaEnvio === 'PEN' ? 'S/' : '$'} ${amtNum > 0 ? amtNum.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}`, false],
                ['Tu recibes',      `${monedaRecibe === 'PEN' ? 'S/' : '$'} ${montoRecibe > 0 ? montoRecibe.toFixed(2) : '0.00'}`, true],
                ['Tipo de cambio',  appliedRate > 0 ? appliedRate.toFixed(4) : '—', false],
              ].map(([l, v, accent], i) => (
                <View key={String(l)} style={[s.summaryRow, i < 2 && s.summaryRowBorder]}>
                  <Text style={s.summaryLabel}>{l}</Text>
                  <Text style={[s.summaryValue, accent ? { color: C.accent } : null]}>{v}</Text>
                </View>
              ))}
              {esEmpresa && (
  <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
    <Text style={{ fontSize: 10, color: C.accent, fontWeight: '700' }}>
      ✦ Tasa preferencial aplicada
    </Text>
  </View>
)}
            </View>
            


            {/* Info tiempo */}
            <View style={s.infoChip}>
              <Ionicons name="time-outline" size={14} color={C.accent} />
              <Text style={s.infoTxt}>Tiempo estimado: <Text style={{ fontWeight: '700' }}>15 minutos</Text> aproximadamente.</Text>
            </View>

            {/* Input monto */}
            <View style={{ gap: 8 }}>
              <Text style={s.inputLabel}>Monto a enviar</Text>
              <View style={s.amtInput}>
                <Text style={s.amtCur}>{monedaEnvio}</Text>
                <TextInput
                  style={s.amtField}
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  value={montoEnvio}
                  onChangeText={setMontoEnvio}
                  selectionColor={C.accent}
                />
              </View>
            </View>

            {/* Banco origen */}
            <View style={{ gap: 8 }}>
              <Text style={s.inputLabel}>¿Desde qué banco nos envías?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {BANCOS.map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[s.chip, bancoOrigen === b ? s.chipActive : null]}
                    onPress={() => setBancoOrigen(b)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipTxt, bancoOrigen === b ? s.chipTxtActive : null]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Cuenta destino */}
            <View style={{ gap: 8 }}>
              <Text style={s.inputLabel}>¿En qué cuenta recibes tu dinero?</Text>
              <TouchableOpacity style={s.selectorBtn} onPress={openSheet} activeOpacity={0.8}>
                <Text style={[s.selectorTxt, !dstAcct && { color: C.textMuted }]}>
                  {dstAcct ? `${dstAcct.banco} — ····${dstAcct.numero_cuenta.slice(-4)}` : 'Selecciona una cuenta'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={C.textMuted} />
              </TouchableOpacity>
              <View style={s.warningChip}>
                <Ionicons name="information-circle-outline" size={14} color={C.accent} />
                <Text style={s.warningTxt}>Las cuentas deben estar <Text style={{ fontWeight: '700' }}>a tu nombre</Text>. No transferimos a terceros.</Text>
              </View>
            </View>

            {/* Origen de fondos */}
            <View style={{ gap: 8 }}>
              <Text style={s.inputLabel}>Origen de fondos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ORIGENES.map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[s.chip, origenFondos === o ? s.chipActive : null]}
                    onPress={() => setOrigenFondos(o)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipTxt, origenFondos === o ? s.chipTxtActive : null]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Info tasa bloqueada */}
            <View style={s.infoChip}>
              <Ionicons name="information-circle-outline" size={14} color={C.accent} />
              <Text style={s.infoTxt}>Al continuar, la tasa se bloqueará por <Text style={{ fontWeight: '700' }}>5 minutos</Text>.</Text>
            </View>

            <TouchableOpacity
              style={[s.ctaBtn, (submitting || !bancoOrigen || !dstAcctId) && { opacity: 0.5 }]}
              activeOpacity={0.85}
              onPress={() => {
                if (!montoEnvio || amtNum <= 0) { Toast.show({ type: 'error', text1: 'Ingresa un monto válido' }); return; }
                if (!bancoOrigen) { Toast.show({ type: 'error', text1: 'Selecciona tu banco origen' }); return; }
                if (!dstAcctId) { Toast.show({ type: 'error', text1: 'Selecciona cuenta destino' }); return; }
                confirmar();
              }}
              disabled={submitting}
            >
              {submitting
                ? <Spinner size="small" color={C.accentDark} />
                : <>
                    <Text style={s.ctaTxt}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={18} color={C.accentDark} />
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ══ STEP 2 — Transfiere ══ */}
        {step === 2 && createdOp && (
          <View style={s.stepWrap}>

            {/* Timer */}
            <View style={s.timerWrap}>
              <Text style={s.timerLabel}>El tipo de cambio podría actualizarse a las:</Text>
              <Text style={[s.timerValue, {
                color: timer < 60 ? '#f87171' : timer < 120 ? C.warning : C.accent,
              }]}>
                {fmtTimer(timer)}
              </Text>
            </View>

            {/* Hero */}
            <View style={s.stepHeader}>
              <Text style={s.stepTitle}>Transfiere a DollarPoint X</Text>
              <Text style={s.stepDesc}>
                <Text style={{ color: C.textPrimary, fontWeight: '700' }}>1. </Text>
                Transfiere{' '}
                <Text style={{ color: C.accent, fontWeight: '700' }}>
                  {monedaEnvio === 'PEN' ? 'S/' : '$'} {amtNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })} {monedaEnvio === 'PEN' ? 'Soles' : 'Dólares'}
                </Text>
                {' '}desde tu banco <Text style={{ color: C.textPrimary, fontWeight: '700' }}>{bancoOrigen}</Text> a nuestra cuenta.
              </Text>
              <Text style={s.stepDesc}>
                <Text style={{ color: C.textPrimary, fontWeight: '700' }}>2. </Text>
                Guarda el <Text style={{ color: C.accent, fontWeight: '700' }}>número de tu operación</Text> para el siguiente paso.
              </Text>
            </View>

            {/* Datos bancarios DollarPoint */}
            {cuentaDeposito ? (
              <View style={s.bankCard}>
                {[
                  ['Banco',            cuentaDeposito.banco],
                  ['Número de cuenta', cuentaDeposito.numero_cuenta],
                  ['CCI',              cuentaDeposito.cci],
                  ['Titular',          cuentaDeposito.titular],
                  ['Referencia',       (createdOp as any).codigo],
                ].filter(([, v]) => v).map(([l, v], i, arr) => (
                  <View key={String(l)} style={[s.bankRow, i < arr.length - 1 ? s.bankRowBorder : null]}>
                    <Text style={s.bankLabel}>{l}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[s.bankValue, l === 'Referencia' ? { color: C.warning } : null]}>{v}</Text>
                      <TouchableOpacity
                        style={[s.copyBtn, copied === l ? s.copyBtnDone : null]}
                        onPress={() => copyText(String(v), String(l))}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={copied === l ? 'checkmark' : 'copy-outline'}
                          size={12}
                          color={copied === l ? C.success : C.accent}
                        />
                        <Text style={[s.copyTxt, copied === l ? { color: C.success } : null]}>
                          {copied === l ? 'Copiado' : 'Copiar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.bankCard}>
                <View style={s.bankRow}>
                  <Text style={s.bankLabel}>Código de referencia</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[s.bankValue, { color: C.warning }]}>{(createdOp as any).codigo}</Text>
                    <TouchableOpacity
                      style={[s.copyBtn, copied === 'ref' ? s.copyBtnDone : null]}
                      onPress={() => copyText((createdOp as any).codigo, 'ref')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={copied === 'ref' ? 'checkmark' : 'copy-outline'} size={12} color={copied === 'ref' ? C.success : C.accent} />
                      <Text style={[s.copyTxt, copied === 'ref' ? { color: C.success } : null]}>
                        {copied === 'ref' ? 'Copiado' : 'Copiar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Aviso */}
            <View style={[s.infoChip, { borderColor: C.warning + '44', backgroundColor: C.warningDim }]}>
              <Ionicons name="alert-circle-outline" size={14} color={C.warning} />
              <Text style={[s.infoTxt, { color: C.warning }]}>
                DollarPoint X <Text style={{ fontWeight: '700' }}>NO</Text> realiza ningún débito automático de tus cuentas.
              </Text>
            </View>

            <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85} onPress={() => setStep(3)}>
              <Ionicons name="checkmark-circle-outline" size={18} color={C.accentDark} />
              <Text style={s.ctaTxt}>Ya hice mi transferencia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.linkBtn} onPress={() => setShowDetalle(true)} activeOpacity={0.7}>
              <Text style={s.linkTxt}>Ver detalle de la operación</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══ STEP 3 — Constancia ══ */}
        {step === 3 && (
          <View style={s.stepWrap}>
            {done ? (
              /* ── Estado final éxito ── */
              <View style={{ alignItems: 'center', gap: 16, paddingTop: 20 }}>
                <View style={s.successCircle}>
                  <Ionicons name="checkmark-done" size={44} color={C.success} />
                </View>
                <Text style={s.successTitle}>¡Listo!</Text>
                <Text style={s.successDesc}>
                  Recibimos tu constancia. Verificaremos tu transferencia y procesaremos el envío de{' '}
                  <Text style={{ color: C.accent, fontWeight: '700' }}>
                    {monedaRecibe === 'PEN' ? 'S/' : '$'} {montoRecibe.toFixed(2)}
                  </Text>
                  {' '}a tu cuenta.
                </Text>
                <View style={[s.infoChip, { width: '100%' }]}>
                  <Ionicons name="time-outline" size={14} color={C.accent} />
                  <Text style={s.infoTxt}>Tiempo estimado: <Text style={{ fontWeight: '700' }}>15 minutos</Text> en horario bancario.</Text>
                </View>
                <View style={s.successBtns}>
                  <TouchableOpacity
                    style={[s.ctaBtn, { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]}
                    activeOpacity={0.85}
                    onPress={() => router.replace('/(tabs)/operations')}
                  >
                    <Text style={[s.ctaTxt, { color: C.textSecond }]}>Ver operaciones</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.ctaBtn, { flex: 1 }]}
                    activeOpacity={0.85}
                    onPress={() => router.replace('/(tabs)/home')}
                  >
                    <Ionicons name="home-outline" size={16} color={C.accentDark} />
                    <Text style={s.ctaTxt}>Inicio</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ── Formulario constancia ── */
              <>
                <View style={s.stepHeader}>
                  <Text style={s.stepTitle}>Envía tu constancia</Text>
                  <Text style={s.stepDesc}>Escribe el número de operación de la transferencia aquí</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <Text style={s.inputLabel}>Número de operación</Text>
                  <TextInput
                    style={s.numOpInput}
                    placeholder="Ej: 123456789"
                    placeholderTextColor={C.textMuted}
                    value={numOp}
                    onChangeText={setNumOp}
                    keyboardType="default"
                  autoCapitalize="none"
                    selectionColor={C.accent}
                  />
                </View>

                {/* Resumen */}
                <View style={s.summaryCard}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Verificaremos y te transferiremos</Text>
                    <Text style={[s.summaryValue, { color: C.accent }]}>
                      {monedaRecibe === 'PEN' ? 'S/' : '$'} {montoRecibe.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[s.ctaBtn, (!numOp.trim() || sending) && { opacity: 0.5 }]}
                  activeOpacity={0.85}
                  onPress={enviarConstancia}
                  disabled={!numOp.trim() || sending}
                >
                  {sending
                    ? <Spinner size="small" color={C.accentDark} />
                    : <>
                        <Ionicons name="send-outline" size={16} color={C.accentDark} />
                        <Text style={s.ctaTxt}>Enviar constancia</Text>
                      </>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.linkBtn}
                  onPress={() => setStep(2)}
                  activeOpacity={0.7}
                >
                  <Text style={s.linkTxt}>¿Aún no haces la transferencia?</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Bottom sheet cuentas ── */}
      {showCuentas && (
        <>
          <TouchableOpacity
            style={s.overlay}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <Animated.View style={[s.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>
                  Cuentas{' '}
                  <Text style={{ color: monedaRecibe === 'USD' ? C.accent : C.warning }}>
                    {monedaRecibe === 'USD' ? 'Dólares' : 'Soles'}
                  </Text>
                </Text>
                <Text style={s.sheetSub}>Selecciona tu cuenta de destino</Text>
              </View>
              <TouchableOpacity style={s.sheetClose} onPress={closeSheet} activeOpacity={0.8}>
                <Ionicons name="close" size={16} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={s.sheetDivider} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {cuentasFiltradas.length === 0 ? (
                <Text style={{ color: C.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
                  No tienes cuentas en {monedaRecibe === 'USD' ? 'Dólares' : 'Soles'} guardadas.
                </Text>
              ) : (
                cuentasFiltradas.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.sheetItem, dstAcctId === c.id ? s.sheetItemActive : null]}
                    onPress={() => { setDstAcctId(c.id); closeSheet(); }}
                    activeOpacity={0.8}
                  >
                    <View style={s.sheetItemIcon}>
                      <Ionicons name="card-outline" size={18} color={dstAcctId === c.id ? C.accent : C.textMuted} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.sheetItemBank}>{c.banco}</Text>
                      <Text style={s.sheetItemNum}>{c.numero_cuenta}</Text>
                      <Text style={s.sheetItemHolder}>{c.titular}</Text>
                    </View>
                    {dstAcctId === c.id && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                  </TouchableOpacity>
                ))
              )}

              {/* Agregar cuenta */}
              <TouchableOpacity
                style={s.sheetAddBtn}
                onPress={() => { closeSheet(); router.push('/accounts/new'); }}
                activeOpacity={0.8}
              >
                <View style={[s.sheetItemIcon, { backgroundColor: C.input }]}>
                  <Ionicons name="add" size={18} color={C.textMuted} />
                </View>
                <Text style={{ fontSize: 14, color: C.textMuted, fontWeight: '600' }}>Agregar cuenta</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </>
      )}
      {/* ── Modal detalle operación ── */}
      {createdOp && (
        <Modal visible={showDetalle} transparent animationType="fade" onRequestClose={() => setShowDetalle(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <Text style={s.modalTag}>Detalle de operación</Text>
              <Text style={s.modalCode}>{(createdOp as any).codigo}</Text>
              <View style={s.modalDivider} />
              {[
                ['Banco origen',    bancoOrigen],
                ['Cuenta destino',  dstAcct ? `${dstAcct.banco} — ····${dstAcct.numero_cuenta.slice(-4)}` : '—'],
                ['Monto enviado',   `${monedaEnvio === 'PEN' ? 'S/' : '$'} ${amtNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`],
                ['Monto a recibir', `${monedaRecibe === 'PEN' ? 'S/' : '$'} ${montoRecibe.toFixed(2)}`],
                ['Tipo de cambio',  appliedRate.toFixed(4)],
                ['Referencia',      (createdOp as any).codigo],
              ].map(([l, v], i, arr) => (
                <View key={String(l)} style={[s.modalRow, i < arr.length - 1 ? s.modalRowBorder : null]}>
                  <Text style={s.modalRowLabel}>{l}</Text>
                  <Text style={[s.modalRowValue, l === 'Referencia' ? { color: C.warning } : l === 'Monto a recibir' ? { color: C.accent } : null]}>{v}</Text>
                </View>
              ))}
              <TouchableOpacity style={[s.ctaBtn, { marginTop: 8, backgroundColor: '#0a1628' }]} onPress={() => setShowDetalle(false)} activeOpacity={0.85}>
                <Text style={[s.ctaTxt, { color: '#fff' }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.textPrimary },

  // Step indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22, paddingVertical: 16 },
  stepItem:      { alignItems: 'center', gap: 6 },
  stepCircle:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)' },
  stepCircleActive: { backgroundColor: C.accent, borderColor: C.accent, shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  stepCirclePassed: { backgroundColor: C.accentDim, borderColor: C.borderBright },
  stepNum:       { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.25)' },
  stepLabel:     { fontSize: 10, fontWeight: '600', color: C.textMuted },
  stepLine:      { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 16, marginHorizontal: 4 },

  body:       { padding: 22, paddingBottom: 60 },
  stepWrap:   { gap: 18 },
  stepHeader: { gap: 6 },
  stepTitle:  { fontSize: 20, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  stepDesc:   { fontSize: 13, color: C.textMuted, lineHeight: 20 },

  // Toggle moneda
  toggleRow:       { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: C.accent },
  toggleTxt:       { fontSize: 13, fontWeight: '700', color: C.textMuted },
  toggleTxtActive: { color: C.accentDark },

  // Summary card
  summaryCard:      { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel:     { fontSize: 13, color: C.textMuted },
  summaryValue:     { fontSize: 14, fontWeight: '700', color: C.textPrimary },

  // Info chips
  infoChip:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.accentDim, borderRadius: 12, borderWidth: 1, borderColor: C.borderBright, padding: 12 },
  infoTxt:    { flex: 1, fontSize: 12, color: C.accent, lineHeight: 18 },
  warningChip:{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.accentDim, borderRadius: 10, borderWidth: 1, borderColor: C.borderBright, padding: 10 },
  warningTxt: { flex: 1, fontSize: 11, color: C.accent, lineHeight: 16 },

  // Input monto
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  amtInput:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  amtCur:     { paddingHorizontal: 16, height: 64, textAlignVertical: 'center', lineHeight: 64, fontSize: 14, fontWeight: '700', color: C.accent, borderRightWidth: 1, borderRightColor: C.border },
  amtField:   { flex: 1, paddingHorizontal: 16, fontSize: 30, fontWeight: '800', color: C.textPrimary, height: 64, letterSpacing: -1 },

  // Chips banco / origen
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive:    { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: C.textMuted },
  chipTxtActive: { color: C.accentDark },

  // Selector cuenta
  selectorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14 },
  selectorTxt: { fontSize: 14, fontWeight: '600', color: C.textPrimary },

  // CTA
  ctaBtn: { height: 52, borderRadius: 14, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  ctaTxt: { fontSize: 15, fontWeight: '800', color: C.accentDark, letterSpacing: 0.2 },

  // Timer
  timerWrap:  { alignItems: 'center', gap: 4, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  timerLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },
  timerValue: { fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 2 },

  // Bank card
  bankCard:       { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  bankRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  bankRowBorder:  { borderBottomWidth: 1, borderBottomColor: C.border },
  bankLabel:      { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  bankValue:      { fontSize: 13, fontWeight: '700', color: C.textPrimary, fontVariant: ['tabular-nums'] },

  // Number op input
  numOpInput: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '700', color: C.textPrimary, fontVariant: ['tabular-nums'] },

  // Link btn
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkTxt: { fontSize: 13, color: C.accent, fontWeight: '600', textDecorationLine: 'underline' },

  // Success
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.successDim, borderWidth: 2, borderColor: C.success, alignItems: 'center', justifyContent: 'center' },
  successTitle:  { fontSize: 24, fontWeight: '800', color: C.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  successDesc:   { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  successBtns:   { flexDirection: 'row', gap: 10, width: '100%' },

  // Bottom sheet
  overlay:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#112236', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: C.border, zIndex: 50, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16 },
  sheetHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  sheetTitle:    { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  sheetSub:      { fontSize: 13, color: C.textMuted, marginTop: 3 },
  sheetClose:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  sheetDivider:  { height: 1, backgroundColor: C.border, marginVertical: 14 },
  sheetItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  sheetItemActive:{ backgroundColor: C.accentDim, borderColor: C.borderBright },
  sheetItemIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  sheetItemBank: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  sheetItemNum:  { fontSize: 12, color: C.textMuted, fontVariant: ['tabular-nums'] },
  sheetItemHolder:{ fontSize: 11, color: C.textMuted },
  sheetAddBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', marginTop: 4 },

  // Copy button
  copyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.borderBright },
  copyBtnDone: { backgroundColor: C.successDim, borderColor: C.success + '44' },
  copyTxt:     { fontSize: 11, fontWeight: '700', color: C.accent },

  // Modal detalle
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:       { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTag:       { fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  modalCode:      { fontSize: 17, fontWeight: '800', color: '#0a1628', textAlign: 'center', marginBottom: 16 },
  modalDivider:   { height: 1, backgroundColor: '#e8edf5', marginBottom: 4 },
  modalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  modalRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f4f8' },
  modalRowLabel:  { fontSize: 12, color: '#8896b3', fontWeight: '600' },
  modalRowValue:  { fontSize: 13, fontWeight: '700', color: '#0a1628', maxWidth: '55%', textAlign: 'right' },
});