// ─── Primitivos ───────────────────────────────────────────
export type Moneda          = 'PEN' | 'USD';
export type TipoOperacion   = 'compra' | 'venta';
export type EstadoOperacion = 'pendiente' | 'aprobada' | 'rechazada' | 'en_proceso' | 'completada';

// ─── Auth ─────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  dni: string;
  telefono: string;
  role: string;
  verificado: boolean;
  accepted_terms: boolean;
  accepted_privacy: boolean;
  accepted_promo: boolean;
  created_at?: string | null;
  // ← agregar:
  tipo_cliente?: string | null;
  ruc?: string | null;
  razon_social?: string | null;
  nombre_comercial?: string | null;
  email_factura?: string | null;
  telefono_empresa?: string | null;
}

export interface TokensAuth {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PayloadLogin {
  email: string;
  password: string;
}

export interface PayloadRegistro {
  nombre: string;
  email: string;
  dni: string;
  telefono: string;
  password: string;
  password_confirm?: string;  // ← solo frontend, se descarta antes de enviar al backend
  accepted_terms: boolean;
  accepted_privacy: boolean;
  accepted_promo: boolean;
}

export interface PayloadRefresh {
  refresh_token: string;
}

// ─── Tasa de cambio ───────────────────────────────────────
export interface TasaCambio {
  id: number;
  compra: number;
  venta: number;
  actualizado_por?: string | null;
  created_at?: string | null;
}

// ─── Operaciones ──────────────────────────────────────────
export interface CrearOperacion {
  monto_envia: number;
  moneda_envia: Moneda;
  cuenta_destino?: string | null;
  banco_destino?: string | null;
}

export interface Operacion {
  id: string;
  codigo: string;
  tipo: TipoOperacion;
  monto_envia: number;
  moneda_envia: Moneda;
  monto_recibe: number;
  moneda_recibe: Moneda;
  tasa: number;
  estado: EstadoOperacion;
  cuenta_destino?: string | null;
  banco_destino?: string | null;
  aprobado_por?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cliente_nombre?: string | null;
  cliente_dni?: string | null;
}

// ─── Cuentas bancarias (admin) ────────────────────────────
export interface CrearCuentaBancaria {
  banco: string;
  titular: string;
  numero_cuenta: string;
  cci: string;
  moneda: Moneda;
}

export interface CuentaBancaria {
  id: string;
  banco: string;
  titular: string;
  numero_cuenta: string;
  cci: string;
  moneda: Moneda;
  activa: boolean;
  alias?: string;        // ← agregar
  tipo_cuenta?: string;  // ← agregar
}

// ─── Cuentas del usuario ──────────────────────────────────
export interface CrearCuentaUsuario {
  banco: string;
  titular: string;
  numero_cuenta: string;
  cci?: string | null;
  moneda: Moneda;
}

export interface ActualizarCuentaUsuario {
  banco?: string;
  titular?: string;
  numero_cuenta?: string;
  cci?: string | null;
  moneda?: Moneda;
  activa?: boolean;
}

export interface CuentaUsuario {
  id: string;
  user_id: string;
  banco: string;
  titular: string;
  numero_cuenta: string;
  cci?: string | null;
  moneda: Moneda;
  activa: boolean;
  created_at?: string | null;
}

// ─── Stats ────────────────────────────────────────────────
export interface EstadisticasAdmin {
  operaciones_hoy: number;
  pendientes: number;
  total_usuarios: number;
  volumen_hoy_pen: number;
  volumen_hoy_usd: number;
}

// ─── Reclamaciones ────────────────────────────────────────
export interface CrearReclamacion {
  perfil: string;
  fecha: string;
  nombre: string;
  apellido: string;
  direccion: string;
  ciudad: string;
  estado: string;
  pais: string;
  dni: string;
  email: string;
  telefono: string;
  servicio: string;
  monto: string;
  tipo: string;
  detalle: string;
  pedido: string;
}

export interface Reclamacion {
  id: string;
  created_at?: string | null;
  nombre: string;
  apellido: string;
  email: string;
  tipo: string;
  estado: string;
}

// ─── Contacto ─────────────────────────────────────────────
export interface CrearContacto {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

export interface Contacto {
  id: string;
  created_at?: string | null;
  name: string;
  email: string;
  subject: string;
}

// ─── Genéricos ────────────────────────────────────────────
export interface RespuestaPaginada<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Aliases para compatibilidad ──────────────────────────
export type LoginPayload             = PayloadLogin;
export type RegisterPayload          = PayloadRegistro;
export type AuthTokens               = TokensAuth;
export type ExchangeRate             = TasaCambio;
export type CreateOperationPayload   = CrearOperacion;
export type Operation                = Operacion;
export type OperationType            = TipoOperacion;
export type OperationStatus          = EstadoOperacion;
export type BankAccount              = CuentaBancaria;
export type CreateBankAccountPayload = CrearCuentaBancaria;
export type User                     = Usuario; 
export type Currency = Moneda;