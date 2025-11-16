import { useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'safety', label: 'Seguridad' },
  { value: 'fraud', label: 'Fraude' },
  { value: 'conduct', label: 'Conducta' },
  { value: 'other', label: 'Otro' }
];

export default function ModerationNoteModal({ 
  userName, 
  reportCategory, 
  reportReason, 
  tripInfo,
  onCancel, 
  onConfirm 
}) {
  const [category, setCategory] = useState('safety');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill reason with report information if available
  const getDefaultReason = () => {
    let defaultReason = `Nota de moderación relacionada con reporte sobre ${userName}.\n\n`;
    
    if (reportCategory) {
      const categoryLabels = {
        abuse: 'Abuso',
        harassment: 'Acoso',
        fraud: 'Fraude',
        no_show: 'No se presentó',
        unsafe_behavior: 'Comportamiento inseguro',
        other: 'Otro'
      };
      defaultReason += `Categoría del reporte: ${categoryLabels[reportCategory] || reportCategory}\n`;
    }
    
    if (tripInfo) {
      defaultReason += `Viaje relacionado: ${tripInfo.origin} → ${tripInfo.destination}\n`;
    }
    
    if (reportReason) {
      defaultReason += `\nMotivo del reporte:\n${reportReason}\n`;
    }
    
    return defaultReason;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!reason || reason.trim().length < 3) {
      setError('Por favor proporciona una razón (mínimo 3 caracteres)');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(category, reason.trim());
    } catch (err) {
      setError(err?.message || 'Error al crear la nota de moderación');
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
              Crear Nota de Moderación
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
            {/* Category */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#1c1917',
                  backgroundColor: 'white',
                  fontFamily: 'Inter, sans-serif',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#032567'}
                onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Razón *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                required
                maxLength={1000}
                rows={8}
                placeholder={getDefaultReason()}
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
                  minHeight: '150px'
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
                  {reason.length}/1000
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
                <strong>Nota:</strong> Esta nota de moderación será asociada al usuario reportado y quedará registrada en el sistema de auditoría.
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
                disabled={submitting || !reason.trim() || reason.trim().length < 3}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: submitting || !reason.trim() || reason.trim().length < 3 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: submitting || !reason.trim() || reason.trim().length < 3 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!submitting && reason.trim() && reason.trim().length >= 3) {
                    e.target.style.backgroundColor = '#1A6EFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && reason.trim() && reason.trim().length >= 3) {
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
                    <span>Creando...</span>
                  </>
                ) : (
                  'Crear Nota'
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
    </div>
  );
}

