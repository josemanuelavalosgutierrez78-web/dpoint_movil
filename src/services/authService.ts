import { api, tokenStorage } from './api';
import type { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types';

export const authService = {
  async login(p: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await api.post<AuthTokens>('/auth/login', p);
    const access  = (data as any).access_token || (data as any).access || '';
    const refresh = (data as any).refresh_token || (data as any).refresh || '';
    await tokenStorage.setTokens(access, refresh);
    const user = await authService.me();
    return { user, tokens: data };
  },

  async register(p: RegisterPayload): Promise<User> {
    const { password_confirm, ...rest } = p;
    const body = {
      ...rest,
      accepted_terms:   true,
      accepted_privacy: true,
      accepted_promo:   false,
    };
    const { data } = await api.post<User>('/auth/register', body);
    return data;
  },

  async registerEmpresa(p: {
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    email_factura?: string;
    telefono_empresa: string;
    nombre: string;
    dni: string;
    telefono: string;
    email: string;
    password: string;
    accepted_terms: boolean;
    accepted_privacy: boolean;
    accepted_promo: boolean;
  }): Promise<void> {
    await api.post('/auth/register/empresa', p);
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout', {}); } catch { /* silent */ }
    await tokenStorage.clear();
  },

  async hasSession(): Promise<boolean> {
    return !!(await tokenStorage.getAccess());
  },
};