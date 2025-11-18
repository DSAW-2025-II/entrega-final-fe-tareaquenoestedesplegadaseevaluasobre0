// Página de mi vehículo: muestra detalles del vehículo del conductor y permite cambiarlo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyVehicle } from '../../api/vehicle';
import { getCurrentUser } from '../../api/auth';
import { getImageUrl } from '../../utils/imageUrl';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';

export default function MyVehicle() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState(null);

  // Cargar perfil para verificar si el usuario tiene vehículo (para cambio de rol)
  useEffect(() => {
    const loadProfile = async () => {
      if (user && !profile) {
        try {
          const fullProfile = await getCurrentUser();
          setProfile(fullProfile);
        } catch (err) {
          // Fallar silenciosamente
        }
      }
    };
    loadProfile();
  }, [user?.id]);

  // Cargar datos del vehículo
  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Cargar vehículo del conductor
  const loadVehicle = async () => {
    try {
      setLoading(true);
      console.log('[MyVehicle] Loading vehicle...');
      const data = await getMyVehicle();
      console.log('[MyVehicle] Vehicle loaded:', data);
      setVehicle(data);
    } catch (err) {
      console.error('[MyVehicle] Error loading vehicle:', err);
      if (err.status === 404) {
        setError('No tienes un vehículo registrado');
      } else {
        setError('Error al cargar el vehículo: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e7e5e4',
            borderTop: '3px solid #032567',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando vehículo...</p>
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

  if (!vehicle && !loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        {/* Navbar */}
        <Navbar />

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e7e5e4',
            padding: 'clamp(24px, 5vw, 48px)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              No tienes un vehículo registrado
            </h2>
            <p style={{
              color: '#57534e',
              marginBottom: '24px',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontFamily: 'Inter, sans-serif'
            }}>
              Registra tu vehículo para poder publicar viajes
            </p>
            <button
              onClick={() => navigate('/driver/register-vehicle')}
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px)',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
            >
              Registrar vehículo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        {/* Page Title */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: 'clamp(24px, 4vw, 32px)',
          fontFamily: 'Inter, sans-serif'
        }}>
          Mi Vehículo
        </h1>

        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: 'clamp(12px, 2vw, 16px)',
            marginBottom: 'clamp(16px, 3vw, 24px)',
            display: 'flex',
            alignItems: 'start',
            gap: 'clamp(8px, 1.5vw, 12px)'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#991b1b', fontSize: 'clamp(0.85rem, 1.5vw, 0.875rem)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                padding: '0',
                fontSize: 'clamp(16px, 2vw, 18px)',
                lineHeight: '1'
              }}
            >
              X
            </button>
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '12px',
            padding: 'clamp(12px, 2vw, 16px)',
            marginBottom: 'clamp(16px, 3vw, 24px)',
            display: 'flex',
            alignItems: 'start',
            gap: 'clamp(8px, 1.5vw, 12px)'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#15803d', fontSize: 'clamp(0.85rem, 1.5vw, 0.875rem)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {success}
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                cursor: 'pointer',
                padding: '0',
                fontSize: 'clamp(16px, 2vw, 18px)',
                lineHeight: '1'
              }}
            >
              X
            </button>
          </div>
        )}

        {/* Vehicle Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e7e5e4',
          padding: 'clamp(16px, 4vw, 32px)'
        }}>
          {/* Vehicle Photos */}
          <div className="vehicle-photo-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(16px, 3vw, 24px)',
            marginBottom: 'clamp(24px, 4vw, 32px)'
          }}>
            {/* Vehicle Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: 'clamp(6px, 1vw, 8px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Foto del vehículo
              </label>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                backgroundColor: '#f5f5f4',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {vehicle?.vehiclePhotoUrl ? (
                    <img 
                      src={getImageUrl(vehicle.vehiclePhotoUrl)} 
                      alt="Vehicle" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <p style={{
                        fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                        color: '#78716c',
                        fontFamily: 'Inter, sans-serif'
                      }}>Sin foto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SOAT Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: 'clamp(6px, 1vw, 8px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Foto del SOAT
              </label>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                backgroundColor: '#f5f5f4',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {vehicle?.soatPhotoUrl ? (
                    <img 
                      src={getImageUrl(vehicle.soatPhotoUrl)} 
                      alt="SOAT" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <p style={{
                        fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                        color: '#78716c',
                        fontFamily: 'Inter, sans-serif'
                      }}>Sin foto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information - Read Only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
            {/* Plate */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: 'clamp(4px, 1vw, 6px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Placa del vehículo
              </label>
              <input
                type="text"
                value={vehicle?.plate || ''}
                disabled
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: '#57534e',
                  backgroundColor: '#f5f5f4',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Brand and Model */}
            <div className="form-grid-2cols" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                  fontWeight: '500',
                  color: '#57534e',
                  marginBottom: 'clamp(4px, 1vw, 6px)',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Marca
                </label>
                <input
                  type="text"
                  value={vehicle?.brand || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    color: '#57534e',
                    backgroundColor: '#f5f5f4',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                  fontWeight: '500',
                  color: '#57534e',
                  marginBottom: 'clamp(4px, 1vw, 6px)',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Modelo
                </label>
                <input
                  type="text"
                  value={vehicle?.model || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    color: '#57534e',
                    backgroundColor: '#f5f5f4',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: 'clamp(4px, 1vw, 6px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Capacidad de pasajeros
              </label>
              <input
                type="text"
                value={`${vehicle?.capacity || 0} pasajero${vehicle?.capacity > 1 ? 's' : ''}`}
                disabled
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: '#57534e',
                  backgroundColor: '#f5f5f4',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Metadata */}
            {vehicle && (
              <div style={{
                borderTop: '1px solid #e7e5e4',
                paddingTop: 'clamp(16px, 2.5vw, 20px)',
                marginTop: 'clamp(16px, 2.5vw, 20px)'
              }}>
                <div className="form-grid-2cols" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: 'clamp(12px, 2vw, 16px)'
                }}>
                  <div>
                    <p style={{
                      fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                      color: '#57534e',
                      margin: '0 0 clamp(4px, 1vw, 4px) 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>Registrado el:</p>
                    <p style={{
                      fontSize: 'clamp(0.9rem, 2vw, 0.95rem)',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {new Date(vehicle.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                      color: '#57534e',
                      margin: '0 0 clamp(4px, 1vw, 4px) 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>Última actualización:</p>
                    <p style={{
                      fontSize: 'clamp(0.9rem, 2vw, 0.95rem)',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {new Date(vehicle.updatedAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action button */}
            <div style={{
              paddingTop: 'clamp(12px, 2vw, 16px)'
            }}>
              <button
                type="button"
                onClick={() => navigate('/driver/change-vehicle')}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px)',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#032567';
                }}
              >
                Cambiar vehículo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Responsive Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .vehicle-photo-grid {
            grid-template-columns: 1fr !important;
            gap: clamp(12px, 2vw, 16px) !important;
            margin-bottom: clamp(20px, 3vw, 24px) !important;
          }
          .form-grid-2cols {
            grid-template-columns: 1fr !important;
            gap: clamp(10px, 2vw, 12px) !important;
          }
          input {
            font-size: clamp(0.875rem, 2vw, 0.9rem) !important;
            padding: clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px) !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(14px, 2vw, 20px) !important;
          }
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(12px, 2vw, 14px) !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Desktop - 1025px and above */
        @media (min-width: 1025px) {
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(12px, 2vw, 16px) !important;
          }
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(10px, 1.5vw, 12px) !important;
          }
        }
      `}</style>
    </div>
  );
}
