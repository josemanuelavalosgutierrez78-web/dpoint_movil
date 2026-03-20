import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
  // Despertar backend en paralelo
  fetch('https://dollarpoint-4.onrender.com/').catch(() => {});
  
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      const me = await Promise.race([
        authAPI.me(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 15000)
        ),
      ]);
      setUser(me);
    }
  } catch {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  } finally {
    setLoading(false);
  }
}

  async function login(email, password) {
    const data = await authAPI.login(email, password);
    await AsyncStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) await AsyncStorage.setItem('refresh_token', data.refresh_token);
    const me = await authAPI.me();
    setUser(me);
    return me;
  }

  async function register(formData) {
    const data = await authAPI.register(formData);
    return data;
  }

  async function logout() {
    try { await authAPI.logout(); } catch {}
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
