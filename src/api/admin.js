// Endpoints de administración: operaciones administrativas del sistema (solo para admins)
import client from './client';

// Listar usuarios: obtener lista de usuarios con filtros y paginación para administradores
export async function listUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.append('createdTo', filters.createdTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/users?${params.toString()}`);
  return response.data;
}

// Listar viajes: obtener lista de viajes con filtros y paginación para administradores
export async function listTrips(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.driverId) params.append('driverId', filters.driverId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.departureFrom) params.append('departureFrom', filters.departureFrom);
  if (filters.departureTo) params.append('departureTo', filters.departureTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/trips?${params.toString()}`);
  return response.data;
}

// Listar reservas: obtener lista de reservas con filtros y paginación para administradores
export async function listBookings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.tripId) params.append('tripId', filters.tripId);
  if (filters.passengerId) params.append('passengerId', filters.passengerId);
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.paid !== undefined) params.append('paid', filters.paid);
  if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.append('createdTo', filters.createdTo);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/bookings?${params.toString()}`);
  return response.data;
}

// Suspender usuario: suspender o reactivar un usuario con motivo para auditoría
export async function suspendUser(userId, suspend, reason) {
  const action = suspend ? 'suspend' : 'unsuspend';
  const response = await client.patch(`/admin/users/${userId}/suspension`, { action, reason });
  return response.data;
}

// Cancelar viaje forzado: cancelar un viaje administrativamente con motivo
export async function forceCancelTrip(tripId, reason) {
  const response = await client.post(`/admin/trips/${tripId}/force-cancel`, { reason });
  return response.data;
}

// Corregir estado de reserva: corregir manualmente el estado de una reserva con motivo y reembolso opcional
export async function correctBookingState(bookingId, targetState, reason, refund) {
  const body = { targetState, reason };
  if (refund) body.refund = refund;
  const response = await client.post(`/admin/bookings/${bookingId}/correct-state`, body);
  return response.data;
}

// Establecer ban de publicación: prohibir a un conductor publicar viajes temporalmente hasta fecha específica
export async function setDriverPublishBan(driverId, banUntil, reason) {
  const response = await client.patch(`/admin/drivers/${driverId}/publish-ban`, { banUntil, reason });
  return response.data;
}

// Crear URL de subida: generar URL firmada para subir evidencia de moderación
export async function createModerationUploadUrl(meta) {
  const response = await client.post('/admin/moderation/evidence/upload-url', meta);
  return response.data;
}

// Crear nota de moderación: crear nota de moderación asociada a una entidad (usuario, reseña, etc.)
export async function createModerationNote(entity, entityId, category, reason, evidence) {
  const response = await client.post('/admin/moderation/notes', { entity, entityId, category, reason, evidence });
  return response.data;
}

// Listar reportes de usuarios: obtener reportes de usuarios con filtros y paginación
export async function listReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.reportedUserId) params.append('reportedUserId', filters.reportedUserId);
  if (filters.reporterId) params.append('reporterId', filters.reporterId);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/reports?${params.toString()}`);
  return response.data;
}

// Listar reportes de reseñas: obtener reportes de reseñas con filtros y paginación
export async function listReviewReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  params.append('page', filters.page || 1);
  params.append('pageSize', filters.pageSize || 25);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await client.get(`/admin/review-reports?${params.toString()}`);
  return response.data;
}

// Actualizar estado de reporte: cambiar estado de un reporte (resuelto, rechazado, etc.) con motivo
export async function updateReportStatus(reportId, status, reason) {
  const response = await client.patch(`/admin/reports/${reportId}/status`, { status, reason });
  return response.data;
}

// Enviar mensaje: enviar mensaje de notificación al usuario reportado desde un reporte específico
export async function sendMessageToReportedUser(reportId, title, message) {
  const response = await client.post(`/admin/reports/${reportId}/send-message`, { title, message });
  return response.data;
}
