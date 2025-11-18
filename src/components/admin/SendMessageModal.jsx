// Modal de envío de mensaje: permite a los administradores enviar mensajes a usuarios reportados
import { useState } from 'react';

export default function SendMessageModal({ 
  userName, 
  reportCategory, 
  reportReason, 
  tripInfo,
  onCancel, 
  onConfirm 
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-llenar mensaje con información del reporte si está disponible
  const getDefaultMessage = () => {
    let defaultMessage = `Hola ${userName},\n\n`;
    
    defaultMessage += 'Hemos recibido un reporte relacionado con tu cuenta. ';
    
    if (reportCategory) {
      const categoryLabels = {
        abuse: 'Abuso',
        harassment: 'Acoso',
        fraud: 'Fraude',
        no_show: 'No se presentó',
        unsafe_behavior: 'Comportamiento inseguro',
        other: 'Otro'
      };
      defaultMessage += `El reporte está categorizado como: ${categoryLabels[reportCategory] || reportCategory}.\n\n`;
    }
    
    if (tripInfo) {
      defaultMessage += `Viaje relacionado: ${tripInfo.origin} → ${tripInfo.destination}\n\n`;
    }
    
    if (reportReason) {
      defaultMessage += `Motivo del reporte:\n${reportReason}\n\n`;
    }
    
    defaultMessage += 'Por favor, revisa esta situación y contáctanos si tienes alguna pregunta.\n\n';
    defaultMessage += 'Saludos,\nEquipo de Moderación';
    
    return defaultMessage;
  };

  // Manejar envío del formulario de mensaje
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!title || title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres');
      return;
    }

    if (!message || message.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(title.trim(), message.trim());
    } catch (err) {
      setError(err?.message || 'Error al enviar el mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onCancel();
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '600px',
        width: '100%',
        padding: '24px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1c1917',
              margin: '0 0 4px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Enviar Mensaje al Usuario
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: '#57534e',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              Para: {userName}
            </p>
          </div>
          {!submitting && (
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: '#57534e',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                fontSize: '20px',
                lineHeight: '1'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              X
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#991b1b', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                required
                maxLength={200}
                placeholder="Ej: Notificación sobre reporte recibido"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#1c1917',
                  backgroundColor: 'white',
                  fontFamily: 'Inter, sans-serif',
                  cursor: submitting ? 'not-allowed' : 'text',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#032567'}
                onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#78716c',
                margin: '4px 0 0 0',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'right'
              }}>
                {title.length}/200
              </p>
            </div>

            {/* Message */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Mensaje *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                required
                maxLength={2000}
                rows={10}
                placeholder={getDefaultMessage()}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#1c1917',
                  backgroundColor: 'white',
                  fontFamily: 'Inter, sans-serif',
                  cursor: submitting ? 'not-allowed' : 'text',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical',
                  minHeight: '200px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#032567'}
                onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#78716c',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Puedes usar la información del reporte como referencia
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#78716c',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'right'
                }}>
                  {message.length}/2000
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{
                fontSize: '0.85rem',
                color: '#1e40af',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.5'
              }}>
                <strong>Nota:</strong> Este mensaje se enviará como una notificación in-app al usuario reportado y quedará registrado en el sistema de auditoría.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  opacity: submitting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.target.style.backgroundColor = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || title.trim().length < 3 || !message.trim() || message.trim().length < 10}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: submitting || !title.trim() || title.trim().length < 3 || !message.trim() || message.trim().length < 10 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: submitting || !title.trim() || title.trim().length < 3 || !message.trim() || message.trim().length < 10 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!submitting && title.trim() && title.trim().length >= 3 && message.trim() && message.trim().length >= 10) {
                    e.target.style.backgroundColor = '#1A6EFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && title.trim() && title.trim().length >= 3 && message.trim() && message.trim().length >= 10) {
                    e.target.style.backgroundColor = '#032567';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  'Enviar Mensaje'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

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
          input, textarea {
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

