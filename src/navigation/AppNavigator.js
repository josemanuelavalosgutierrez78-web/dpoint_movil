import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/UI';
import { C } from '../theme';

// Screens
import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import OperacionesScreen    from '../screens/OperacionesScreen';
import NuevaOperacionScreen from '../screens/NuevaOperacionScreen';
import CuentasScreen        from '../screens/CuentasScreen';
import ProfileScreen        from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const ICON = { Dashboard:'⊞', Cambiar:'⇄', Cuentas:'🏦', Perfil:'👤' };

function TabIcon({ name, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{ICON[name]}</Text>
      <Text style={{ fontSize: 10, color: focused ? C.cyan : C.t3, fontWeight: '500' }}>{name}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(7,17,28,0.97)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}   options={{ tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} /> }} />
      <Tab.Screen name="Cambiar"    component={NuevaOperacionScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon name="Cambiar" focused={focused} /> }} />
      <Tab.Screen name="Cuentas"    component={CuentasScreen}     options={{ tabBarIcon: ({ focused }) => <TabIcon name="Cuentas" focused={focused} /> }} />
      <Tab.Screen name="Perfil"     component={ProfileScreen}     options={{ tabBarIcon: ({ focused }) => <TabIcon name="Perfil" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      {user ? (
        <>
          <Stack.Screen name="Main"           component={MainTabs} />
          <Stack.Screen name="NuevaOperacion" component={NuevaOperacionScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Operaciones"    component={OperacionesScreen} />
          <Stack.Screen name="DetalleOperacion" component={require('../screens/DetalleOperacionScreen').default} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"          component={LoginScreen} />
          <Stack.Screen name="Register"       component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
