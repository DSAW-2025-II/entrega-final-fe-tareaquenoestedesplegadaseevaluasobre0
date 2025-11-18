// Endpoints de auditoría administrativa: operaciones para listar y exportar logs de auditoría
import client from './client';

// Listar auditoría: listar entradas de auditoría con paginación y filtros opcionales
// Parámetros: page, pageSize, actorId, entity, from, to
export async function listAudit(params = {}) {
  const response = await client.get('/admin/audit', { params });
  return response.data;
}

// Exportar auditoría: exportar entradas de auditoría como stream NDJSON para descarga
// Parámetros: actorId, entity, from, to
export async function exportAudit(params = {}) {
  // Esperamos NDJSON; establecer responseType 'blob' para que el llamador pueda descargar
  const response = await client.get('/admin/audit/export', { params, responseType: 'blob' });
  return response;
}
