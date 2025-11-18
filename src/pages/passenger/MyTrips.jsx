// Página de mis viajes (pasajero): lista y gestiona las reservas del pasajero con pestañas por estado
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import { getMyBookings, cancelBooking } from '../../api/booking';
import { getMyReviewForTrip } from '../../api/review';
import { getPendingPayments } from '../../api/payment';
import Toast from '../../components/common/Toast';
import ReportUserModal from '../../components/users/ReportUserModal';
import PaymentModal from '../../components/payment/PaymentModal';
import Navbar from '../../components/common/Navbar';
import { getImageUrl } from '../../utils/imageUrl';

export default function MyTrips() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reserved'); // 'pending', 'in-progress', 'reserved', 'completed', 'canceled'
  const [reviewsMap, setReviewsMap] = useState({}); // Mapa de tripId -> review
  const [showReportModal, setShowReportModal] = useState(null); // {userId, userName, tripId}
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null); // Para modal de detalles
  const [showPaymentModal, setShowPaymentModal] = useState(null); // Reserva para pago
  const [pendingPayments, setPendingPayments] = useState([]);
  const [hasInitializedTab, setHasInitializedTab] = useState(false); // Rastrear si la pestaña ha sido auto-seleccionada en carga inicial
  const [isMobile, setIsMobile] = useState(false); // Rastrear si estamos en móvil

  useEffect(() => {
    console.log('[MyTrips] Component mounted, loading bookings...');
    loadBookings();
    loadPendingPayments();
    
    // Verificar si es móvil al montar
    const checkMobile = () => {
      const mobile = window.innerWidth <= 480;
      console.log('[MyTrips] Screen width:', window.innerWidth, 'Is mobile:', mobile);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Cargar pagos pendientes de viajes completados
  const loadPendingPayments = async () => {
    try {
      const data = await getPendingPayments();
      setPendingPayments(data.bookings || []);
    } catch (err) {
      console.error('[MyTrips] Error loading pending payments:', err);
    }
  };

  // Verificar si el viaje está en el futuro
  const isTripUpcoming = (departureDate) => {
    return new Date(departureDate) > new Date();
  };

  // Verificar si el viaje está en el pasado
  const isTripPast = (departureDate) => {
    return new Date(departureDate) < new Date();
  };

  // Categorizar reservas según estado del viaje (no fechas)
  // En progreso: viajes aceptados donde el viaje tiene status 'in_progress'
  const inProgressBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    if (b.status !== 'accepted') return false;
    return b.trip.status === 'in_progress';
  });

  // Reservados: solo aceptados donde el viaje está 'published' (aún no iniciado)
  const reservedBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    // Solo mostrar aceptadas que aún no han iniciado
    if (b.status === 'accepted' && b.trip.status === 'published') return true;
    return false;
  });

  // Pendientes: reservas que aún no han sido aceptadas o rechazadas
  const pendingBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    return b.status === 'pending';
  });

  // Completados: viajes aceptados donde el viaje tiene status 'completed'
  const completedBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    if (b.status !== 'accepted') return false;
    return b.trip.status === 'completed';
  });

  // Rechazados: Reservas rechazadas por el conductor
  const declinedBookings = bookings.filter(b => {
    if (!b) return false;
    return ['declined', 'declined_auto'].includes(b.status);
  });

  // Cancelados: Reservas canceladas por el pasajero, plataforma o expiradas
  const canceledBookings = bookings.filter(b => {
    if (!b) return false;
    return ['canceled_by_passenger', 'canceled_by_platform', 'expired'].includes(b.status);
  });

  // Load reviews for completed trips
  useEffect(() => {
    const loadReviews = async () => {
      const reviews = {};
      for (const booking of completedBookings) {
        try {
          const review = await getMyReviewForTrip(booking.tripId);
          reviews[booking.tripId] = review;
        } catch (error) {
          // Review doesn't exist yet, that's OK
          if (error.status !== 404) {
            console.error('Error loading review:', error);
          }
        }
      }
      setReviewsMap(reviews);
    };

    if (completedBookings.length > 0) {
      loadReviews();
    }
  }, [completedBookings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first tab with bookings (only on initial load, not when user manually changes tabs)
  useEffect(() => {
    // Only auto-select tab on initial load, not when user manually changes tabs
    if (!hasInitializedTab && bookings.length > 0) {
      // Switch to first tab with content
      if (pendingBookings.length > 0) {
        setActiveTab('pending');
        setHasInitializedTab(true);
      } else if (reservedBookings.length > 0) {
        setActiveTab('reserved');
        setHasInitializedTab(true);
      } else if (inProgressBookings.length > 0) {
        setActiveTab('in-progress');
        setHasInitializedTab(true);
      } else if (completedBookings.length > 0) {
        setActiveTab('completed');
        setHasInitializedTab(true);
      } else if (declinedBookings.length > 0) {
        setActiveTab('declined');
        setHasInitializedTab(true);
      } else if (canceledBookings.length > 0) {
        setActiveTab('canceled');
        setHasInitializedTab(true);
      }
    }
  }, [bookings.length, pendingBookings.length, reservedBookings.length, inProgressBookings.length, completedBookings.length, declinedBookings.length, canceledBookings.length, hasInitializedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBookings = async () => {
    try {
      console.log('[MyTrips] loadBookings called, making API request...');
      setLoading(true);
      setError(null);
      const data = await getMyBookings();
      console.log('[MyTrips] Bookings loaded:', data);
      console.log('[MyTrips] Bookings items:', data.items);
      console.log('[MyTrips] Total bookings:', data.total);
      
      // Validate bookings structure
      if (data.items && Array.isArray(data.items)) {
        // Log payment methods for debugging
        data.items.forEach((booking, index) => {
          console.log(`[MyTrips] Booking ${index} paymentMethod:`, booking.paymentMethod, 'booking:', booking);
        });
        const validBookings = data.items.filter(booking => {
          if (!booking) {
            console.warn('[MyTrips] Null booking found');
            return false;
          }
          if (!booking.trip) {
            console.warn('[MyTrips] Booking without trip:', booking.id);
            return false;
          }
          if (!booking.trip.origin || !booking.trip.destination) {
            console.warn('[MyTrips] Booking with incomplete trip data:', booking.id, booking.trip);
            return false;
          }
          return true;
        });
        console.log('[MyTrips] Valid bookings:', validBookings.length);
        setBookings(validBookings);
      } else {
        console.warn('[MyTrips] Invalid data structure:', data);
        setBookings([]);
      }
    } catch (err) {
      console.error('[MyTrips] Error loading bookings:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar tus viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await cancelBooking(selectedBooking.id);
      setSuccess('Viaje cancelado exitosamente');
      setSelectedBooking(null);
      loadBookings(); // Reload bookings
    } catch (err) {
      console.error('[MyTrips] Cancel error:', err);
      setError(err.message || 'Error al cancelar el viaje');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status, booking) => {
    // Determine badge text based on booking status and trip status
    // Priority: trip.status > booking.status
    let badgeText = '';
    let badgeBg = 'rgba(3, 37, 103, 0.1)';
    let badgeColor = '#032567';

    // First check trip status for accepted bookings (this is the source of truth)
    if (status === 'accepted' && booking?.trip?.status) {
      if (booking.trip.status === 'in_progress') {
        badgeText = 'En progreso';
        badgeBg = 'rgba(3, 37, 103, 0.1)';
        badgeColor = '#032567';
      } else if (booking.trip.status === 'completed') {
        badgeText = 'Completado';
        badgeBg = 'rgba(3, 37, 103, 0.1)';
        badgeColor = '#032567';
      } else if (booking.trip.status === 'published') {
        badgeText = 'Confirmado';
        badgeBg = 'rgba(3, 37, 103, 0.1)';
        badgeColor = '#032567';
      } else {
        // Fallback for other trip statuses
        badgeText = 'Confirmado';
        badgeBg = 'rgba(3, 37, 103, 0.1)';
        badgeColor = '#032567';
      }
    } else if (status === 'pending') {
      badgeText = 'Pendiente';
      badgeBg = 'rgba(3, 37, 103, 0.1)';
      badgeColor = '#032567';
    } else if (['declined', 'declined_auto'].includes(status)) {
      badgeBg = '#fef2f2';
      badgeColor = '#991b1b';
      badgeText = 'Rechazado';
    } else if (['canceled_by_passenger', 'canceled_by_platform', 'expired'].includes(status)) {
      badgeBg = '#f5f5f4';
      badgeColor = '#57534e';
      if (status === 'expired') {
        badgeText = 'Expirado';
      } else {
        badgeText = 'Cancelado';
      }
    } else {
      badgeText = 'Pendiente';
      badgeBg = 'rgba(3, 37, 103, 0.1)';
      badgeColor = '#032567';
    }

    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: badgeBg,
        color: badgeColor,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badgeText}
      </span>
    );
  };


  // Debug logs
  console.log('[MyTrips] Total bookings:', bookings.length);
  console.log('[MyTrips] All bookings:', bookings);
  bookings.forEach((b, i) => {
    console.log(`[MyTrips] Booking ${i}:`, {
      id: b?.id,
      status: b?.status,
      hasTrip: !!b?.trip,
      tripId: b?.tripId,
      tripOrigin: b?.trip?.origin,
      tripDestination: b?.trip?.destination
    });
  });
  // Get count for each category
  const getCategoryCount = (category) => {
    switch(category) {
      case 'pending': return pendingBookings.length;
      case 'in-progress': return inProgressBookings.length;
      case 'reserved': return reservedBookings.length;
      case 'completed': return completedBookings.length;
      case 'declined': return declinedBookings.length;
      case 'canceled': return canceledBookings.length;
      default: return 0;
    }
  };

  // Get bookings for active tab
  const getActiveBookings = () => {
    switch(activeTab) {
      case 'pending': return pendingBookings;
      case 'in-progress': return inProgressBookings;
      case 'reserved': return reservedBookings;
      case 'completed': return completedBookings;
      case 'declined': return declinedBookings;
      case 'canceled': return canceledBookings;
      default: return [];
    }
  };

  const activeBookings = getActiveBookings();

  // Debug logs
  console.log('[MyTrips] In-progress bookings:', inProgressBookings.length);
  console.log('[MyTrips] Reserved bookings (pending):', reservedBookings.length);
  console.log('[MyTrips] Completed bookings:', completedBookings.length);
  console.log('[MyTrips] Canceled bookings:', canceledBookings.length);
  console.log('[MyTrips] Active tab:', activeTab);
  console.log('[MyTrips] Active bookings for tab:', activeBookings.length);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e7e5e4',
            borderTop: '3px solid #032567',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando viajes...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const AlertNotification = ({ type, message, onClose }) => (
    <div className="notification-alert" style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '1280px',
      zIndex: 99999,
      backgroundColor: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'start',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      pointerEvents: 'auto'
    }}>
      {type === 'success' && <span style={{ color: '#16a34a', fontSize: '20px' }}>OK</span>}
      <div style={{ flex: 1 }}>
        <p style={{ 
          color: type === 'error' ? '#991b1b' : '#15803d', 
          fontSize: '14px', 
          margin: 0, 
          fontFamily: 'Inter, sans-serif' 
        }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: type === 'error' ? '#991b1b' : '#15803d',
          cursor: 'pointer',
          padding: '0',
          fontSize: '18px',
          lineHeight: '1'
        }}
      >
        X
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Navbar */}
      <Navbar activeLink="my-trips" />

      {/* Alerts - Rendered via Portal to body */}
      {error && createPortal(
        <AlertNotification type="error" message={error} onClose={() => setError(null)} />,
        document.body
      )}

      {success && createPortal(
        <AlertNotification type="success" message={success} onClose={() => setSuccess(null)} />,
        document.body
      )}

      {/* Main Content */}
      <div className="main-content-container" style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif',
            margin: 0
          }}>
            Mis viajes
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            margin: '8px 0 0 0'
          }}>
            Gestiona todas tus reservas de viaje
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs-container" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #e7e5e4',
          paddingBottom: '0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {[
            { id: 'pending', label: 'Pendientes' },
            { id: 'in-progress', label: 'En progreso' },
            { id: 'reserved', label: 'Reservados' },
            { id: 'completed', label: 'Historial' },
            { id: 'declined', label: 'Rechazados' },
            { id: 'canceled', label: 'Cancelados' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tab-button"
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                fontWeight: activeTab === tab.id ? '500' : 'normal',
                color: activeTab === tab.id ? '#032567' : '#57534e',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #032567' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                position: 'relative',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.target.style.color = '#1c1917';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.target.style.color = '#57534e';
              }}
            >
              {tab.label}
              {getCategoryCount(tab.id) > 0 && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: activeTab === tab.id ? '#032567' : '#e7e5e4',
                  color: activeTab === tab.id ? 'white' : '#57534e'
                }}>
                  {getCategoryCount(tab.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {activeBookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '1px solid #e7e5e4'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {bookings.length === 0 
                ? 'No tienes reservas aún' 
                : activeTab === 'pending' && 'No tienes solicitudes pendientes'
                || activeTab === 'in-progress' && 'No tienes viajes en progreso'
                || activeTab === 'reserved' && 'No tienes viajes reservados'
                || activeTab === 'completed' && 'No tienes viajes completados'
                || activeTab === 'declined' && 'No tienes reservas rechazadas'
                || activeTab === 'canceled' && 'No tienes viajes cancelados'}
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {bookings.length === 0 
                ? 'Busca viajes disponibles y solicita tu primera reserva'
                : activeTab === 'pending' && 'Las solicitudes de reserva que aún no han sido aceptadas aparecerán aquí'
                || activeTab === 'reserved' && 'Busca viajes disponibles y solicita tu primera reserva'
                || 'Los viajes aparecerán aquí cuando corresponda'}
            </p>
            {activeTab === 'reserved' && (
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
              >
                Buscar viajes
              </button>
            )}
          </div>
        ) : (
          <div className="bookings-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {activeBookings.map((booking) => {
              // Validate booking data
              if (!booking || !booking.trip || !booking.trip.origin || !booking.trip.destination) {
                console.warn('[MyTrips] Invalid booking data:', booking);
                return null;
              }
              
              return (
              <div
                key={booking.id}
                className="booking-card"
                onClick={(e) => {
                  // Check if we're on mobile
                  const isMobileView = window.innerWidth <= 480;
                  
                  if (!isMobileView) {
                    return; // Don't do anything on desktop
                  }
                  
                  // Check if click is on a link - let it work normally
                  const clickedLink = e.target.closest('a');
                  if (clickedLink) {
                    // Let the link handle its own navigation
                    return;
                  }
                  
                  // Check if click is on a button - let the button handle it
                  const clickedButton = e.target.closest('button');
                  if (clickedButton) {
                    // Let the button's onClick handle the action
                    return;
                  }
                  
                  // On mobile, clicking anywhere else on the card opens details
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Open the booking details modal
                  setSelectedBookingDetails(booking);
                }}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e7e5e4',
                  borderRadius: '16px',
                  padding: '28px',
                  transition: 'all 0.2s',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <div className="booking-header-flex" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {booking.trip.origin.text} → {booking.trip.destination.text}
                      </h3>
                      {getStatusBadge(booking.status, booking)}
                    </div>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#57534e',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(booking.trip.departureAt)}
                    </p>
                  </div>
                </div>

                <div className="booking-info-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                  gap: 'clamp(12px, 2vw, 20px)',
                  marginBottom: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #f5f5f4'
                }}>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Asientos
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.seats} {booking.seats === 1 ? 'asiento' : 'asientos'}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#57534e',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Conductor
                      </p>
                      {booking.status === 'accepted' && booking.trip.driverId && (
                        <button
                          onClick={() => setShowReportModal({
                            userId: booking.trip.driverId,
                            userName: `${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`,
                            tripId: booking.tripId
                          })}
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 'normal',
                            color: '#dc2626',
                            backgroundColor: 'transparent',
                            border: '1px solid #dc2626',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                          title="Reportar conductor"
                        >
                          Reportar
                        </button>
                      )}
                    </div>
                    {(booking.trip.driverId || booking.trip.driver?.id) ? (
                      <Link
                        to={`/drivers/${booking.trip.driverId || booking.trip.driver.id}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#032567',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1A6EFF'}
                        onMouseLeave={(e) => e.target.style.color = '#032567'}
                      >
                        {booking.trip.driver.firstName} {booking.trip.driver.lastName} →
                      </Link>
                    ) : (
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Total
                    </p>
                    <p style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#032567',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat * booking.seats)}
                    </p>
                  </div>
                </div>

                {booking.note && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid #fde68a'
                  }}>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Tu mensaje:
                    </p>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontStyle: 'italic'
                    }}>
                      "{booking.note}"
                    </p>
                  </div>
                )}

                {/* Warning for pending bookings */}
                {booking.status === 'pending' && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#92400e',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '500'
                    }}>
                      ⏳ Esperando respuesta del conductor
                    </p>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#78350f',
                      margin: '4px 0 0 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Esta es una solicitud de reserva. El conductor aún no la ha aceptado. Podrás realizar el pago una vez que sea aceptada.
                    </p>
                  </div>
                )}

                {/* Actions based on status */}
                {booking.status === 'pending' && (
                  <div className="booking-actions-flex" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', minWidth: 0 }}>
                    <button
                      className="btn-ver-detalles"
                      onClick={() => setSelectedBookingDetails(booking)}
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.95rem',
                        fontWeight: 'normal',
                        color: '#032567',
                        backgroundColor: 'white',
                        border: '2px solid #032567',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: 'Inter, sans-serif',
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                        minWidth: 0,
                        flexShrink: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                      }}
                    >
                      Ver detalles
                    </button>
                    {/* Only show cancel button if trip hasn't started */}
                    {booking.trip && booking.trip.status === 'published' && (
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.95rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          maxWidth: '100%',
                          minWidth: 0,
                          flexShrink: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                )}

                {booking.status === 'accepted' && booking.trip.status === 'published' && (
                  <div className="booking-status-container" style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#15803d',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500'
                      }}>
                        Viaje confirmado. El pago se habilitará cuando el viaje comience o finalice.
                      </p>
                    </div>
                    <div className="booking-actions-flex" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
                      <button
                        className="btn-ver-detalles"
                        onClick={() => setSelectedBookingDetails(booking)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          maxWidth: '100%',
                          minWidth: 0,
                          flexShrink: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          position: 'relative',
                          boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                        }}
                      >
                        Ver detalles
                      </button>
                      {/* Only show cancel button if trip hasn't started */}
                      {booking.trip.status === 'published' && (
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '0.9rem',
                            fontWeight: 'normal',
                            color: '#dc2626',
                            backgroundColor: 'white',
                            border: '2px solid #dc2626',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            boxSizing: 'border-box',
                            maxWidth: '100%',
                            minWidth: 0,
                            flexShrink: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                          }}
                        >
                          Cancelar reserva
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {booking.status === 'accepted' && booking.trip.status === 'in_progress' && (
                  <div className="booking-status-container" style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(3, 37, 103, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(3, 37, 103, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#032567',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500'
                      }}>
                        Viaje en progreso. El pago se habilitará cuando el viaje finalice.
                      </p>
                    </div>
                    <div className="booking-actions-flex" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
                      <button
                        className="btn-ver-detalles"
                        onClick={() => setSelectedBookingDetails(booking)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          maxWidth: '100%',
                          minWidth: 0,
                          flexShrink: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          position: 'relative',
                          boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                        }}
                      >
                        Ver detalles
                      </button>
                      {/* Cancel button not shown for in_progress trips - trip has already started */}
                    </div>
                  </div>
                )}

                {booking.status === 'accepted' && booking.trip.status === 'completed' && (
                  <div className="booking-status-container" style={{
                    padding: '12px 16px',
                    backgroundColor: booking.paymentStatus === 'pending' ? '#fef3c7' : 'rgba(3, 37, 103, 0.05)',
                    borderRadius: '12px',
                    border: `1px solid ${booking.paymentStatus === 'pending' ? '#fcd34d' : 'rgba(3, 37, 103, 0.15)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.9rem',
                        color: booking.paymentStatus === 'pending' ? '#92400e' : '#032567',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500'
                      }}>
                        {booking.paymentStatus === 'pending' 
                          ? 'Viaje completado - Realiza el pago ahora'
                          : 'Viaje completado - Pago completado'}
                      </p>
                    </div>
                    <div className="booking-actions-flex" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
                      {booking.paymentStatus !== 'completed' && (
                        <button
                          onClick={() => setShowPaymentModal(booking)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '0.9rem',
                            fontWeight: 'normal',
                            color: 'white',
                            backgroundColor: '#032567',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%',
                            minWidth: 0,
                            flexShrink: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                        >
                          Pagar
                        </button>
                      )}
                      <button
                        className="btn-ver-detalles"
                        onClick={() => setSelectedBookingDetails(booking)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          maxWidth: '100%',
                          minWidth: 0,
                          flexShrink: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          position: 'relative',
                          boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                        }}
                      >
                        Ver detalles
                      </button>
                      {/* Cancel button not shown for completed trips - trip has already finished */}
                      {reviewsMap[booking.tripId] ? (
                        <button
                          onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '0.9rem',
                            fontWeight: 'normal',
                            color: '#032567',
                            backgroundColor: 'white',
                            border: '2px solid #032567',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            boxSizing: 'border-box',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f0f9ff';
                            e.target.style.borderColor = '#1A6EFF';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#032567';
                          }}
                        >
                          Ver/Editar reseña
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '0.9rem',
                            fontWeight: 'normal',
                            color: 'white',
                            backgroundColor: '#032567',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                        >
                          Escribir reseña
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(booking.status === 'declined' || booking.status === 'declined_auto') && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#991b1b',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                      flex: '1 1 auto',
                      minWidth: 0
                    }}>
                      El conductor no pudo aceptar tu reserva
                    </p>
                    <button
                      className="btn-ver-detalles"
                      onClick={() => setSelectedBookingDetails(booking)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '0.9rem',
                        fontWeight: 'normal',
                        color: '#032567',
                        backgroundColor: 'white',
                        border: '2px solid #032567',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: 'Inter, sans-serif',
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                        minWidth: 0,
                        flexShrink: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                      }}
                    >
                      Ver detalles
                    </button>
                  </div>
                )}

                {/* Action buttons section - Always at bottom of card, visible on mobile */}
                <div className="booking-card-actions" style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  marginTop: '20px',
                  marginLeft: '0',
                  marginRight: '0',
                  paddingTop: '20px',
                  paddingLeft: '0',
                  paddingRight: '0',
                  paddingBottom: '0',
                  borderTop: '1px solid #f5f5f4',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  minWidth: 0,
                  position: 'relative'
                }}>
                  {/* Ver detalles button - Always shown */}
                  <button
                    onClick={() => setSelectedBookingDetails(booking)}
                    className="btn-ver-detalles"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      fontWeight: 'normal',
                      color: '#032567',
                      backgroundColor: 'white',
                      border: '2px solid #032567',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: 'Inter, sans-serif',
                      boxSizing: 'border-box',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flexShrink: 1,
                      position: 'relative',
                      boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)'
                    }}
                  >
                    Ver detalles
                  </button>

                  {/* Cancel button - Only for pending or accepted bookings where trip hasn't started */}
                  {(booking.status === 'pending' || (booking.status === 'accepted' && booking.trip?.status === 'published')) && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="btn-cancelar"
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.95rem',
                        fontWeight: 'normal',
                        color: '#dc2626',
                        backgroundColor: 'white',
                        border: '2px solid #dc2626',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Cancelar reserva
                    </button>
                  )}

                  {/* Pay button - Only for completed trips with pending payment */}
                  {booking.status === 'accepted' && booking.trip?.status === 'completed' && booking.paymentStatus !== 'completed' && (
                    <button
                      onClick={() => setShowPaymentModal(booking)}
                      className="btn-pagar"
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.95rem',
                        fontWeight: 'normal',
                        color: 'white',
                        backgroundColor: '#032567',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                    >
                      Pagar
                    </button>
                  )}

                  {/* Review buttons - Only for completed trips */}
                  {booking.status === 'accepted' && booking.trip?.status === 'completed' && (
                    reviewsMap[booking.tripId] ? (
                      <button
                        onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                        className="btn-resena"
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.95rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f0f9ff';
                          e.target.style.borderColor = '#1A6EFF';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'white';
                          e.target.style.borderColor = '#032567';
                        }}
                      >
                        Ver/Editar reseña
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                        className="btn-resena"
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.95rem',
                          fontWeight: 'normal',
                          color: 'white',
                          backgroundColor: '#032567',
                          border: 'none',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          boxSizing: 'border-box',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                      >
                        Escribir reseña
                      </button>
                    )
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => !cancelLoading && setSelectedBooking(null)}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ¿Cancelar reserva?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6'
            }}>
              Estás a punto de cancelar tu reserva para el viaje de <strong>{selectedBooking.trip.origin.text}</strong> a <strong>{selectedBooking.trip.destination.text}</strong>. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#f5f5f4';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = 'white';
                }}
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: cancelLoading ? '#94a3b8' : '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#032567';
                }}
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <ReportUserModal
          userId={showReportModal.userId}
          userName={showReportModal.userName}
          tripId={showReportModal.tripId}
          onClose={() => setShowReportModal(null)}
          onReported={() => {
            setSuccess('Usuario reportado exitosamente');
          }}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setSelectedBookingDetails(null)}
        >
          <div
            className="modal-content-responsive"
            style={{
              maxWidth: 'clamp(280px, 90vw, 600px)',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: 'clamp(16px, 4vw, 32px)',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 4vw, 2rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                fontFamily: 'Inter, sans-serif',
                margin: 0
              }}>
                Detalles del viaje
              </h2>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#57534e',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1c1917'}
                onMouseLeave={(e) => e.target.style.color = '#57534e'}
              >
                X
              </button>
            </div>

            {/* Booking Status */}
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: selectedBookingDetails.status === 'accepted' ? 'rgba(3, 37, 103, 0.05)' : selectedBookingDetails.status === 'pending' ? '#fffbeb' : '#fef2f2',
              borderRadius: '12px',
              border: `1px solid ${selectedBookingDetails.status === 'accepted' ? 'rgba(3, 37, 103, 0.15)' : selectedBookingDetails.status === 'pending' ? '#fde68a' : '#fca5a5'}`
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: selectedBookingDetails.status === 'accepted' ? '#032567' : selectedBookingDetails.status === 'pending' ? '#92400e' : '#991b1b',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500'
              }}>
                Estado: {selectedBookingDetails.status === 'accepted' ? 'Aceptado' : selectedBookingDetails.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                {selectedBookingDetails.trip?.status === 'completed' && ' • Viaje completado'}
                {selectedBookingDetails.trip?.status === 'in_progress' && ' • Viaje en progreso'}
              </p>
            </div>

            {/* Total Price Badge */}
            <div style={{
              backgroundColor: '#032567',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '0.9rem',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif',
                opacity: 0.9
              }}>
                Total pagado
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: '600',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatPrice(selectedBookingDetails.trip.pricePerSeat * selectedBookingDetails.seats)}
              </p>
              <p style={{
                fontSize: '0.85rem',
                margin: '4px 0 0 0',
                fontFamily: 'Inter, sans-serif',
                opacity: 0.8
              }}>
                {selectedBookingDetails.seats} {selectedBookingDetails.seats === 1 ? 'asiento' : 'asientos'} x {formatPrice(selectedBookingDetails.trip.pricePerSeat)}
              </p>
            </div>

            {/* Route Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Ruta
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#16a34a', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Origen
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {selectedBookingDetails.trip.origin.text}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#dc2626', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Destino
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {selectedBookingDetails.trip.destination.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Horario
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Salida
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(selectedBookingDetails.trip.departureAt)}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Llegada estimada
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(selectedBookingDetails.trip.estimatedArrivalAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Trip Notes */}
            {selectedBookingDetails.trip.notes && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#fffbeb',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Notas del conductor
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#57534e',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedBookingDetails.trip.notes}
                </p>
              </div>
            )}

            {/* Passenger Note */}
            {selectedBookingDetails.note && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: 'rgba(3, 37, 103, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(3, 37, 103, 0.15)'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Tu mensaje
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#57534e',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontStyle: 'italic'
                }}>
                  "{selectedBookingDetails.note}"
                </p>
              </div>
            )}

            {/* Driver Info */}
            {selectedBookingDetails.trip.driver && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#f5f5f4',
                borderRadius: '12px'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '16px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Conductor
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    minWidth: '60px',
                    minHeight: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#032567',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    overflow: 'hidden',
                    flexShrink: 0,
                    aspectRatio: '1 / 1'
                  }}>
                    {selectedBookingDetails.trip.driver?.profilePhotoUrl ? (
                      <img
                        src={getImageUrl(selectedBookingDetails.trip.driver.profilePhotoUrl)}
                        alt={`${selectedBookingDetails.trip.driver?.firstName} ${selectedBookingDetails.trip.driver?.lastName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          aspectRatio: '1 / 1',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <span>{`${selectedBookingDetails.trip.driver?.firstName?.[0] || ''}${selectedBookingDetails.trip.driver?.lastName?.[0] || ''}`.toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/drivers/${selectedBookingDetails.trip.driverId || selectedBookingDetails.trip.driver?.id}`}
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        color: '#032567',
                        margin: '0 0 4px 0',
                        fontFamily: 'Inter, sans-serif',
                        textDecoration: 'none',
                        display: 'block',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#1A6EFF'}
                      onMouseLeave={(e) => e.target.style.color = '#032567'}
                    >
                      {selectedBookingDetails.trip.driver?.firstName} {selectedBookingDetails.trip.driver?.lastName} →
                    </Link>
                    {selectedBookingDetails.trip.vehicle && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#57534e',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {selectedBookingDetails.trip.vehicle.brand} {selectedBookingDetails.trip.vehicle.model}
                        {selectedBookingDetails.trip.vehicle.plate && ` • ${selectedBookingDetails.trip.vehicle.plate}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Booking Date */}
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <p style={{
                fontSize: '0.8rem',
                color: '#57534e',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Fecha de reserva
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: '#1c1917',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatDate(selectedBookingDetails.createdAt)}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cerrar
              </button>
              {selectedBookingDetails.status === 'accepted' && selectedBookingDetails.trip.status === 'completed' && !reviewsMap[selectedBookingDetails.tripId] && (
                <button
                  onClick={() => {
                    setSelectedBookingDetails(null);
                    navigate(`/trips/${selectedBookingDetails.tripId}/review`);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: '#032567',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                >
                  Escribir reseña
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          booking={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSuccess={async () => {
            setShowPaymentModal(null);
            // Only show success message for card payments, not cash (driver needs to confirm)
            if (showPaymentModal.paymentMethod === 'card') {
              setSuccess('Pago realizado exitosamente');
            }
            // Refresh bookings and pending payments
            await loadBookings();
            await loadPendingPayments();
            // Small delay to ensure backend has processed the payment update
            await new Promise(resolve => setTimeout(resolve, 500));
          }}
        />
      )}

      {/* Responsive Styles */}
      <style>{`
        /* Global modal responsive styles */
        .modal-content-responsive {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Hide scrollbar but keep functionality */
        .tabs-container::-webkit-scrollbar {
          display: none;
        }
        .tabs-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          /* Reduce padding of main content container */
          .main-content-container {
            padding-left: clamp(8px, 2vw, 12px) !important;
            padding-right: clamp(8px, 2vw, 12px) !important;
            padding-top: clamp(16px, 4vw, 24px) !important;
            padding-bottom: clamp(16px, 4vw, 24px) !important;
          }
          .modal-content-responsive h2,
          .modal-content-responsive h3 {
            font-size: clamp(1rem, 4vw, 1.5rem) !important;
          }
          .modal-content-responsive {
            padding: clamp(12px, 3vw, 16px) !important;
          }
          .tabs-container {
            gap: 4px !important;
            padding: 0 4px !important;
            margin-left: -4px !important;
            margin-right: -4px !important;
          }
          .tab-button {
            font-size: 0.75rem !important;
            padding: 8px 10px !important;
            white-space: nowrap !important;
          }
          .bookings-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          .booking-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: clamp(12px, 3vw, 16px) !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            overflow-y: visible !important;
            position: relative !important;
          }
          .booking-card > * {
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            width: 100% !important;
          }
          .booking-card > * > * {
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          /* Ensure all nested elements respect container width */
          .booking-card * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          /* Override inline styles for status containers on mobile */
          .booking-status-container {
            width: 100% !important;
            max-width: 100% !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          /* Ensure buttons section respects card padding and doesn't overflow */
          .booking-card-actions {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          /* Ensure all action containers respect width */
          .booking-actions-flex {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            min-width: 0 !important;
          }
          .booking-actions-flex button {
            max-width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            flex-shrink: 1 !important;
          }
          .booking-info-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Hide buttons inside status containers on mobile, except payment buttons */
          .booking-status-container .booking-actions-flex {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            margin-top: 12px !important;
          }
          .booking-status-container button {
            display: block !important;
            width: 100% !important;
          }
          /* Hide button in declined container */
          .booking-card > div[style*="backgroundColor: '#fef2f2'"] button {
            display: none !important;
          }
          /* Show only the message in status containers */
          .booking-status-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 14px) !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow-x: hidden !important;
            min-width: 0 !important;
          }
          .booking-status-container > div:first-child {
            width: 100% !important;
            max-width: 100% !important;
            flex: none !important;
            box-sizing: border-box !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
          .booking-status-container > div:first-child p {
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
          /* Ensure action containers are properly contained on mobile */
          .booking-card .booking-actions-flex {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            overflow-y: visible !important;
            min-width: 0 !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            position: relative !important;
          }
          /* Override any inline styles that might cause overflow */
          .booking-card .booking-actions-flex[style] {
            width: 100% !important;
            max-width: 100% !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            overflow-x: hidden !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          /* Show buttons but make them full width and properly contained on mobile */
          .booking-card button,
          .booking-card .booking-actions-flex button,
          .booking-card .booking-status-container button,
          .booking-card .btn-pagar {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-top: 4px !important;
            margin-bottom: 0 !important;
            padding: 12px 16px !important;
            font-size: 0.95rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-width: 0 !important;
            flex-shrink: 1 !important;
            flex-grow: 0 !important;
            flex-basis: auto !important;
            position: relative !important;
            display: block !important;
          }
          /* Override inline button styles */
          .booking-card button[style] {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          /* Hide card actions section on mobile - buttons are shown in their original locations */
          .booking-card-actions {
            display: none !important;
          }
          /* Ensure links work independently on mobile */
          .booking-card a {
            pointer-events: auto !important;
            position: relative !important;
            z-index: 10 !important;
            cursor: pointer !important;
          }
          /* Make card clickable on mobile */
          .booking-card {
            cursor: pointer !important;
            pointer-events: auto !important;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1) !important;
            touch-action: manipulation !important;
          }
          .booking-card:hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
            transform: translateY(-2px) !important;
          }
          .booking-card:active {
            transform: translateY(0) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          /* Reduce padding of main content container */
          .main-content-container {
            padding-left: clamp(12px, 2.5vw, 16px) !important;
            padding-right: clamp(12px, 2.5vw, 16px) !important;
          }
          /* Hide buttons inside status containers on mobile horizontal */
          .booking-status-container .booking-actions-flex,
          .booking-status-container button {
            display: none !important;
          }
          /* Hide button in declined container */
          .booking-card > div[style*="backgroundColor: '#fef2f2'"] button {
            display: none !important;
          }
          .booking-status-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 14px) !important;
            box-sizing: border-box !important;
            margin: 0 !important;
          }
          .booking-status-container > div:first-child {
            width: 100% !important;
            max-width: 100% !important;
            flex: none !important;
            box-sizing: border-box !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
          .booking-status-container > div:first-child p {
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
          /* Hide action buttons that are not in the card-actions section */
          .booking-actions-flex:not(.booking-card-actions) {
            display: none !important;
          }
          /* Show card actions section at bottom */
          .booking-card-actions {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-top: 16px !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-bottom: 0 !important;
            padding-top: 16px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-bottom: 0 !important;
            overflow: hidden !important;
            position: relative !important;
          }
          .booking-card-actions button {
            width: 100% !important;
            max-width: 100% !important;
            padding: 12px clamp(8px, 2vw, 12px) !important;
            font-size: 0.95rem !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            position: relative !important;
          }
          .tab-button {
            font-size: 0.85rem !important;
            padding: 8px 14px !important;
          }
          .bookings-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .booking-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: clamp(20px, 4vw, 24px) !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .booking-info-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-status-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .booking-status-container > div:first-child {
            width: 100% !important;
            flex: none !important;
          }
          .booking-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-actions-flex button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .bookings-container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-card {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .booking-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-header-flex {
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-actions-flex button {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }
        
        /* Desktop - 769px and above */
        @media (min-width: 769px) {
          /* Hide card actions section on desktop, show buttons in their original locations */
          .booking-card-actions {
            display: none !important;
          }
          /* Show buttons in status containers on desktop */
          .booking-status-container .booking-actions-flex {
            display: flex !important;
          }
          .booking-status-container button {
            display: inline-block !important;
          }
          /* Show button in declined container on desktop */
          .booking-card > div[style*="backgroundColor: '#fef2f2'"] button {
            display: inline-block !important;
          }
          /* Show action buttons in their original locations */
          .booking-actions-flex:not(.booking-card-actions) {
            display: flex !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .tabs-container {
            padding: 0 12px !important;
          }
          .tab-button {
            padding: 6px 12px !important;
            font-size: 0.8rem !important;
          }
        }
        
        /* Button hover animations - using dark blue palette */
        .btn-ver-detalles {
          position: relative;
          overflow: hidden;
        }
        .btn-ver-detalles::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(3, 37, 103, 0.1), transparent);
          transition: left 0.5s ease;
          z-index: 0;
        }
        .btn-ver-detalles:hover::before {
          left: 100%;
        }
        .btn-ver-detalles:hover {
          background-color: rgba(3, 37, 103, 0.05) !important;
          border-color: #032567 !important;
          color: #032567 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(3, 37, 103, 0.25) !important;
        }
        .btn-ver-detalles:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(3, 37, 103, 0.2) !important;
          background-color: rgba(3, 37, 103, 0.08) !important;
        }
        .btn-ver-detalles > * {
          position: relative;
          z-index: 1;
        }
        
        /* Cancel button hover animations */
        .btn-cancelar {
          position: relative;
          overflow: hidden;
        }
        .btn-cancelar:hover {
          background-color: #fef2f2 !important;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2) !important;
        }
        .btn-cancelar:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.15) !important;
        }
        
        /* Notification alerts positioning */
        .notification-alert {
          position: fixed !important;
          z-index: 9999 !important;
        }
        
        /* Desktop - align with content */
        @media (min-width: 769px) {
          .notification-alert {
            left: 50% !important;
            transform: translateX(-50%) !important;
            max-width: 1280px !important;
            width: calc(100% - 48px) !important;
            padding-left: clamp(16px, 3vw, 24px) !important;
            padding-right: clamp(16px, 3vw, 24px) !important;
          }
        }
        
        /* Mobile - full width with padding */
        @media (max-width: 768px) {
          .notification-alert {
            left: 16px !important;
            right: 16px !important;
            width: calc(100% - 32px) !important;
            max-width: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

