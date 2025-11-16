import { useState, useEffect } from 'react';
import { listUsers } from '../../api/admin';
import AdminActions from './AdminActions';

/**
 * User List Component for Admin
 * Displays a searchable, filterable list of users
 */
export default function UserList({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    pageSize: 25
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [filters.page, filters.role, filters.status, filters.search]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        pageSize: filters.pageSize
      };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      
      const data = await listUsers(params);
      setUsers(data.items || []);
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || 25,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    } catch (err) {
      console.error('[UserList] Error loading users:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadUsers();
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

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: '#dc2626', text: 'Admin' },
      driver: { bg: '#032567', text: 'Conductor' },
      passenger: { bg: '#047857', text: 'Pasajero' }
    };
    const badge = badges[role] || badges.passenger;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: 'white',
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
          Usuarios
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
            placeholder="Buscar por nombre o email..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{
              padding: '10px 16px',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#032567'}
            onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
          />
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
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
            <option value="">Todos los roles</option>
            <option value="passenger">Pasajero</option>
            <option value="driver">Conductor</option>
            <option value="admin">Admin</option>
          </select>
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
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
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
          Cargando usuarios...
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
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'clamp(20px, 4vw, 40px)', color: '#57534e' }}>
          No se encontraron usuarios
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
                  }}>Nombre</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Email</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Rol</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Estadísticas</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#57534e',
                    textTransform: 'uppercase'
                  }}>Fecha Registro</th>
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #f5f5f4',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      if (onUserSelect) onUserSelect(user);
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#1c1917' }}>
                      {user.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#57534e' }}>
                      {user.emailMasked}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getRoleBadge(user.role)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e' }}>
                      {user.role === 'driver' && (
                        <span>Viajes: {user.stats?.tripsPublished || 0}</span>
                      )}
                      {user.role === 'passenger' && (
                        <span>Reservas: {user.stats?.bookingsMade || 0}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#57534e' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <AdminActions
                        userId={user.id}
                        driverId={user.role === 'driver' ? user.id : undefined}
                        onDone={() => {
                          setMessage('Acción aplicada correctamente');
                          setTimeout(() => setMessage(null), 3000);
                          loadUsers();
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
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
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
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
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

