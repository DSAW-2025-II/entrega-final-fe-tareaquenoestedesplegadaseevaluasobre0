// Componente principal de la aplicación: define todas las rutas y configuración global
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { setAuthStore } from './api/client'; // Conectar store para manejar errores 401 automáticamente

// Páginas de la aplicación
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SearchTrips from './pages/passenger/SearchTrips';
import PassengerMyTrips from './pages/passenger/MyTrips';
import DriverMyTrips from './pages/driver/MyTrips';
import MyProfile from './pages/profile/MyProfile';
import RegisterVehicle from './pages/driver/RegisterVehicle';
import BecomeDriver from './pages/driver/BecomeDriver';
import MyVehicle from './pages/driver/MyVehicle';
import ChangeVehicle from './pages/driver/ChangeVehicle';
import CreateTripOffer from './pages/driver/CreateTripOffer';
import TripDetails from './pages/driver/TripDetails';
import BookingRequests from './pages/driver/BookingRequests';
import CreateReview from './pages/reviews/CreateReview';
import DriverVerificationPage from './pages/driver/DriverVerification';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminAuditPage from './pages/admin/AdminAudit';
import Reports from './pages/Reports';
import DriverProfile from './pages/DriverProfile';
import PassengerProfile from './pages/PassengerProfile';

// Componentes comunes
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from "./Navbar";
import Hero from "./Hero";

// Página de inicio: redirige a usuarios autenticados según su rol o muestra landing page
function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />; // Admin redirige al panel de administración
    }
    return <Navigate to="/dashboard" replace />; // Otros usuarios redirigen al dashboard
  }

  // Usuario no autenticado: mostrar landing page con Hero
  return (
    <div className="text-neutral-900">
      <Navbar />
      <Hero />
    </div>
  );
}

// Router inteligente de mis viajes: muestra componente diferente según el rol del usuario
function MyTripsRouter() {
  const { user } = useAuthStore();
  
  if (user?.role === 'driver') {
    return <DriverMyTrips />; // Vista de viajes para conductores (gestión de ofertas)
  } else {
    return <PassengerMyTrips />; // Vista de viajes para pasajeros (gestión de reservas)
  }
}

export default function App() {
  // Conectar el store de autenticación con el cliente API: permite limpiar sesión automáticamente en errores 401
  useEffect(() => {
    setAuthStore(useAuthStore);
  }, []);

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard - requiere autenticación */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de pasajero - requiere rol "passenger" */}
        <Route 
          path="/search" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <SearchTrips />
            </ProtectedRoute>
          } 
        />
        
        {/* Mis viajes - usa componente diferente según el rol */}
        <Route 
          path="/my-trips" 
          element={
            <ProtectedRoute>
              <MyTripsRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/register-vehicle" 
          element={
            <ProtectedRoute requiredRole="driver">
              <RegisterVehicle />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/my-vehicle" 
          element={
            <ProtectedRoute requiredRole="driver">
              <MyVehicle />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/change-vehicle" 
          element={
            <ProtectedRoute requiredRole="driver">
              <ChangeVehicle />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/create-trip" 
          element={
            <ProtectedRoute requiredRole="driver">
              <CreateTripOffer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/trips/:id" 
          element={
            <ProtectedRoute requiredRole="driver">
              <TripDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/booking-requests" 
          element={
            <ProtectedRoute requiredRole="driver">
              <BookingRequests />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/verification"
          element={
            <ProtectedRoute requiredRole="driver">
              <DriverVerificationPage />
            </ProtectedRoute>
          }
        />

        {/* Perfil - requiere autenticación */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          } 
        />

        {/* Convertirse en conductor - solo para pasajeros */}
        <Route 
          path="/become-driver" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <BecomeDriver />
            </ProtectedRoute>
          } 
        />

        {/* Crear reseña - solo para pasajeros */}
        <Route 
          path="/trips/:tripId/review" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <CreateReview />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAuditPage />
            </ProtectedRoute>
          }
        />

        {/* Reportes - requiere autenticación */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />

        {/* Perfil público de conductor - muestra reseñas */}
        <Route 
          path="/drivers/:driverId" 
          element={
            <ProtectedRoute>
              <DriverProfile />
            </ProtectedRoute>
          } 
        />

        {/* Perfil público de pasajero */}
        <Route 
          path="/passengers/:passengerId" 
          element={
            <ProtectedRoute>
              <PassengerProfile />
            </ProtectedRoute>
          } 
        />

        {/* Fallback: redirige rutas no definidas a la página de inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
