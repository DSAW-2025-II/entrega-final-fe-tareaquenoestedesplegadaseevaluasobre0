// Endpoints de ofertas de viaje: operaciones para gestión de ofertas de viaje (solo para conductores)
import client from './client';

// Crear oferta de viaje: crear nueva oferta de viaje con origen, destino, horarios y precios
export async function createTripOffer(tripData) {
  const response = await client.post('/drivers/trips', tripData);
  return response.data;
}

// Listar mis ofertas: obtener ofertas de viaje del conductor actual con filtros opcionales
export async function getMyTripOffers(filters = {}) {
  const response = await client.get('/drivers/trips', {
    params: filters, // status, fromDate, toDate, page, pageSize
  });
  return response.data;
}

// Actualizar oferta: actualizar información de una oferta de viaje existente
export async function updateTripOffer(tripId, updates) {
  const response = await client.patch(`/drivers/trips/${tripId}`, updates);
  return response.data;
}

// Obtener oferta por ID: obtener detalles completos de una oferta de viaje específica
export async function getTripOfferById(tripId) {
  const response = await client.get(`/drivers/trips/${tripId}`);
  return response.data;
}

// Cancelar oferta: cancelar una oferta de viaje (wrapper para updateTripOffer)
export async function cancelTripOffer(tripId) {
  return updateTripOffer(tripId, { status: 'canceled' });
}

// Publicar oferta: publicar un borrador de oferta de viaje (wrapper para updateTripOffer)
export async function publishTripOffer(tripId) {
  return updateTripOffer(tripId, { status: 'published' });
}

// Iniciar viaje: cambiar estado de published a in_progress cuando el viaje comienza
export async function startTrip(tripId) {
  const response = await client.post(`/drivers/trips/${tripId}/start`);
  return response.data;
}

// Completar viaje: cambiar estado de in_progress a completed cuando el viaje finaliza
export async function completeTrip(tripId) {
  const response = await client.post(`/drivers/trips/${tripId}/complete`);
  return response.data;
}

// Obtener reservas del viaje: obtener solicitudes de reserva para un viaje específico del conductor
export async function getTripBookings(tripId, filters = {}) {
  const response = await client.get(`/drivers/trips/${tripId}/bookings`, {
    params: filters,
  });
  return response.data;
}

// Aceptar reserva: aceptar una solicitud de reserva pendiente para un viaje
export async function acceptBooking(tripId, bookingId) {
  const response = await client.post(`/drivers/trips/${tripId}/bookings/${bookingId}/accept`);
  return response.data;
}

// Rechazar reserva: rechazar una solicitud de reserva pendiente con motivo opcional
export async function declineBooking(tripId, bookingId, reason = '') {
  const response = await client.post(`/drivers/trips/${tripId}/bookings/${bookingId}/decline`, {
    reason,
  });
  return response.data;
}

