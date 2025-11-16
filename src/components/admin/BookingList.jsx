import { useState, useEffect } from 'react';
import { listBookings } from '../../api/admin';
import AdminActions from './AdminActions';

/**
 * Booking List Component for Admin
 * Displays a searchable, filterable list of bookings
 */
export default function BookingList({ onBookingSelect }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    tripId: '',
    passengerId: '',
    status: '',
    paid: '',
    page: 1,
    pageSize: 25
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [filters.page, filters.status]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        pageSize: filters.pageSize
      };
      if (filters.tripId) params.tripId = filters.tripId;
      if (filters.passengerId) params.passengerId = filters.passengerId;
      if (filters.status) params.status = filters.status;
      if (filters.paid !== '') params.paid = filters.paid === 'true';
      
      const data = await listBookings(params);
      setBookings(data.items || []);
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || 25,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    } catch (err) {
      console.error('[BookingList] Error loading bookings:', err);
      setError(err.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadBookings();
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fffbeb', color: '#92400e', text: 'Pendiente' },
      accepted: { bg: '#ecfdf5', color: '#047857', text: 'Aceptada' },
      declined: { bg: '#fef2f2', color: '#dc2626', text: 'Rechazada' },
      declined_auto: { bg: '#f5f5f4', color: '#57534e', text: 'Rechazada Auto' },
      canceled: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelada' },
      canceled_by_passenger: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelada por Pasajero' },
      canceled_by_platform: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelada por Plataforma' },
      declined_by_admin: { bg: '#fef2f2', color: '#dc2626', text: 'Rechazada por Admin' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e7e5e4',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '500',
          color: '#1c1917',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          Reservas
        </h2>
        <span style={{
          fontSize: '0.9rem',
          color: '#57534e',
          fontFamily: 'Inter, sans-serif'
        }}>
          Total: {pagination.total}
        </span>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 'clamp(8px, 1.5vw, 12px)',
          marginBottom: '12px'
        }}>
          <input
            type="text"
            placeholder="Trip ID..."
            value={filters.tripId}
            onChange={(e) => setFilters(prev => ({ ...prev, tripId: e.target.value }))}
            style={{
              padding: '10px 16px',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Passenger ID..."
            value={filters.passengerId}
            onChange={(e) => setFilters(prev => ({ ...prev, passengerId: e.target.value }))}
            style={{
              padding: '10px 16px',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              backgroundColor: 'white',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="accepted">Aceptada</option>
            <option value="declined">Rechazada</option>
            <option value="canceled">Cancelada</option>
          </select>
          <select
            value={filters.paid}
            onChange={(e) => handleFilterChange('paid', e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              backgroundColor: 'white',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos</option>
            <option value="true">Pagado</option>
            <option value="false">No Pagado</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: '#032567',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
          >
            Buscar
          </button>
        </div>
      </form>

      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #86efac',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#047857',
          fontSize: '0.9rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          {message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'clamp(20px, 4vw, 40px)', color: '#57534e' }}>
          Cargando reservas...
        </div>
      ) : error ? (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.9rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'clamp(20px, 4vw, 40px)', color: '#57534e' }}>
          No se encontraron reservas
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e7e5e4' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Pasajero</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Trip ID</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Estado</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Asientos</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Transacción</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    style={{
                      borderBottom: '1px solid #f5f5f4',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => {
                      if (onBookingSelect) onBookingSelect(booking);
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#1c1917' }}>
                      {booking.passenger?.name || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e', fontFamily: 'monospace' }}>
                      {booking.tripId ? booking.tripId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(booking.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#1c1917' }}>
                      {booking.seats || 0}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e' }}>
                      {booking.transaction ? (
                        <div>
                          <div>Estado: {booking.transaction.status}</div>
                          {booking.transaction.amount && (
                            <div>Monto: ${booking.transaction.amount.toLocaleString()}</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <AdminActions
                        bookingId={booking.id}
                        booking={booking}
                        onDone={() => {
                          setMessage('Acción aplicada correctamente');
                          setTimeout(() => setMessage(null), 3000);
                          loadBookings();
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <span style={{
                fontSize: '0.9rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif'
              }}>
                Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page === 1 ? '#f5f5f4' : 'white',
                    color: pagination.page === 1 ? '#a8a29e' : '#1c1917',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Anterior
                </button>
                <span style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  color: '#1c1917',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page >= pagination.totalPages ? '#f5f5f4' : 'white',
                    color: pagination.page >= pagination.totalPages ? '#a8a29e' : '#1c1917',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

