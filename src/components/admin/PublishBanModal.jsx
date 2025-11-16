import { useState } from 'react';

/**
 * Publish Ban Modal
 * Allows admin to set or remove publish ban for drivers
 */
export default function PublishBanModal({ driverId, currentBanUntil, onCancel, onConfirm }) {
  const [banUntil, setBanUntil] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 5) {
      setError('Por favor proporciona una razón (mínimo 5 caracteres)');
      return;
    }

    // If banUntil is provided, validate it's in the future
    if (banUntil) {
      const banDate = new Date(banUntil);
      if (banDate <= new Date()) {
        setError('La fecha de expiración del ban debe ser en el futuro');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Convert to ISO string or null
      const banUntilValue = banUntil ? new Date(banUntil).toISOString() : null;
      await onConfirm(banUntilValue, reason);
    } catch (err) {
      setError(err?.message || 'Error al aplicar el ban');
    } finally {
      setSubmitting(false);
    }
  };

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
        maxWidth: '500px'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '500',
          color: '#1c1917',
          marginBottom: '20px',
          fontFamily: 'Inter, sans-serif'
        }}>
          {currentBanUntil ? 'Modificar Ban de Publicación' : 'Aplicar Ban de Publicación'}
        </h3>

        {currentBanUntil && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#991b1b',
            fontFamily: 'Inter, sans-serif'
          }}>
            <strong>Ban actual:</strong> Hasta {new Date(currentBanUntil).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Ban Until Date */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Fecha de Expiración (Opcional - dejar vacío para remover ban)
            </label>
            <input
              type="datetime-local"
              value={banUntil}
              onChange={(e) => setBanUntil(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                outline: 'none'
              }}
            />
            <p style={{
              fontSize: '0.85rem',
              color: '#57534e',
              marginTop: '4px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Si dejas este campo vacío, se removerá el ban. Si especificas una fecha, el conductor no podrá publicar viajes hasta esa fecha.
            </p>
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
              placeholder="Describe por qué se aplica o remueve este ban..."
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
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: submitting ? '#a8a29e' : '#032567',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Procesando...' : banUntil ? 'Aplicar Ban' : 'Remover Ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

