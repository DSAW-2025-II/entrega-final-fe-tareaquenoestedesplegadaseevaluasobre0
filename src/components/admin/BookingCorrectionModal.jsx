// Modal de corrección de reserva: permite a admin seleccionar estado objetivo y proporcionar razón para corrección de reserva
import { useState } from 'react';

export default function BookingCorrectionModal({ booking, onCancel, onConfirm }) {
  // Estado para estado objetivo, razón, monto y razón de reembolso, envío y errores
  const [targetState, setTargetState] = useState('');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Manejar envío: valida estado objetivo, razón y reembolso si se cancela
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!targetState) {
      setError('Por favor selecciona un estado objetivo');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setError('Por favor proporciona una razón (mínimo 5 caracteres)');
      return;
    }

    // Validar reembolso si se cancela
    if (targetState === 'canceled_by_platform') {
      if (refundAmount && (!refundReason || refundReason.trim().length < 5)) {
        setError('Si especificas un monto de reembolso, debes proporcionar una razón');
        return;
      }
    }

    setSubmitting(true);
    try {
      const refund = refundAmount ? {
        amount: parseFloat(refundAmount),
        currency: 'COP',
        reason: refundReason
      } : undefined;

      await onConfirm(targetState, reason, refund);
    } catch (err) {
      setError(err?.message || 'Error al corregir la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const canDecline = booking?.status === 'pending';
  const canCancel = booking?.status === 'accepted';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '500',
          color: '#1c1917',
          marginBottom: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Corregir Estado de Reserva
        </h3>

        {booking && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f4',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif'
          }}>
            <div><strong>Estado actual:</strong> {booking.status}</div>
            <div><strong>Pasajero:</strong> {booking.passenger?.name || '-'}</div>
            <div><strong>Asientos:</strong> {booking.seats || 0}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Target State Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Estado Objetivo *
            </label>
            <select
              value={targetState}
              onChange={(e) => setTargetState(e.target.value)}
              required
              style={{
                width: '100%',
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
              <option value="">Selecciona un estado...</option>
              {canDecline && (
                <option value="declined_by_admin">Rechazar (declined_by_admin)</option>
              )}
              {canCancel && (
                <option value="canceled_by_platform">Cancelar (canceled_by_platform)</option>
              )}
            </select>
            {!canDecline && !canCancel && (
              <p style={{
                fontSize: '0.85rem',
                color: '#dc2626',
                marginTop: '4px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Esta reserva no puede ser corregida desde su estado actual
              </p>
            )}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Razón *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="Describe por qué se realiza esta corrección..."
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Refund Section (only for canceled_by_platform) */}
          {targetState === 'canceled_by_platform' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#92400e',
                marginBottom: '12px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Reembolso (Opcional)
              </h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  color: '#92400e',
                  marginBottom: '4px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Monto (COP)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none'
                  }}
                />
              </div>
              {refundAmount && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#92400e',
                    marginBottom: '4px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Razón del reembolso
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={2}
                    placeholder="Razón del reembolso..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#1c1917',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.target.style.backgroundColor = '#f5f5f4';
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.target.style.backgroundColor = 'white';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || (!canDecline && !canCancel)}
              style={{
                padding: '10px 20px',
                backgroundColor: submitting || (!canDecline && !canCancel) ? '#a8a29e' : '#032567',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                cursor: submitting || (!canDecline && !canCancel) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!submitting && canDecline || canCancel) {
                  e.target.style.backgroundColor = '#1A6EFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && canDecline || canCancel) {
                  e.target.style.backgroundColor = '#032567';
                }
              }}
            >
              {submitting ? 'Procesando...' : 'Corregir'}
            </button>
          </div>
        </form>
      </div>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .modal-content {
            padding: 20px 16px !important;
            max-width: 95vw !important;
            margin: 16px !important;
          }
          .modal-form {
            gap: 16px !important;
          }
          select, input, textarea {
            font-size: 14px !important;
            padding: 10px 14px !important;
          }
          .modal-actions-flex {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .modal-actions-flex button {
            width: 100% !important;
            padding: 12px 16px !important;
            font-size: 1rem !important;
          }
          .refund-section {
            padding: 12px !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .modal-content {
            padding: 24px 20px !important;
            max-width: 90vw !important;
          }
          .modal-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .modal-actions-flex button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .modal-content {
            padding: 16px 20px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

