import axios from 'axios';

/**
 * Axios client configured for Wheels UniSabana API
 * - Includes credentials (JWT cookies)
 * - Automatically adds CSRF token to state-changing requests
 * - Base URL from environment variable
 */

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store reference for clearing auth state on 401
let authStore = null;

/**
 * Set auth store reference (called from App.jsx or similar)
 * This allows the interceptor to clear auth state on 401 errors
 */
export function setAuthStore(store) {
  authStore = store;
}

/**
 * Get CSRF token from cookies
 */
function getCsrfToken() {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Request interceptor: Add CSRF token to state-changing requests
 */
client.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    
    // Log request for debugging
    console.log(`[API Client] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Add CSRF token to POST, PUT, PATCH, DELETE requests
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // If data is FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle common errors
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        code: 'network_error',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        originalError: error,
      });
    }

    // Handle 401 Unauthorized (missing or invalid session)
    if (error.response.status === 401) {
      const errorCode = error.response.data?.code || 'unauthorized';
      const errorMessage = error.response.data?.message || 'Missing or invalid session';
      
      // Clear auth state if store is available
      if (authStore) {
        authStore.getState().clearUser();
      }
      
      // Only redirect if it's a session-related error (not login/register endpoints)
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');
      
      if (!isAuthEndpoint) {
        // Redirect to home page
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

    // Handle API errors with consistent format
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

