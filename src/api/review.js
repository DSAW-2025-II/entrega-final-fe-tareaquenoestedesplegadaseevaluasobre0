// Endpoints de reseñas: operaciones relacionadas con reseñas de viajes
import client from './client';

// Crear reseña para un viaje completado
export async function createReview(tripId, reviewData) {
  const response = await client.post(`/trips/${tripId}/reviews`, reviewData);
  return response.data;
}

// Obtener mi reseña para un viaje específico (si existe)
export async function getMyReviewForTrip(tripId) {
  const response = await client.get(`/passengers/trips/${tripId}/reviews/me`);
  return response.data;
}

// Editar mi reseña: solo dentro de ventana de 24 horas después de creación
export async function editMyReview(tripId, reviewId, updates) {
  const response = await client.patch(`/passengers/trips/${tripId}/reviews/${reviewId}`, updates);
  return response.data;
}

// Eliminar mi reseña: eliminación suave solo dentro de ventana de 24 horas después de creación
export async function deleteMyReview(tripId, reviewId) {
  const response = await client.delete(`/passengers/trips/${tripId}/reviews/${reviewId}`);
  return response.data;
}

// Listar reseñas de un conductor: endpoint público para ver reseñas de cualquier conductor
export async function getDriverReviews(driverId, options = {}) {
  const response = await client.get(`/drivers/${driverId}/reviews`, {
    params: options,
  });
  return response.data;
}

// Obtener agregado de calificaciones de un conductor: endpoint público para ver promedio y estadísticas
export async function getDriverRatings(driverId) {
  const response = await client.get(`/drivers/${driverId}/ratings`);
  return response.data;
}

// Reportar una reseña: permite reportar reseñas inapropiadas con categoría y motivo
export async function reportReview(reviewId, reportData) {
  const response = await client.post(`/trips/reviews/${reviewId}/report`, reportData);
  return response.data;
}

// Admin: ocultar/mostrar reseña: acción de moderación para administradores
export async function adminSetVisibility(reviewId, action, reason) {
  const response = await client.patch(`/admin/reviews/${reviewId}/visibility`, { action, reason });
  return response.data;
}

