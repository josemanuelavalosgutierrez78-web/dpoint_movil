import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBooting: boolean;
  setUser: (u: User) => void;
  logout: () => void;
  setBooting: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBooting: true,
  setUser:   (user) => set({ user, isAuthenticated: true, isBooting: false }),
  logout:    ()     => set({ user: null, isAuthenticated: false, isBooting: false }),
  setBooting:(v)    => set({ isBooting: v }),
}));
