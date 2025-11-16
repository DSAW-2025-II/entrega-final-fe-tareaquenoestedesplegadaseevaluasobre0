import { useState, useEffect } from 'react';
import { listTrips } from '../../api/admin';
import AdminActions from './AdminActions';

/**
 * Trip List Component for Admin
 * Displays a searchable, filterable list of trips
 */
export default function TripList({ onTripSelect }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    driverId: '',
    from: '',
    to: '',
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
    loadTrips();
  }, [filters.page, filters.status]);

  const loadTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        pageSize: filters.pageSize
      };
      if (filters.status) params.status = filters.status;
      if (filters.driverId) params.driverId = filters.driverId;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      
      const data = await listTrips(params);
      setTrips(data.items || []);
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || 25,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    } catch (err) {
      console.error('[TripList] Error loading trips:', err);
      setError(err.message || 'Error al cargar viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadTrips();
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: '#f5f5f4', color: '#57534e', text: 'Borrador' },
      published: { bg: '#ecfdf5', color: '#047857', text: 'Publicado' },
      in_progress: { bg: '#eff6ff', color: '#1d4ed8', text: 'En Progreso' },
      canceled: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelado' },
      completed: { bg: '#f0f9ff', color: '#0369a1', text: 'Completado' }
    };
    const badge = badges[status] || badges.draft;
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
          Viajes
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
            placeholder="Origen..."
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
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
            placeholder="Destino..."
            value={filters.to}
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
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
            placeholder="Driver ID..."
            value={filters.driverId}
            onChange={(e) => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
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
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="in_progress">En Progreso</option>
            <option value="canceled">Cancelado</option>
            <option value="completed">Completado</option>
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
          Cargando viajes...
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
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'clamp(20px, 4vw, 40px)', color: '#57534e' }}>
          No se encontraron viajes
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
                  }}>Ruta</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Salida</th>
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
                  }}>Capacidad</th>
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
                {trips.map((trip) => (
                  <tr
                    key={trip.id}
                    style={{
                      borderBottom: '1px solid #f5f5f4',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => {
                      if (onTripSelect) onTripSelect(trip);
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#1c1917' }}>
                      <div>
                        <div style={{ color: '#047857', marginBottom: '4px' }}>
                          {trip.route?.from || '-'}
                        </div>
                        <div style={{ color: '#dc2626' }}>
                          {trip.route?.to || '-'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e' }}>
                      {formatDate(trip.departureAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(trip.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e' }}>
                      {trip.capacity ? (
                        <div>
                          <div>Total: {trip.capacity.totalSeats}</div>
                          <div>Ocupados: {trip.capacity.allocatedSeats}</div>
                          <div>Disponibles: {trip.capacity.remainingSeats}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <AdminActions
                        tripId={trip.id}
                        driverId={trip.driverId}
                        onDone={() => {
                          setMessage('Acción aplicada correctamente');
                          setTimeout(() => setMessage(null), 3000);
                          loadTrips();
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

