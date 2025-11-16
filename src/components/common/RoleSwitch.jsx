import { useState } from 'react';
import { toggleRole } from '../../api/user';
import useAuthStore from '../../store/authStore';
import Toast from './Toast';

/**
 * RoleSwitch Component - Toggle switch for switching between passenger and driver roles
 * Only shows when user has vehicle registered (can switch between roles)
 * 
 * @param {Object} props
 * @param {boolean} props.hasVehicle - Whether user has a vehicle registered
 * @param {string} props.currentRole - Current role ('passenger' | 'driver')
 */
export default function RoleSwitch({ hasVehicle, currentRole }) {
  const { setUser } = useAuthStore();
  const [changing, setChanging] = useState(false);
  const [toast, setToast] = useState(null);
  const [animatingRole, setAnimatingRole] = useState(null); // Track role during animation

  // Only show switch if user has vehicle (can switch between roles)
  if (!hasVehicle) {
    return null;
  }

  const isDriver = currentRole === 'driver';
  // Use animatingRole if animation is in progress, otherwise use actual role
  const displayRole = animatingRole !== null ? animatingRole : isDriver;

  const handleToggle = async () => {
    if (changing) return;

    // Start animation immediately by setting the target role
    const targetRole = !isDriver;
    setAnimatingRole(targetRole);
    setChanging(true);
    setToast(null);

    try {
      const updatedUser = await toggleRole();
      setUser(updatedUser);

      setToast({
        message: `Rol cambiado a ${updatedUser.role === 'driver' ? 'Conductor' : 'Pasajero'}`,
        type: 'success'
      });

      // Reload page after animation completes to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 600); // Wait for animation to complete (400ms + buffer)
    } catch (err) {
      console.error('[RoleSwitch] Toggle role error:', err);
      // Reset animation on error
      setAnimatingRole(null);
      setToast({
        message: err.message || 'Error al cambiar de rol',
        type: 'error'
      });
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f5f5f4',
          borderRadius: '20px',
          padding: '2px',
          border: '2px solid #032567',
          position: 'relative',
          cursor: changing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden'
        }}
        onClick={!changing ? handleToggle : undefined}
        title="Cambiar de rol"
      >
        {changing ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '6px 16px',
            width: '100%',
            color: '#57534e',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #94a3b8',
              borderTop: '2px solid #032567',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></span>
            Cambiando...
          </div>
        ) : (
          <>
            {/* Animated background slider */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                left: displayRole ? '50%' : '2px',
                right: displayRole ? '2px' : '50%',
                backgroundColor: '#032567',
                borderRadius: '18px',
                transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 0,
                boxShadow: '0 2px 4px rgba(3, 37, 103, 0.2)'
              }}
            />
            
            {/* Pasajero option */}
            <div
              style={{
                padding: '6px 16px',
                borderRadius: '18px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: !displayRole ? 'white' : '#57534e',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                position: 'relative',
                zIndex: 1,
                transition: 'color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              Pasajero
            </div>
            
            {/* Conductor option */}
            <div
              style={{
                padding: '6px 16px',
                borderRadius: '18px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: displayRole ? 'white' : '#57534e',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                position: 'relative',
                zIndex: 1,
                transition: 'color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              Conductor
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideLeft {
          from {
            left: 50%;
            right: 2px;
          }
          to {
            left: 2px;
            right: 50%;
          }
        }
        
        @keyframes slideRight {
          from {
            left: 2px;
            right: 50%;
          }
          to {
            left: 50%;
            right: 2px;
          }
        }
      `}</style>
    </>
  );
}

