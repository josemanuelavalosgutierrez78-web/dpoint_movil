import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Colors, R, Fs } from '@/constants/theme';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[s.toast, s.success]}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={s.text1}
      text2Style={s.text2}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[s.toast, s.error]}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={s.text1}
      text2Style={s.text2}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[s.toast, s.info]}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={s.text1}
      text2Style={s.text2}
    />
  ),
};

const s = StyleSheet.create({
  toast:   { borderRadius: R.md, backgroundColor: Colors.bgElevated, borderLeftWidth: 4, height: 'auto', paddingVertical: 10 },
  success: { borderLeftColor: Colors.success },
  error:   { borderLeftColor: Colors.danger },
  info:    { borderLeftColor: Colors.accent },
  text1:   { fontSize: Fs.md, fontWeight: '700', color: Colors.textPrimary },
  text2:   { fontSize: Fs.sm, color: Colors.textSecondary },
});
