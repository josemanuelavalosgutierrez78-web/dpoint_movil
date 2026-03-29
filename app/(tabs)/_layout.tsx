import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Sp, R, Fs } from '@/constants/theme';

const TAB_ITEMS = [
  { name: 'home',       label: 'Inicio',      icon: 'home',              iconActive: 'home' },
  { name: 'operations', label: 'Operaciones', icon: 'swap-horizontal',   iconActive: 'swap-horizontal' },
  { name: 'accounts',   label: 'Cuentas',     icon: 'card-outline',      iconActive: 'card' },
  { name: 'profile',    label: 'Perfil',      icon: 'person-outline',    iconActive: 'person' },
] as const;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: insets.bottom || Sp.sm }]}>
      {state.routes.map((route, i) => {
        const tab     = TAB_ITEMS.find((t) => t.name === route.name) ?? TAB_ITEMS[0];
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={s.tabItem}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(route.name)}
          >
            {focused && <View style={s.indicator} />}
            <Ionicons
              name={(focused ? tab.iconActive : tab.icon) as any}
              size={22}
              color={focused ? Colors.accent : Colors.textMuted}
            />
            <Text style={[s.tabLabel, focused && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"       options={{ title: 'Inicio' }} />
      <Tabs.Screen name="operations" options={{ title: 'Operaciones' }} />
      <Tabs.Screen name="accounts"   options={{ title: 'Cuentas' }} />
      <Tabs.Screen name="profile"    options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(11,28,44,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Sp.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Sp.xs,
    gap: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: -Sp.sm,
    width: 28,
    height: 3,
    borderRadius: R.full,
    backgroundColor: Colors.accent,
  },
  tabLabel:       { fontSize: 10, color: Colors.textMuted, fontWeight: '400' },
  tabLabelActive: { color: Colors.accent, fontWeight: '600' },
});
