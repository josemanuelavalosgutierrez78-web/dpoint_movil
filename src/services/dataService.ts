import { api } from './api';
import type {
  TasaCambio,
  Operacion,
  CrearOperacion,
  CuentaBancaria,
  CrearCuentaBancaria,
  CuentaUsuario,
  CrearCuentaUsuario,
  RespuestaPaginada,
} from '@/types';

const unwrap = <T>(d: RespuestaPaginada<T> | T[]): T[] =>
  Array.isArray(d) ? d : (d.results ?? []);

// ── Tasa de cambio ────────────────────────────────────────────
export const exchangeService = {
  async getRate(): Promise<TasaCambio> {
    const { data } = await api.get<TasaCambio>('/tasas');
    return data;
  },
};

// ── Operaciones ───────────────────────────────────────────────
export const operationService = {
  async getAll(): Promise<Operacion[]> {
    const { data } = await api.get<RespuestaPaginada<Operacion> | Operacion[]>('/operaciones/mis');
    return unwrap(data);
  },
  async getById(id: string): Promise<Operacion> {
  const { data } = await api.get<Operacion[]>(`/operaciones/mis?op_id=${id}`);
  const list = unwrap(data);
  const op = list.find(o => o.id === id);
  if (!op) throw new Error('Operación no encontrada');
  return op;
},
  async create(p: CrearOperacion): Promise<Operacion> {
    const { data } = await api.post<Operacion>('/operaciones', p);
    return data;
  },
};

// ── Cuentas bancarias (admin) ─────────────────────────────────
export const bankAccountService = {
  async getAll(): Promise<CuentaBancaria[]> {
    const { data } = await api.get<RespuestaPaginada<CuentaBancaria> | CuentaBancaria[]>('/cuentas-bancarias');
    return unwrap(data);
  },
  async create(p: CrearCuentaBancaria): Promise<CuentaBancaria> {
    const { data } = await api.post<CuentaBancaria>('/cuentas-bancarias', p);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/cuentas-bancarias/${id}`);
  },
};

// ── Cuentas del usuario ───────────────────────────────────────
export const cuentaUsuarioService = {
  async getAll(): Promise<CuentaUsuario[]> {
    const { data } = await api.get<RespuestaPaginada<CuentaUsuario> | CuentaUsuario[]>('/cuentas-usuario');
    return unwrap(data);
  },
  async create(p: CrearCuentaUsuario): Promise<CuentaUsuario> {
    const { data } = await api.post<CuentaUsuario>('/cuentas-usuario', p);
    return data;
  },
  async update(id: string, p: Partial<CrearCuentaUsuario>): Promise<CuentaUsuario> {
    const { data } = await api.put<CuentaUsuario>(`/cuentas-usuario/${id}`, p);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/cuentas-usuario/${id}`);
  },
};