// Endpoints de búsqueda de viajes: operaciones para buscar viajes disponibles (para pasajeros)
import client from './client';

// Buscar viajes: buscar viajes publicados disponibles con filtros opcionales (origen, destino, fechas)
export async function searchTrips(filters = {}) {
  const response = await client.get('/passengers/trips/search', {
    params: filters, // qOrigin, qDestination, fromDate, toDate, page, pageSize
  });
  return response.data;
}

