// Cliente HTTP para todas las peticiones a la API: configuración centralizada de Axios
import axios from 'axios';

// Configurar Axios con base URL y cookies habilitadas (necesario para JWT en cookies httpOnly)
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Enviar cookies automáticamente en cada petición
  headers: {
    'Content-Type': 'application/json',
  },
});

// Referencia al store de autenticación: permite limpiar sesión automáticamente en errores 401
let authStore = null;

// Conectar el store de autenticación: se llama desde App.jsx para habilitar manejo automático de errores 401
export function setAuthStore(store) {
  authStore = store;
}

// Obtener token CSRF de las cookies del navegador o de sessionStorage (backup)
function getCsrfToken() {
  // Primero intentar leer de cookies (método principal)
  const cookieMatch = document.cookie.match(/csrf_token=([^;]+)/);
  if (cookieMatch) {
    return cookieMatch[1];
  }
  
  // Si no está en cookies, intentar leer de sessionStorage (backup para producción)
  // El token CSRF se guarda aquí después del login como respaldo
  const storedToken = sessionStorage.getItem('csrf_token');
  if (storedToken) {
    return storedToken;
  }
  
  return null;
}

// Interceptor de peticiones: agrega token CSRF y configura headers antes de enviar
client.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    
    console.log(`[API Client] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Agregar token CSRF a peticiones que modifican estado (protección contra CSRF)
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // FormData: dejar que Axios configure Content-Type automáticamente con boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas: maneja errores de forma consistente y limpia sesión en 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error de red: no hay respuesta del servidor (servidor caído o sin conexión)
    if (!error.response) {
      const baseURL = error.config?.baseURL || 'unknown';
      const url = error.config?.url || 'unknown';
      const fullURL = `${baseURL}${url}`;
      
      console.error('[API Client] Network error:', {
        message: error.message,
        code: error.code,
        url: fullURL,
        baseURL,
        path: url
      });
      
      return Promise.reject({
        code: 'network_error',
        message: `No se pudo conectar con el servidor en ${fullURL}. Verifica que el backend esté corriendo y que la URL sea correcta.`,
        originalError: error,
        url: fullURL
      });
    }

    // Error 401: sesión expirada o inválida - limpiar sesión y redirigir
    if (error.response.status === 401) {
      const errorCode = error.response.data?.code || 'unauthorized';
      const errorMessage = error.response.data?.message || 'Missing or invalid session';
      
      // Limpiar sesión del store de autenticación
      if (authStore) {
        authStore.getState().clearUser();
      }
      
      // Redirigir a inicio (excepto en endpoints de auth para evitar bucles de redirección)
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');
      
      if (!isAuthEndpoint) {
        window.location.href = '/';
      }
      
      return Promise.reject({
        status: 401,
        code: errorCode,
        message: errorMessage,
        details: error.response.data?.details || null,
        originalError: error,
      });
    }

    // Otros errores HTTP: normalizar formato para consumo consistente en componentes
    const apiError = {
      status: error.response.status,
      code: error.response.data?.code || 'unknown_error',
      message: error.response.data?.message || 'Ocurrió un error inesperado',
      details: error.response.data?.details || null,
      originalError: error,
    };

    return Promise.reject(apiError);
  }
);

export default client;

