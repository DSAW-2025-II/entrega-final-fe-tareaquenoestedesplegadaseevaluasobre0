import { useState } from 'react';
import AdminActionModal from './AdminActionModal';
import BookingCorrectionModal from './BookingCorrectionModal';
import PublishBanModal from './PublishBanModal';
import { suspendUser, forceCancelTrip, setDriverPublishBan, correctBookingState, createModerationNote } from '../../api/admin';
import useAuthStore from '../../store/authStore';

export default function AdminActions({ userId, tripId, bookingId, driverId, booking, driverBanUntil, onDone }) {
  const user = useAuthStore((s) => s.user);
  const [modalConfig, setModalConfig] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPublishBanModal, setShowPublishBanModal] = useState(false);

  if (!user || user.role !== 'admin') return null;

  // Prevent admin from suspending/reactivating themselves
  const isSelfAction = userId && user.id === userId;

  const openModal = (title, actionLabel, handler) => setModalConfig({ title, actionLabel, handler });

  const handleSuspend = () => openModal('Suspender usuario', 'Suspender', async (reason) => {
    await suspendUser(userId, true, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleUnsuspend = () => openModal('Reactivar usuario', 'Reactivar', async (reason) => {
    await suspendUser(userId, false, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleForceCancel = () => openModal('Force-cancelar viaje', 'Cancelar viaje', async (reason) => {
    await forceCancelTrip(tripId, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleBookingCorrection = async (targetState, reason, refund) => {
    await correctBookingState(bookingId, targetState, reason, refund);
    setShowBookingModal(false);
    onDone && onDone();
  };

  const handlePublishBan = async (banUntil, reason) => {
    await setDriverPublishBan(driverId, banUntil, reason);
    setShowPublishBanModal(false);
    onDone && onDone();
  };

  const handleCreateModerationNote = () => {
    openModal('Agregar nota de moderación', 'Crear nota', async (reason) => {
      await createModerationNote('User', userId, 'general', reason, []);
      setModalConfig(null);
      onDone && onDone();
    });
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {userId && (
          <>
            {!isSelfAction && (
              <>
                <button
                  onClick={handleSuspend}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  Suspender
                </button>
                <button
                  onClick={handleUnsuspend}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: '#047857',
                    border: '1px solid #047857',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ecfdf5';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  Reactivar
                </button>
              </>
            )}
            {isSelfAction && (
              <span style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif',
                fontStyle: 'italic'
              }}>
                No puedes suspender/reactivar tu propia cuenta
              </span>
            )}
            <button
              onClick={handleCreateModerationNote}
              style={{
                padding: '6px 12px',
                backgroundColor: 'white',
                color: '#032567',
                border: '1px solid #032567',
                borderRadius: '6px',
                fontSize: '0.85rem',
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
              Agregar nota
            </button>
          </>
        )}
        {tripId && (
          <button
            onClick={handleForceCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Force-cancelar
          </button>
        )}
        {driverId && (
          <button
            onClick={() => setShowPublishBanModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            {driverBanUntil ? 'Modificar ban' : 'Ban publicar'}
          </button>
        )}
        {bookingId && (
          <button
            onClick={() => setShowBookingModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#032567',
              border: '1px solid #032567',
              borderRadius: '6px',
              fontSize: '0.85rem',
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
            Corregir reserva
          </button>
        )}
      </div>

      {modalConfig && (
        <AdminActionModal
          title={modalConfig.title}
          actionLabel={modalConfig.actionLabel}
          onCancel={() => setModalConfig(null)}
          onConfirm={modalConfig.handler}
        />
      )}

      {showBookingModal && booking && (
        <BookingCorrectionModal
          booking={booking}
          onCancel={() => setShowBookingModal(false)}
          onConfirm={handleBookingCorrection}
        />
      )}

      {showPublishBanModal && (
        <PublishBanModal
          driverId={driverId}
          currentBanUntil={driverBanUntil}
          onCancel={() => setShowPublishBanModal(false)}
          onConfirm={handlePublishBan}
        />
      )}
    </>
  );
}
