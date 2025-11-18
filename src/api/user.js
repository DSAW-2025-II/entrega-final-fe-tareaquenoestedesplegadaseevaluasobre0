// Endpoints de usuarios: operaciones relacionadas con gestión de perfiles y usuarios
import client from './client';

// Obtener perfil del usuario actual: retorna información completa del usuario autenticado
export async function getMyProfile() {
  const response = await client.get('/api/users/me');
  return response.data;
}

// Cambiar rol: alternar entre pasajero y conductor (requiere tener vehículo registrado para ser conductor)
export async function toggleRole() {
  const response = await client.post('/api/users/me/toggle-role');
  return response.data;
}

// Reportar un usuario: reportar usuario desde un viaje específico con categoría y motivo
export async function reportUser(userId, reportData) {
  const response = await client.post(`/api/users/${userId}/report`, reportData);
  return response.data;
}

// Obtener reportes recibidos: lista todos los reportes que otros usuarios han hecho sobre el usuario actual
export async function getMyReportsReceived() {
  const response = await client.get('/api/users/me/reports-received');
  return response.data;
}

// Actualizar perfil: actualizar información del usuario actual (soporta texto y foto de perfil)
export async function updateMyProfile(profileData) {
  const hasFile = profileData.profilePhoto instanceof File;
  
  if (hasFile) {
    // Si hay archivo, usar FormData para multipart/form-data
    const formData = new FormData();
    
    if (profileData.firstName) formData.append('firstName', profileData.firstName);
    if (profileData.lastName) formData.append('lastName', profileData.lastName);
    if (profileData.phone) formData.append('phone', profileData.phone);
    formData.append('profilePhoto', profileData.profilePhoto);
    
    // Dejar que Axios configure Content-Type automáticamente con boundary para multipart
    const response = await client.patch('/api/users/me', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  } else {
    // Solo texto: usar JSON para actualización sin archivos
    const response = await client.patch('/api/users/me', profileData);
    return response.data;
  }
}

// Obtener perfil público: obtener información pública de un usuario por ID (sin datos sensibles)
export async function getPublicProfile(userId) {
  const response = await client.get(`/api/users/${userId}/public`);
  return response.data;
}