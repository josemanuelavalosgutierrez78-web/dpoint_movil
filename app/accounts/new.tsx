import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { cuentaUsuarioService } from '@/services/dataService';
import { parseApiError } from '@/services/api';
import { Button, Input, ScreenHeader } from '@/components/ui';
import { Colors, Sp, R, Fs } from '@/constants/theme';
import type { CrearCuentaUsuario, Moneda} from '@/types';

const BANKS = ['BCP','BBVA','Interbank','Scotiabank','BanBif','Pichincha','Caja Arequipa','Otro'];

export default function NewAccountScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CrearCuentaUsuario>({
    defaultValues: { moneda: 'PEN' },
  });

  const selectedBank = watch('banco');
  const selectedCur  = watch('moneda');

  const onSubmit = async (data: CrearCuentaUsuario) => {
    setLoading(true);
    try {
      await cuentaUsuarioService.create(data);
      Toast.show({ type: 'success', text1: '¡Cuenta agregada!' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <ScreenHeader title="Nueva cuenta bancaria" subtitle="Solo cuentas a tu nombre" onBack={() => router.back()} />

        {/* Info banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
          <Text style={s.infoBannerTxt}>
            Verifica los datos antes de guardar. Solo puedes agregar cuentas propias.
          </Text>
        </View>

        {/* Bank selector */}
        <View style={s.section}>
          <Text style={s.sLabel}>BANCO</Text>
          <Controller control={control} name="banco"
            rules={{ required: 'Selecciona un banco' }}
            render={({ field: { value } }) => (
              <>
                <View style={s.bankGrid}>
                  {BANKS.map((b) => (
                    <TouchableOpacity
                      key={b} activeOpacity={0.8}
                      style={[s.bankChip, value === b && s.bankChipActive]}
                      onPress={() => setValue('banco', b, { shouldValidate: true })}
                    >
                      <Text style={[s.bankChipTxt, value === b && s.bankChipTxtActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.banco && <Text style={s.errTxt}>{errors.banco.message}</Text>}
              </>
            )}
          />
        </View>

        {/* Currency */}
        <View style={s.section}>
          <Text style={s.sLabel}>MONEDA</Text>
          <View style={s.toggle}>
            {(['PEN', 'USD'] as Moneda[]).map((c) => (
              <TouchableOpacity
                key={c} style={[s.toggleBtn, selectedCur === c && s.toggleActive]}
                onPress={() => setValue('moneda', c)}
              >
                <Text style={[s.toggleTxt, selectedCur === c && s.toggleTxtActive]}>
                  {c === 'PEN' ? '🇵🇪 Soles (PEN)' : '🇺🇸 Dólares (USD)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Titular */}
        <View style={s.section}>
          <Text style={s.sLabel}>TITULAR DE LA CUENTA</Text>
          <Controller control={control} name="titular"
            rules={{ required: 'Titular requerido' }}
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Ej: Juan García López"
                value={value}
                onChangeText={onChange}
                error={errors.titular?.message ?? ''}
                leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
              />
            )}
          />
        </View>

        {/* Account number */}
        <View style={s.section}>
          <Text style={s.sLabel}>NÚMERO DE CUENTA</Text>
          <Controller control={control} name="numero_cuenta"
            rules={{ required: 'Número requerido', minLength: { value: 8, message: 'Mínimo 8 dígitos' }, pattern: { value: /^\d+$/, message: 'Solo números' } }}
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Ej: 19512345678901"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                error={errors.numero_cuenta?.message ?? ''}
                leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textMuted} />}
              />
            )}
          />

          {/* CCI opcional */}
          <Controller control={control} name="cci"
            render={({ field: { onChange, value } }) => (
              <Input
                label="CCI (opcional)"
                placeholder="Ej: 00219512345678901234"
                keyboardType="number-pad"
                value={value ?? ''}
                onChangeText={onChange}
                leftIcon={<Ionicons name="barcode-outline" size={18} color={Colors.textMuted} />}
              />
            )}
          />
        </View>

        <Button label="Guardar cuenta" fullWidth size="lg" loading={loading} onPress={handleSubmit(onSubmit)}
          leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: Colors.bgPrimary },
  content:       { gap: Sp.xl, paddingBottom: 48 },
  infoBanner:    { flexDirection: 'row', alignItems: 'flex-start', gap: Sp.sm, backgroundColor: Colors.accentDim, borderRadius: R.sm, borderWidth: 1, borderColor: Colors.border, padding: Sp.md, marginHorizontal: Sp.xl },
  infoBannerTxt: { flex: 1, fontSize: Fs.sm, color: Colors.textSecondary, lineHeight: 20 },
  section:       { marginHorizontal: Sp.xl, gap: Sp.md },
  sLabel:        { fontSize: 10, fontWeight: '700', color: Colors.accent, letterSpacing: 1.2 },
  errTxt:        { fontSize: Fs.xs, color: Colors.danger },

  bankGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Sp.sm },
  bankChip:         { paddingHorizontal: Sp.md, paddingVertical: Sp.sm, borderRadius: R.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle },
  bankChipActive:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  bankChipTxt:      { fontSize: Fs.sm, fontWeight: '500', color: Colors.textSecondary },
  bankChipTxtActive:{ color: Colors.white },

  toggle:         { flexDirection: 'row', backgroundColor: Colors.bgPrimary, borderRadius: R.sm, padding: 3, borderWidth: 1, borderColor: Colors.borderSubtle },
  toggleBtn:      { flex: 1, paddingVertical: Sp.sm, alignItems: 'center', borderRadius: R.xs },
  toggleActive:   { backgroundColor: Colors.accent },
  toggleTxt:      { fontSize: Fs.sm, fontWeight: '600', color: Colors.textMuted },
  toggleTxtActive:{ color: Colors.white },
});