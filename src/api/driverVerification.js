// Endpoints de verificación de conductor: operaciones para verificación de documentos de conductores
import client from './client';

// Enviar verificación: enviar documentos de verificación de conductor (multipart/form-data)
// Campos: fullName, documentNumber, licenseNumber, licenseExpiresAt, soatNumber, soatExpiresAt
// Archivos: govIdFront (requerido), govIdBack (opcional), driverLicense (requerido), soat (requerido)
export async function submitVerification(formData) {
  // formData debe ser una instancia de FormData
  const response = await client.post('/drivers/verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

// Obtener verificación: obtener perfil de verificación del conductor actual (sin datos sensibles)
export async function getMyVerification() {
  const response = await client.get('/drivers/verification');
  return response.data;
}
