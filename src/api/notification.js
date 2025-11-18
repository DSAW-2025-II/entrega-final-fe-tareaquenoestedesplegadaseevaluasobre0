// Endpoints de notificaciones: operaciones relacionadas con notificaciones del usuario
import client from './client';

// Listar notificaciones: obtener notificaciones del usuario actual con filtros opcionales
export async function getNotifications(options = {}) {
  const response = await client.get('/notifications', {
    params: options, // status ('unread' o 'all'), page, pageSize
  });
  return response.data;
}

// Marcar como leídas: marcar una o más notificaciones como leídas por el usuario
export async function markNotificationsAsRead(notificationIds) {
  const response = await client.patch('/notifications/read', {
    ids: notificationIds,
  });
  return response.data;
}

