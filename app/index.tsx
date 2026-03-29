import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/context/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start(() => {
      // Pulso en loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    });

    // Después de 3s redirige igual que antes
    const t = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)/home' : '/(auth)/login');
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  return (
  <View style={s.container}>
    <Animated.View style={[s.wrap, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      {/* Logo pulsando */}
      <Animated.Image
        source={require('../assets/loginicono.png')}
        style={{ width: 220, height: 90, opacity: pulse }}
        resizeMode="contain"
        fadeDuration={0}
      />
    </Animated.View>
  </View>
);

}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0b1929', alignItems: 'center', justifyContent: 'center' },
  wrap:        { alignItems: 'center', gap: 24 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  wordWhite:   { fontSize: 30, fontWeight: '800', color: '#eef4ff', letterSpacing: -0.5 },
  wordCyan:    { fontSize: 30, fontWeight: '800', color: '#06b6d4', letterSpacing: -0.5 },
  wordX:       {
    fontSize: 38,
    fontWeight: '900',
    color: '#22d3ee',
    fontStyle: 'italic',
    letterSpacing: -2,
    marginLeft: 2,
    textShadowColor: 'rgba(6,182,212,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 40,
  },
});