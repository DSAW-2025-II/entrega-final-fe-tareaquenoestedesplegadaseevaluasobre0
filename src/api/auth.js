// Endpoints de autenticación: operaciones relacionadas con registro, login y gestión de sesión
import client from './client';

// Registrar nuevo usuario: crear cuenta nueva y auto-login después del registro
export async function register(userData) {
  const response = await client.post('/auth/register', userData);
  return response.data;
}

// Iniciar sesión: autenticar usuario y establecer cookie JWT httpOnly
export async function login(corporateEmail, password) {
  const response = await client.post('/auth/login', {
    corporateEmail,
    password,
  });
  return response.data;
}

// Cerrar sesión: invalidar cookie JWT y limpiar sesión en el servidor
export async function logout() {
  await client.post('/auth/logout');
}

// Obtener usuario actual: obtener perfil del usuario autenticado desde la sesión
export async function getCurrentUser() {
  const response = await client.get('/auth/me');
  return response.data;
}

// Cambiar contraseña: actualizar contraseña del usuario autenticado (requiere contraseña actual)
export async function changePassword(passwordData) {
  const response = await client.patch('/auth/password', passwordData);
  return response.data;
}

