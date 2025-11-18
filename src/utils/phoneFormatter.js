// Formatear número de teléfono de formato E.164 (+573001234567) a formato de visualización (+57 XXX XXXXXXX)
export function formatPhone(phone) {
  if (!phone) return null;
  
  // Eliminar espacios existentes
  const cleaned = phone.replace(/\s/g, '');
  
  // Verificar si es un número colombiano (+57)
  if (cleaned.startsWith('+57')) {
    const number = cleaned.substring(3); // Remover +57
    if (number.length === 10) {
      // Formato: +57 XXX XXXXXXX
      return `+57 ${number.substring(0, 3)} ${number.substring(3)}`;
    }
  }
  
  // Si no coincide con el formato esperado, retornar tal cual
  return phone;
}

