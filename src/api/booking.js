// Endpoints de reservas: operaciones relacionadas con reservas de viajes (solo para pasajeros)
import client from './client';

// Obtener mis reservas: obtener reservas del pasajero actual con filtros opcionales
export async function getMyBookings(filters = {}) {
  console.log('[getMyBookings] Making request to /passengers/bookings with filters:', filters);
  const response = await client.get('/passengers/bookings', {
    params: filters, // status, fromDate, toDate, page, pageSize
  });
  console.log('[getMyBookings] Response received:', response.data);
  return response.data;
}

// Crear reserva: crear solicitud de reserva para un viaje publicado
export async function createBooking(bookingData) {
  const response = await client.post('/passengers/bookings', bookingData);
  return response.data;
}

// Cancelar reserva: cancelar una reserva existente con motivo opcional
export async function cancelBooking(bookingId, reason = '') {
  const response = await client.post(`/passengers/bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
}

// Obtener reserva por ID: obtener detalles completos de una reserva específica
export async function getBookingById(bookingId) {
  const response = await client.get(`/passengers/bookings/${bookingId}`);
  return response.data;
}

