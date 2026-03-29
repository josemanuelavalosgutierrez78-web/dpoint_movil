import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity, StyleSheet, Linking, Animated, Easing, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const WA  = (Constants.expoConfig?.extra?.whatsappNumber as string) || '51999999999';
const MSG = 'Hola, necesito ayuda con DollarPoint X';

interface WhatsAppFABProps {
  visible?: boolean;
}

export const WhatsAppFAB: React.FC<WhatsAppFABProps> = ({ visible = true }) => {
  const [dismissed, setDismissed] = useState(false);

  // Animación flotante (bobbing)
  const floatAnim  = useRef(new Animated.Value(0)).current;
  // Animación entrada
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || dismissed) return;

    // Entrada con bounce
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();

    // Loop flotante
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -7, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, [visible, dismissed]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDismissed(true));
  };

  if (!visible || dismissed) return null;

  return (
    <Animated.View style={[
      s.wrap,
      {
        opacity: opacityAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: floatAnim },
        ],
      },
    ]}>
      {/* Botón cerrar */}
      <TouchableOpacity style={s.closeBtn} onPress={handleDismiss} activeOpacity={0.8}>
        <Ionicons name="close" size={12} color="#fff" />
      </TouchableOpacity>

      {/* FAB WhatsApp */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => Linking.openURL(`https://wa.me/${WA}?text=${encodeURIComponent(MSG)}`)}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 35,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  closeBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});