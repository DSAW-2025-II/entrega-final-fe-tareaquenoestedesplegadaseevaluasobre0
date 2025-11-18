// Utilidad para construir URLs completas de imágenes desde rutas relativas
export function getImageUrl(relativePath) {
  if (!relativePath) return null;
  
  // Si ya es una URL completa, retornarla tal cual
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Obtener URL base del backend desde variables de entorno
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Eliminar barra final si existe
  const cleanBaseURL = baseURL.replace(/\/$/, '');
  
  // Asegurar que la ruta relativa comience con /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${cleanBaseURL}${cleanPath}`;
}

