import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://dollarpoint-4.onrender.com/api/v1';
const TIMEOUT = 15000; // 15 segundos

// Fetch con timeout
function fetchWithTimeout(url, options) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('⏱ Timeout: el servidor tardó demasiado')), TIMEOUT)
    ),
  ]);
}

async function request(method, path, body = null, auth = true) {
  console.log(`🌐 ${method} ${path}`);
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await AsyncStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    let res = await fetchWithTimeout(`${BASE_URL}${path}`, config);
    console.log(`✅ ${method} ${path} → ${res.status}`);

    if (res.status === 401 && auth) {
      console.log('🔄 Token expirado, refrescando...');
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = await AsyncStorage.getItem('access_token');
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetchWithTimeout(`${BASE_URL}${path}`, { ...config, headers });
      }
    }

    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.detail || data.message || 'Error en la solicitud' };
    return data;

  } catch (e) {
    console.log(`❌ ${method} ${path} → ERROR:`, e.message);
    throw e;
  }
}

async function refreshToken() {
  try {
    const refresh = await AsyncStorage.getItem('refresh_token');
    if (!refresh) return false;
    const res = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await AsyncStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) await AsyncStorage.setItem('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export const authAPI = {
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }, false),
  register: (data) =>
    request('POST', '/auth/register', data, false),
  me: () =>
    request('GET', '/auth/me'),
  logout: () =>
    request('POST', '/auth/logout'),
  forgotPassword: (email) =>
    request('POST', '/auth/forgot-password', { email }, false),
  resetPassword: (token, password) =>
    request('POST', '/auth/reset-password', { token, password }, false),
  changePassword: (current_password, new_password) =>
    request('POST', '/auth/change-password', { current_password, new_password }),
  deleteAccount: () =>
    request('DELETE', '/auth/delete-account'),
};

export const tasasAPI = {
  get: () => request('GET', '/tasas'),
  historial: () => request('GET', '/tasas/historial'),
};

export const operacionesAPI = {
  crear: (data) => request('POST', '/operaciones', data),
  misOperaciones: () => request('GET', '/operaciones/mis'),
  todas: () => request('GET', '/operaciones'),
};

export const cuentasAPI = {
  listar: () => request('GET', '/cuentas-usuario'),
  agregar: (data) => request('POST', '/cuentas-usuario', data),
  editar: (id, data) => request('PUT', `/cuentas-usuario/${id}`, data),
  eliminar: (id) => request('DELETE', `/cuentas-usuario/${id}`),
};

export const reclamacionesAPI = {
  crear: (data) => request('POST', '/reclamaciones', data),
};

export const contactoAPI = {
  crear: (data) => request('POST', '/contacto', data),
};
