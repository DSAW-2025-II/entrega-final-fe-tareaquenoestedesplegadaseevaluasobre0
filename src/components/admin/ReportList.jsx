// Componente de lista de reportes: muestra reportes de usuarios y reseñas para moderación por administradores
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listReports, listReviewReports, updateReportStatus, createModerationNote, sendMessageToReportedUser } from '../../api/admin';
import { adminSetVisibility } from '../../api/review';
import ModerationNoteModal from './ModerationNoteModal';
import SendMessageModal from './SendMessageModal';

// Etiquetas de categorías de reporte
const CATEGORY_LABELS = {
  abuse: 'Abuso',
  harassment: 'Acoso',
  fraud: 'Fraude',
  no_show: 'No se presentó',
  unsafe_behavior: 'Comportamiento inseguro',
  spam: 'Spam',
  other: 'Otro'
};

// Etiquetas de estados de reporte
const STATUS_LABELS = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto'
};

// Colores de estados de reporte
const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  reviewed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  resolved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
};

export default function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [hidingReview, setHidingReview] = useState(null); // reviewId siendo ocultada
  const [showModerationModal, setShowModerationModal] = useState(null); // { report }
  const [showMessageModal, setShowMessageModal] = useState(null); // { report }
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [page, filters]);

  // Obtener reportes de usuarios y reseñas combinados
  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch both user reports and review reports
      const [userReportsData, reviewReportsData] = await Promise.all([
        listReports({
          page,
          pageSize: 25,
          status: filters.status || undefined,
          category: filters.category || undefined,
          sort: '-createdAt'
        }),
        listReviewReports({
          page,
          pageSize: 25,
          category: filters.category || undefined,
          sort: '-createdAt'
        })
      ]);
      
      // Combine both types of reports and sort by createdAt
      const allReports = [
        ...(userReportsData.items || []).map(r => ({ ...r, type: 'user' })),
        ...(reviewReportsData.items || [])
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setReports(allReports);
      // Use the maximum totalPages from both sources
      setTotalPages(Math.max(userReportsData.totalPages || 1, reviewReportsData.totalPages || 1));
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingStatus(reportId);
      await updateReportStatus(reportId, newStatus);
      await fetchReports();
    } catch (err) {
      console.error('Error updating report status:', err);
      alert('Error al actualizar el estado del reporte');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewUser = (userId, role) => {
    if (role === 'driver') {
      navigate(`/drivers/${userId}`);
    } else {
      navigate(`/passengers/${userId}`);
    }
  };

  const handleCreateModerationNote = async (category, reason) => {
    const report = showModerationModal;
    try {
      const userId = report.type === 'review' ? report.reviewAuthor.id : report.reportedUser.id;
      await createModerationNote(
        'user',
        userId,
        category,
        reason,
        [] // evidence array (empty for now)
      );
      setShowModerationModal(null);
      setSuccessMessage('Nota de moderación creada exitosamente');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error creating moderation note:', err);
      throw err; // Let the modal handle the error
    }
  };

  const handleSendMessage = async (title, message) => {
    const report = showMessageModal;
    try {
      await sendMessageToReportedUser(report.id, title, message);
      setShowMessageModal(null);
      setSuccessMessage('Mensaje enviado exitosamente');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err; // Let the modal handle the error
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      setHidingReview(reviewId);
      await adminSetVisibility(reviewId, 'hide', 'Reseña eliminada por moderador debido a reporte');
      setSuccessMessage('Reseña ocultada exitosamente');
      setTimeout(() => setSuccessMessage(null), 5000);
      // Refresh reports to update the review status
      await fetchReports();
    } catch (err) {
      console.error('Error hiding review:', err);
      alert('Error al ocultar la reseña: ' + (err.message || 'Error desconocido'));
    } finally {
      setHidingReview(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        padding: 'clamp(20px, 4vw, 40px)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '400px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>OK</span>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: '#065f46',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500'
          }}>
            {successMessage}
          </p>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065f46',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
              marginLeft: 'auto'
            }}
          >
            X
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: '500',
            color: '#57534e',
            marginBottom: '6px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e7e5e4',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="reviewed">Revisado</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: '500',
            color: '#57534e',
            marginBottom: '6px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value });
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e7e5e4',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <option value="">Todas</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {reports.length === 0 ? (
          <div style={{
            padding: 'clamp(20px, 4vw, 40px)',
            textAlign: 'center',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif'
          }}>
            No hay reportes que mostrar
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gap: '0',
              borderBottom: '1px solid #e7e5e4'
            }}>
              {reports.map((report) => {
                const statusColor = report.status ? (STATUS_COLORS[report.status] || STATUS_COLORS.pending) : null;
                const reportDate = new Date(report.createdAt);
                const formattedDate = reportDate.toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={report.id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #e7e5e4',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 'clamp(12px, 2vw, 20px)',
                      alignItems: 'start'
                    }}>
                      {/* Main Content */}
                      <div>
                        {/* Header */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px',
                          flexWrap: 'wrap'
                        }}>
                          {report.type === 'review' && (
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              fontFamily: 'Inter, sans-serif',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a'
                            }}>
                              Reporte de Reseña
                            </span>
                          )}
                          {report.status && statusColor && (
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              fontFamily: 'Inter, sans-serif',
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`
                            }}>
                              {STATUS_LABELS[report.status] || report.status}
                            </span>
                          )}
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'normal',
                            fontFamily: 'Inter, sans-serif',
                            backgroundColor: '#e0f2fe',
                            color: '#032567'
                          }}>
                            {CATEGORY_LABELS[report.category] || report.category}
                          </span>
                          <span style={{
                            fontSize: '0.85rem',
                            color: '#78716c',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {formattedDate}
                          </span>
                        </div>

                        {/* Users Info */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                          gap: '16px',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {report.type === 'review' ? 'Autor de la Reseña' : 'Usuario Reportado'}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <button
                                onClick={() => {
                                  const user = report.type === 'review' ? report.reviewAuthor : report.reportedUser;
                                  handleViewUser(user.id, user.role);
                                }}
                                style={{
                                  padding: 0,
                                  background: 'none',
                                  border: 'none',
                                  color: '#032567',
                                  fontSize: '0.95rem',
                                  fontWeight: '500',
                                  fontFamily: 'Inter, sans-serif',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '2px'
                                }}
                              >
                                {report.type === 'review' 
                                  ? `${report.reviewAuthor.firstName} ${report.reviewAuthor.lastName}`
                                  : `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
                                }
                              </button>
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#78716c',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                ({report.type === 'review' 
                                  ? (report.reviewAuthor.role === 'driver' ? 'Conductor' : 'Pasajero')
                                  : (report.reportedUser.role === 'driver' ? 'Conductor' : 'Pasajero')
                                })
                              </span>
                            </div>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#57534e',
                              margin: '4px 0 0 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {report.type === 'review' 
                                ? report.reviewAuthor.corporateEmail
                                : report.reportedUser.corporateEmail
                              }
                            </p>
                          </div>
                          {report.type === 'review' && report.reviewTarget && (
                            <div>
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#78716c',
                                margin: '0 0 4px 0',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                Conductor de la Reseña
                              </p>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <button
                                  onClick={() => handleViewUser(report.reviewTarget.id, report.reviewTarget.role)}
                                  style={{
                                    padding: 0,
                                    background: 'none',
                                    border: 'none',
                                    color: '#032567',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    fontFamily: 'Inter, sans-serif',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px'
                                  }}
                                >
                                  {report.reviewTarget.firstName} {report.reviewTarget.lastName}
                                </button>
                              </div>
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#57534e',
                                margin: '4px 0 0 0',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                {report.reviewTarget.corporateEmail}
                              </p>
                            </div>
                          )}
                          <div>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              Reportado por
                            </p>
                            <p style={{
                              fontSize: '0.95rem',
                              fontWeight: '500',
                              color: '#1c1917',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {report.reporter.firstName} {report.reporter.lastName}
                            </p>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#57534e',
                              margin: 0,
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {report.reporter.corporateEmail}
                            </p>
                          </div>
                        </div>

                        {/* Review Info (for review reports) */}
                        {report.type === 'review' && report.review && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              Reseña Reportada
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px'
                            }}>
                              <span style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#032567',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                {'★'.repeat(report.review.rating)}{'☆'.repeat(5 - report.review.rating)}
                              </span>
                              <span style={{
                                fontSize: '0.85rem',
                                color: '#57534e',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                ({report.review.rating}/5)
                              </span>
                            </div>
                            {report.review.text && (
                              <p style={{
                                fontSize: '0.9rem',
                                color: '#1c1917',
                                margin: '8px 0 0 0',
                                fontFamily: 'Inter, sans-serif',
                                lineHeight: '1.5',
                                fontStyle: 'italic'
                              }}>
                                "{report.review.text}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Trip Info */}
                        {report.trip && report.trip.origin && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f5f5f4',
                            borderRadius: '8px',
                            marginBottom: '12px'
                          }}>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              Viaje relacionado
                            </p>
                            <p style={{
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              color: '#1c1917',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {report.trip.origin} → {report.trip.destination}
                            </p>
                            {report.trip.departureAt && (
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#57534e',
                                margin: 0,
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                {new Date(report.trip.departureAt).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Reason */}
                        {report.reason && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#fffbeb',
                            borderRadius: '8px',
                            border: '1px solid #fde68a'
                          }}>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '0 0 4px 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              Motivo adicional
                            </p>
                            <p style={{
                              fontSize: '0.9rem',
                              color: '#92400e',
                              margin: 0,
                              fontFamily: 'Inter, sans-serif',
                              lineHeight: '1.5'
                            }}>
                              {report.reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        minWidth: '150px'
                      }}>
                        {report.type === 'user' && report.status !== undefined && (
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.id, e.target.value)}
                            disabled={updatingStatus === report.id}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e7e5e4',
                              fontSize: '0.85rem',
                              fontFamily: 'Inter, sans-serif',
                              cursor: updatingStatus === report.id ? 'not-allowed' : 'pointer',
                              opacity: updatingStatus === report.id ? 0.6 : 1
                            }}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="reviewed">Revisado</option>
                            <option value="resolved">Resuelto</option>
                          </select>
                        )}
                        <button
                          onClick={() => {
                            const user = report.type === 'review' ? report.reviewAuthor : report.reportedUser;
                            handleViewUser(user.id, user.role);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#032567',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                        >
                          {report.type === 'review' ? 'Ver Autor de Reseña' : 'Ver Usuario'}
                        </button>
                        <button
                          onClick={() => setShowModerationModal(report)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#032567',
                            border: '1px solid #032567',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                          }}
                        >
                          Agregar Nota
                        </button>
                        {report.type === 'user' && (
                          <button
                            onClick={() => setShowMessageModal(report)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#032567',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              fontFamily: 'Inter, sans-serif',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                          >
                            Enviar Mensaje
                          </button>
                        )}
                        {report.type === 'review' && report.review && (
                          <button
                            onClick={() => handleHideReview(report.review.id)}
                            disabled={hidingReview === report.review.id || report.review.status === 'hidden'}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: hidingReview === report.review.id || report.review.status === 'hidden' ? '#78716c' : '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              fontFamily: 'Inter, sans-serif',
                              cursor: hidingReview === report.review.id || report.review.status === 'hidden' ? 'not-allowed' : 'pointer',
                              transition: 'background-color 0.2s',
                              opacity: hidingReview === report.review.id || report.review.status === 'hidden' ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (hidingReview !== report.review.id && report.review.status !== 'hidden') {
                                e.target.style.backgroundColor = '#b91c1c';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (hidingReview !== report.review.id && report.review.status !== 'hidden') {
                                e.target.style.backgroundColor = '#dc2626';
                              }
                            }}
                          >
                            {hidingReview === report.review.id 
                              ? 'Ocultando...' 
                              : report.review.status === 'hidden' 
                                ? 'Reseña Ocultada' 
                                : 'Ocultar Reseña'
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                borderTop: '1px solid #e7e5e4'
              }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: page === 1 ? '#f5f5f4' : 'white',
                    color: page === 1 ? '#78716c' : '#032567',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  Anterior
                </button>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#57534e',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: page === totalPages ? '#f5f5f4' : 'white',
                    color: page === totalPages ? '#78716c' : '#032567',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Moderation Note Modal */}
      {showModerationModal && (
        <ModerationNoteModal
          userName={showModerationModal.type === 'review' 
            ? `${showModerationModal.reviewAuthor.firstName} ${showModerationModal.reviewAuthor.lastName}`
            : `${showModerationModal.reportedUser.firstName} ${showModerationModal.reportedUser.lastName}`
          }
          reportCategory={showModerationModal.category}
          reportReason={showModerationModal.reason}
          tripInfo={showModerationModal.trip && showModerationModal.trip.origin ? {
            origin: showModerationModal.trip.origin,
            destination: showModerationModal.trip.destination
          } : null}
          onCancel={() => setShowModerationModal(null)}
          onConfirm={handleCreateModerationNote}
        />
      )}

      {/* Send Message Modal */}
      {showMessageModal && showMessageModal.type === 'user' && (
        <SendMessageModal
          userName={`${showMessageModal.reportedUser.firstName} ${showMessageModal.reportedUser.lastName}`}
          reportCategory={showMessageModal.category}
          reportReason={showMessageModal.reason}
          tripInfo={showMessageModal.trip && showMessageModal.trip.origin ? {
            origin: showMessageModal.trip.origin,
            destination: showMessageModal.trip.destination
          } : null}
          onCancel={() => setShowMessageModal(null)}
          onConfirm={handleSendMessage}
        />
      )}

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .report-card {
            padding: 16px !important;
          }
          .report-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .report-info-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .filters-form {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .filters-form input,
          .filters-form select {
            width: 100% !important;
          }
          .pagination-controls {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .pagination-controls button {
            width: 100% !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .report-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .filters-form {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .filters-form input,
          .filters-form select {
            flex: 1 1 auto !important;
            min-width: 120px !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .report-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .report-card {
            padding: 12px !important;
          }
          .report-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

