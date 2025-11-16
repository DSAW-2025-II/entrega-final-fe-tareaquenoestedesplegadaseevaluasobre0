import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAudit, exportAudit } from '../../api/adminAudit';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import Navbar from '../../components/common/Navbar';

export default function AdminAuditPage() {
  const [filters, setFilters] = useState({ actorId: '', entity: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize
      };
      
      if (filters.actorId && filters.actorId.trim()) {
        params.actorId = filters.actorId.trim();
      }
      
      if (filters.entity && filters.entity.trim()) {
        params.entity = filters.entity.trim();
      }
      
      if (filters.from && filters.from.trim()) {
        try {
          const date = new Date(filters.from);
          if (!isNaN(date.getTime())) {
            params.from = date.toISOString();
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      if (filters.to && filters.to.trim()) {
        try {
          const date = new Date(filters.to);
          if (!isNaN(date.getTime())) {
            params.to = date.toISOString();
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
      const res = await listAudit(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Error al obtener logs');
    } finally {
      setLoading(false);
    }
  }

  function onChangeFilter(e) {
    const { name, value } = e.target;
    setFilters((s) => ({ ...s, [name]: value }));
  }

  async function onApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    await fetchList();
  }

  function onClearFilters() {
    setFilters({ actorId: '', entity: '', from: '', to: '' });
    setPage(1);
    setTimeout(() => fetchList(), 0);
  }

  async function onExport() {
    try {
      const params = {};
      
      if (filters.actorId && filters.actorId.trim()) {
        params.actorId = filters.actorId.trim();
      }
      
      if (filters.entity && filters.entity.trim()) {
        params.entity = filters.entity.trim();
      }
      
      if (filters.from && filters.from.trim()) {
        try {
          const date = new Date(filters.from);
          if (!isNaN(date.getTime())) {
            params.from = date.toISOString();
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      if (filters.to && filters.to.trim()) {
        try {
          const date = new Date(filters.to);
          if (!isNaN(date.getTime())) {
            params.to = date.toISOString();
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
      const res = await exportAudit(params);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/x-ndjson' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${new Date().toISOString()}.ndjson`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Error al exportar');
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <Navbar />
        
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Audit Log
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#57534e',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                Registro de todas las acciones administrativas realizadas en el sistema
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <Link
                to="/admin"
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#032567',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #e7e5e4',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f5f5f4';
                  e.target.style.borderColor = '#032567';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e7e5e4';
                }}
              >
                Volver al panel
              </Link>
              <button
                onClick={onExport}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#032567',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#1A6EFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#032567';
                  }
                }}
              >
                Exportar NDJSON
              </button>
            </div>
          </div>

          {/* Filters Card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <form onSubmit={onApplyFilters}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#57534e',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '500'
                  }}>
                    ID del Administrador
                  </label>
                  <input
                    name="actorId"
                    placeholder="ID del admin"
                    value={filters.actorId}
                    onChange={onChangeFilter}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      color: '#1c1917',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#57534e',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '500'
                  }}>
                    Entidad
                  </label>
                  <input
                    name="entity"
                    placeholder="Ej: User, TripOffer"
                    value={filters.entity}
                    onChange={onChangeFilter}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      color: '#1c1917',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#57534e',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '500'
                  }}>
                    Desde
                  </label>
                  <input
                    name="from"
                    type="datetime-local"
                    value={filters.from}
                    onChange={onChangeFilter}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      color: '#1c1917',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#57534e',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '500'
                  }}>
                    Hasta
                  </label>
                  <input
                    name="to"
                    type="datetime-local"
                    value={filters.to}
                    onChange={onChangeFilter}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      color: '#1c1917',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
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
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1A6EFF';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#032567';
                  }}
                >
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  onClick={onClearFilters}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#57534e',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f4';
                    e.target.style.borderColor = '#d6d3d1';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e7e5e4';
                  }}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#991b1b',
                fontSize: '0.9rem',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {String(error)}
              </p>
            </div>
          )}

          {/* Table Card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f5f5f4',
                    borderBottom: '2px solid #e7e5e4'
                  }}>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Cuándo
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Quién
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Acción
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Entidad
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ID Usuario Afectado
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Razón
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Correlación
                    </th>
                    <th style={{
                      padding: 'clamp(12px, 2vw, 16px)',
                      textAlign: 'left',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{
                        padding: 'clamp(24px, 5vw, 48px)',
                        textAlign: 'center',
                        color: '#57534e',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Cargando...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{
                        padding: 'clamp(24px, 5vw, 48px)',
                        textAlign: 'center',
                        color: '#57534e',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        No hay registros de auditoría
                      </td>
                    </tr>
                  ) : (
                    items.map((it, index) => {
                      // Safely format date
                      let dateStr = '-';
                      try {
                        const dateValue = it.ts || it.when || it.createdAt;
                        if (dateValue) {
                          const date = new Date(dateValue);
                          if (!isNaN(date.getTime())) {
                            dateStr = date.toLocaleString('es-CO', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });
                          }
                        }
                      } catch (e) {
                        // Invalid date
                      }
                      
                      // Format entity display
                      const entityType = (it.entity && it.entity.type) || it.entity || '';
                      const entityId = it.entityId || (it.entity && it.entity.id) || '';
                      const entityDisplay = entityType;
                      
                      // Format actor display
                      const actorId = (it.actor && it.actor.id) || it.who || '';
                      const actorDisplay = actorId ? actorId.substring(0, 8) + '...' : '-';
                      
                      // Format affected user identifier (universityId or corporateEmail)
                      // Priority: userIdentifier from delta > extract from delta > entityId
                      let affectedUserIdentifier = '';
                      if (it.delta && it.delta.userIdentifier) {
                        // Direct userIdentifier in delta (preferred)
                        affectedUserIdentifier = it.delta.userIdentifier;
                      } else if (it.delta && it.delta.after && it.delta.after.userIdentifier) {
                        // userIdentifier in delta.after
                        affectedUserIdentifier = it.delta.after.userIdentifier;
                      } else if (entityType === 'User' || entityType === 'user') {
                        // For User entities, we need to fetch the identifier
                        // For now, show entityId as fallback (will be improved with backend changes)
                        affectedUserIdentifier = entityId;
                      } else if (it.delta && it.delta.after) {
                        // Try to extract from delta for other entities
                        const deltaAfter = it.delta.after;
                        if (deltaAfter.userIdentifier) {
                          affectedUserIdentifier = deltaAfter.userIdentifier;
                        } else if (deltaAfter.reportedUserId) {
                          // Fallback to ID if identifier not available
                          affectedUserIdentifier = deltaAfter.reportedUserId;
                        }
                      }
                      const affectedUserDisplay = affectedUserIdentifier ? affectedUserIdentifier : '-';
                      
                      return (
                        <tr
                          key={it.id || it._id}
                          style={{
                            borderTop: index > 0 ? '1px solid #e7e5e4' : 'none',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fafafa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                            color: '#1c1917',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {dateStr}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            color: '#57534e'
                          }}>
                            {actorDisplay}
                          </td>
                          <td style={{
                            padding: '16px'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              backgroundColor: '#eff6ff',
                              color: '#032567',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {it.action || '-'}
                            </span>
                          </td>
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                            color: '#1c1917',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {entityDisplay || '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '0.9rem',
                            fontFamily: 'Inter, sans-serif',
                            color: '#032567',
                            fontWeight: '500'
                          }}>
                            <span
                              title={affectedUserIdentifier || ''}
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px'
                              }}
                            >
                              {affectedUserDisplay}
                            </span>
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '0.9rem',
                            color: '#1c1917',
                            fontFamily: 'Inter, sans-serif',
                            maxWidth: '300px'
                          }}>
                            <span
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={it.reason || ''}
                            >
                              {it.reason || '-'}
                            </span>
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: '#78716c'
                          }}>
                            {it.correlationId ? it.correlationId.substring(0, 8) + '...' : '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: '#78716c',
                            wordBreak: 'break-word',
                            maxWidth: '200px'
                          }}>
                            <span
                              title={it.hash || ''}
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {it.hash ? it.hash.substring(0, 16) + '...' : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#57534e',
              fontFamily: 'Inter, sans-serif'
            }}>
              Mostrando {items.length} de {total} registros
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === 1 ? '#f5f5f4' : 'white',
                  color: page === 1 ? '#a8a29e' : '#1c1917',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (page !== 1) {
                    e.target.style.backgroundColor = '#f5f5f4';
                    e.target.style.borderColor = '#d6d3d1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== 1) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e7e5e4';
                  }
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
                Página {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={items.length < pageSize}
                style={{
                  padding: '8px 16px',
                  backgroundColor: items.length < pageSize ? '#f5f5f4' : 'white',
                  color: items.length < pageSize ? '#a8a29e' : '#1c1917',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                  cursor: items.length < pageSize ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (items.length >= pageSize) {
                    e.target.style.backgroundColor = '#f5f5f4';
                    e.target.style.borderColor = '#d6d3d1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (items.length >= pageSize) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e7e5e4';
                  }
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
