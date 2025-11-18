// Página de mis viajes (conductor): lista y gestiona las ofertas de viaje del conductor
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import { getCurrentUser } from '../../api/auth';
import { getMyTripOffers, cancelTripOffer } from '../../api/tripOffer';
import Navbar from '../../components/common/Navbar';

export default function MyTrips() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripToCancel, setTripToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Cargar viajes del conductor con filtros aplicados
  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      // Solo enviar estados válidos del backend a la API
      if (statusFilter !== 'all' && statusFilter !== 'in_progress') {
        filters.status = statusFilter;
      }
      
      const data = await getMyTripOffers(filters);
      setTrips(data.items || []);
    } catch (err) {
      console.error('[MyTrips] Error loading trips:', err);
      setError('Error al cargar los viajes: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelación de viaje
  const handleCancelTrip = async () => {
    if (!tripToCancel) return;

    setCancelLoading(true);
    try {
      await cancelTripOffer(tripToCancel.id);
      setSuccess('Viaje cancelado exitosamente');
      setTripToCancel(null);
      loadTrips();
    } catch (err) {
      setError('Error al cancelar el viaje: ' + (err.message || 'Error desconocido'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[MyTrips] Logout error:', err);
    }
  };

  const getStatusBadge = (status, trip) => {
    // Check if trip is currently in progress
    if (trip && isTripInProgress(trip)) {
      return (
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '500',
          backgroundColor: 'rgba(3, 37, 103, 0.1)',
          color: '#032567',
          fontFamily: 'Inter, sans-serif'
        }}>
          En Progreso
        </span>
      );
    }

    const badges = {
      draft: { bg: '#f5f5f4', color: '#57534e', text: 'Borrador' },
      published: { bg: 'rgba(3, 37, 103, 0.1)', color: '#032567', text: 'Publicado' },
      canceled: { bg: '#f5f5f4', color: '#57534e', text: 'Cancelado' },
      completed: { bg: 'rgba(3, 37, 103, 0.1)', color: '#032567', text: 'Completado' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Check if a trip is currently in progress (within time window)
  const isTripInProgress = (trip) => {
    console.log('Checking if trip is in progress:', {
      tripId: trip.id,
      status: trip.status,
      departureAt: trip.departureAt
    });
    
    if (trip.status !== 'published') {
      console.log('Trip not published, status:', trip.status);
      return false;
    }
    
    const now = new Date();
    const departureTime = new Date(trip.departureAt);
    
    // Trip is in progress if:
    // 1. It's within 30 minutes before departure time (pickup window)
    // 2. It's within 2 hours after departure time (travel window)
    const pickupWindowStart = new Date(departureTime.getTime() - 30 * 60 * 1000); // 30 min before
    const travelWindowEnd = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after
    
    const isInProgress = now >= pickupWindowStart && now <= travelWindowEnd;
    
    console.log('Trip progress check:', {
      now: now.toISOString(),
      departureTime: departureTime.toISOString(),
      pickupWindowStart: pickupWindowStart.toISOString(),
      travelWindowEnd: travelWindowEnd.toISOString(),
      isInProgress
    });
    
    return isInProgress;
  };

  const filteredTrips = statusFilter === 'all' 
    ? trips 
    : statusFilter === 'in_progress'
    ? trips.filter(t => t.status === 'published') // TEMPORARY: Show all published trips for testing
    : trips.filter(t => t.status === statusFilter);

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
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
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
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        {/* Title and CTA */}
        <div className="page-header-flex" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: 'clamp(12px, 2vw, 16px)'
        }}>
          <div>
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
              Gestiona tus ofertas de viaje
            </p>
          </div>

          <button
            onClick={() => navigate('/driver/create-trip')}
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
            Ofrecer nuevo viaje
          </button>
        </div>

        {/* Filter Buttons */}
        <div 
          className="status-filter-tabs"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            borderBottom: '1px solid #e7e5e4',
            paddingBottom: '0',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          {[
            { id: 'all', label: 'Todos' },
            { id: 'published', label: 'Publicados' },
            { id: 'in_progress', label: 'En Progreso' },
            { id: 'completed', label: 'Historial' },
            { id: 'canceled', label: 'Cancelados' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                fontWeight: statusFilter === filter.id ? '500' : 'normal',
                color: statusFilter === filter.id ? '#032567' : '#57534e',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: statusFilter === filter.id ? '2px solid #032567' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== filter.id) e.target.style.color = '#1c1917';
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== filter.id) e.target.style.color = '#57534e';
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
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
              No tienes viajes
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Ofrece tu primer viaje y comienza a compartir trayectos
            </p>
            <button
              onClick={() => navigate('/driver/create-trip')}
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
              Ofrecer viaje
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="trip-card"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e7e5e4',
                  borderRadius: '16px',
                  padding: '28px',
                  transition: 'all 0.2s'
                }}
              >
                <div className="trip-card-content" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Status Badge */}
                    <div style={{ marginBottom: '16px' }}>
                      {getStatusBadge(trip.status, trip)}
                    </div>

                    {/* Route */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        marginBottom: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {trip.origin.text}
                      </div>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {trip.destination.text}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="trip-details-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '20px',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Salida
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {formatDate(trip.departureAt)}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Precio
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {formatPrice(trip.pricePerSeat)}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Asientos
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {trip.totalSeats} disponibles
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Vehículo
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          ID: {trip.vehicleId.slice(-6)}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {trip.notes && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#fafafa',
                        borderRadius: '12px'
                      }}>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#57534e',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          <span style={{ fontWeight: '500' }}>Notas:</span> {trip.notes}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Actions */}
                  <div className="trip-card-actions" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginLeft: '24px'
                  }}>
                    
                    <button
                      className="btn-ver-detalles"
                      onClick={() => navigate(`/driver/trips/${trip.id}`)}
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
                        boxShadow: '0 1px 3px rgba(3, 37, 103, 0.1)',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      Ver detalles
                    </button>
                    {trip.status === 'published' && (
                      <button
                        className="btn-cancelar"
                        onClick={() => setTripToCancel(trip)}
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.95rem',
                          fontWeight: 'normal',
                          color: '#dc2626',
                          backgroundColor: 'white',
                          border: '2px solid #dc2626',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {tripToCancel && (
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
          onClick={() => !cancelLoading && setTripToCancel(null)}
        >
          <div
            className="modal-content-responsive"
            style={{
              maxWidth: 'clamp(280px, 90vw, 500px)',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: 'clamp(16px, 4vw, 32px)',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ¿Cancelar viaje?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6'
            }}>
              ¿Estás seguro de que quieres cancelar el viaje de <strong>{tripToCancel.origin.text}</strong> a <strong>{tripToCancel.destination.text}</strong>? Esta acción no se puede deshacer y notificará a todos los pasajeros que tengan reservas.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setTripToCancel(null)}
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
                onClick={handleCancelTrip}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: cancelLoading ? '#94a3b8' : '#dc2626',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#dc2626';
                }}
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar viaje'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Responsive Styles */}
      <style>{`
        /* Global modal responsive styles */
        .modal-content-responsive {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          /* Trip card layout - stack content vertically */
          .trip-card-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          /* Action buttons container - full width, no left margin */
          .trip-card-actions {
            margin-left: 0 !important;
            margin-right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
          }
          /* Buttons - full width */
          .trip-card-actions button,
          .btn-ver-detalles,
          .btn-cancelar {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
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
        
        @media (max-width: 480px) {
          /* Trip card padding */
          .trip-card {
            padding: clamp(16px, 4vw, 20px) !important;
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          /* Grid details - single column */
          .trip-details-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        
        @media (max-width: 768px) {
          .modal-content-responsive h2,
          .modal-content-responsive h3 {
            font-size: clamp(1rem, 4vw, 1.5rem) !important;
          }
          .modal-content-responsive {
            padding: clamp(12px, 3vw, 16px) !important;
          }
          .trips-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .page-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .status-filter-tabs {
            overflow-x: auto !important;
            gap: 8px !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 transparent !important;
          }
          .status-filter-tabs::-webkit-scrollbar {
            height: 4px !important;
          }
          .status-filter-tabs::-webkit-scrollbar-track {
            background: transparent !important;
          }
          .status-filter-tabs::-webkit-scrollbar-thumb {
            background-color: #cbd5e1 !important;
            border-radius: 2px !important;
          }
          .status-filter-tabs button {
            font-size: clamp(0.8rem, 2.5vw, 0.875rem) !important;
            padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px) !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)) !important;
            gap: 20px !important;
          }
          .page-header-flex {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)) !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
