// Página de solicitudes de reserva (conductor): lista solicitudes de reserva del conductor (componente legacy/mock)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';

export default function BookingRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('accepted');

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Cargar reservas (implementación mock, en producción llamaría al backend)
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular llamada API para obtener solicitudes de reserva del conductor
      // En implementación real, esto llamaría al backend
      const mockBookings = [
        {
          id: '1',
          tripId: 'trip1',
          passengerId: 'passenger1',
          passengerName: 'Ana García',
          passengerEmail: 'ana@unisabana.edu.co',
          seats: 2,
          note: 'Voy con maleta',
          status: 'accepted',
          isPaid: false,
          createdAt: '2024-01-15T10:00:00Z',
          trip: {
            id: 'trip1',
            origin: { text: 'Campus Norte' },
            destination: { text: 'Campus Sur' },
            departureAt: '2024-01-16T08:00:00Z',
            pricePerSeat: 5000
          }
        },
        {
          id: '2',
          tripId: 'trip2',
          passengerId: 'passenger2',
          passengerName: 'Carlos López',
          passengerEmail: 'carlos@unisabana.edu.co',
          seats: 1,
          note: '',
          status: 'accepted',
          isPaid: true,
          createdAt: '2024-01-15T09:30:00Z',
          trip: {
            id: 'trip2',
            origin: { text: 'Chía Centro' },
            destination: { text: 'Bogotá Centro' },
            departureAt: '2024-01-16T14:00:00Z',
            pricePerSeat: 8000
          }
        }
      ];
      
      setBookings(mockBookings);
    } catch (err) {
      console.error('[BookingRequests] Error loading bookings:', err);
      setError('Error al cargar las reservas: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Navbar */}
      <Navbar />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px)'
      }}>
        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => navigate('/my-trips')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            ← Mis Viajes
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'accepted', label: 'Aceptadas' },
            { value: 'declined', label: 'Rechazadas' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: statusFilter === filter.value ? 'white' : '#374151',
                backgroundColor: statusFilter === filter.value ? '#3b82f6' : 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(24px, 5vw, 48px) clamp(12px, 3vw, 16px)',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No hay reservas</p>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {statusFilter === 'all' 
                ? 'No tienes reservas en este momento'
                : `No hay reservas con estado "${statusFilter}"`
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Booking Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    {booking.passengerId ? (
                      <Link
                        to={`/passengers/${booking.passengerId}`}
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
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
                        {booking.passengerName} →
                      </Link>
                    ) : (
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 4px 0',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {booking.passengerName}
                      </h3>
                    )}
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.passengerEmail}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: booking.status === 'accepted' ? '#dcfce7' : 
                                   booking.status === 'pending' ? '#fef3c7' : '#fecaca',
                    color: booking.status === 'accepted' ? '#166534' :
                          booking.status === 'pending' ? '#92400e' : '#991b1b'
                  }}>
                    {booking.status === 'accepted' ? 'Aceptada' :
                     booking.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                  </div>
                </div>

                {/* Trip Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Viaje
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.trip.origin.text} → {booking.trip.destination.text}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Fecha y Hora
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(booking.trip.departureAt)}
                    </p>
                  </div>
                </div>

                {/* Booking Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Asientos
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.seats}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Precio por asiento
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat)}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Total
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat * booking.seats)}
                    </p>
                  </div>
                </div>

                {/* Note */}
                {booking.note && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Nota del pasajero
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#111827',
                      margin: 0,
                      fontStyle: 'italic',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      "{booking.note}"
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .booking-card {
            padding: 16px !important;
          }
          .booking-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .booking-actions-flex {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .booking-actions-flex button {
            width: 100% !important;
            padding: 10px 16px !important;
            font-size: 0.9rem !important;
          }
          .status-filter-tabs {
            overflow-x: auto !important;
            gap: 8px !important;
          }
          .status-filter-tabs button {
            font-size: 0.8rem !important;
            padding: 8px 12px !important;
            white-space: nowrap !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .booking-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .booking-actions-flex button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .booking-card {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
