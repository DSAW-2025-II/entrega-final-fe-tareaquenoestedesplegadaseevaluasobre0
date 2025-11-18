// Endpoints de vehículos: operaciones relacionadas con gestión de vehículos (solo para conductores)
import client from './client';

// Registrar nuevo vehículo: crear nuevo vehículo para el conductor actual con fotos opcionales
export async function registerVehicle(vehicleData) {
  const formData = new FormData();
  
  formData.append('plate', vehicleData.licensePlate);
  formData.append('brand', vehicleData.brand);
  formData.append('model', vehicleData.model);
  formData.append('capacity', vehicleData.capacity.toString());
  
  if (vehicleData.vehiclePhoto) {
    formData.append('vehiclePhoto', vehicleData.vehiclePhoto);
  }
  
  if (vehicleData.soatPhoto) {
    formData.append('soatPhoto', vehicleData.soatPhoto);
  }

  const response = await client.post('/api/drivers/vehicle', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

// Obtener vehículo: obtener información del vehículo del conductor actual
export async function getMyVehicle() {
  const response = await client.get('/api/drivers/vehicle');
  return response.data;
}

// Actualizar vehículo: actualizar información del vehículo del conductor actual (soporta fotos)
export async function updateMyVehicle(updates) {
  // Si hay archivos, usar FormData para multipart/form-data
  if (updates.vehiclePhoto || updates.soatPhoto) {
    const formData = new FormData();
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        if (key === 'vehiclePhoto' || key === 'soatPhoto') {
          formData.append(key, updates[key]);
        } else {
          formData.append(key, updates[key].toString());
        }
      }
    });

    const response = await client.patch('/api/drivers/vehicle', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Solo texto: usar JSON para actualización sin archivos
  const response = await client.patch('/api/drivers/vehicle', updates);
  return response.data;
}

// Eliminar vehículo: eliminar vehículo del conductor actual (requiere no tener viajes activos)
export async function deleteMyVehicle() {
  await client.delete('/api/drivers/vehicle');
}

