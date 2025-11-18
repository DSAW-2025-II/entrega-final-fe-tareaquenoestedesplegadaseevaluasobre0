// Componente que protege rutas: requiere autenticación y opcionalmente un rol específico
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Logging para debugging: registrar intentos de acceso denegado
  useEffect(() => {
    if (requiredRole && user?.role !== requiredRole) {
      console.warn(
        `[ProtectedRoute] Access denied to ${location.pathname}. Required: ${requiredRole}, Current: ${user?.role}`
      );
    }
  }, [requiredRole, user?.role, location.pathname]);

  // No autenticado: redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol si se especificó uno
  if (requiredRole && user?.role !== requiredRole) {
    // Manejo especial: pasajero intenta acceder a rutas de conductor
    if (requiredRole === 'driver' && user?.role === 'passenger') {
      // Si intenta registrar vehículo, redirigir al flujo de convertirse en conductor
      if (location.pathname === '/driver/register-vehicle') {
        return <Navigate to="/become-driver" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
    
    // Redirigir según el rol actual del usuario
    if (user?.role === 'passenger') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'driver') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children; // Usuario autorizado: mostrar contenido
}

