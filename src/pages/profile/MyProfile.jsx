// Página de mi perfil: gestión de perfil de usuario (edición, cambio de contraseña, cambio de rol)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import { getMyProfile, toggleRole as toggleRoleApi, updateMyProfile } from '../../api/user';
import { getImageUrl } from '../../utils/imageUrl';
import Navbar from '../../components/common/Navbar';
import ChangePassword from './ChangePassword';
import ReviewList from '../../components/reviews/ReviewList';

// Obtener iniciales del nombre completo
function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [navbarImageError, setNavbarImageError] = useState(false);

  const isDriver = user?.role === 'driver';

  // Cargar datos del perfil
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar perfil del usuario
  const loadProfile = async () => {
    try {
      setLoading(true);
      setImageError(false); // Reiniciar error de imagen al cargar nuevo perfil
      const data = await getMyProfile();
      // Agregar timestamp para forzar recarga de imagen
      setProfile({
        ...data,
        _imageCacheKey: Date.now() // Clave de caché única para forzar recarga
      });
    } catch (err) {
      console.error('[MyProfile] Error loading profile:', err);
      setError('Error al cargar el perfil: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de foto de perfil
  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await updateMyProfile({
        profilePhoto: selectedFile,
      });
      
      // Reiniciar error de imagen
      setImageError(false);
      setNavbarImageError(false);
      
      console.log('[MyProfile] Updated profile from server:', updatedProfile);
      console.log('[MyProfile] Profile photo URL:', updatedProfile.profilePhotoUrl);
      
      // Actualizar estado del perfil con nuevo timestamp para forzar recarga de imagen
      // Usar la respuesta del servidor directamente (ya incluye la nueva URL de la imagen)
      const profileWithCacheKey = {
        ...updatedProfile,
        _imageCacheKey: Date.now() // Clave de caché única para forzar recarga
      };
      
      // Actualizar el estado del perfil primero
      setProfile(profileWithCacheKey);
      setUser(profileWithCacheKey);
      
      // Limpiar preview y archivo seleccionado DESPUÉS de actualizar el estado
      // Esto permite que la nueva imagen del servidor se muestre antes de limpiar el preview
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 500);
      
      setSuccess('Foto de perfil actualizada correctamente');
    } catch (err) {
      if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('La imagen es muy grande. El tamaño máximo es 5MB');
      } else {
        setError(err.message || 'Error al actualizar la foto');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Manejar cambio de archivo seleccionado
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDeletePhoto = async () => {
    // TODO: Implement delete photo functionality
    setError('Funcionalidad de eliminar foto en desarrollo');
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      clearUser();
      navigate('/login');
    }
  };

  const handleToggleRole = async () => {
    setRoleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await toggleRoleApi();
      setProfile(updatedProfile);
      setUser(updatedProfile);
      setShowRoleModal(false);
      setSuccess(`Rol cambiado exitosamente a ${updatedProfile.role === 'passenger' ? 'Pasajero' : 'Conductor'}`);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('[MyProfile] Toggle role error:', err);
      setError('Error al cambiar de rol: ' + (err.message || 'Error desconocido'));
      setShowRoleModal(false);
    } finally {
      setRoleLoading(false);
    }
  };


  if (loading && !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
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
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando perfil...</p>
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

  const AlertNotification = ({ type, message, onClose }) => (
    <div className="notification-alert" style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '1280px',
      zIndex: 99999,
      backgroundColor: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'start',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      pointerEvents: 'auto'
    }}>
      {type === 'success' && <span style={{ color: '#16a34a', fontSize: '20px' }}>OK</span>}
      <div style={{ flex: 1 }}>
        <p style={{ 
          color: type === 'error' ? '#991b1b' : '#15803d', 
          fontSize: '14px', 
          margin: 0 
        }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: type === 'error' ? '#991b1b' : '#15803d',
          cursor: 'pointer',
          padding: '0',
          fontSize: '18px',
          lineHeight: '1'
        }}
      >
        X
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar activeLink="profile" />

      {/* Alerts - Rendered via Portal to body */}
      {error && createPortal(
        <AlertNotification type="error" message={error} onClose={() => setError(null)} />,
        document.body
      )}

      {success && createPortal(
        <AlertNotification type="success" message={success} onClose={() => setSuccess(null)} />,
        document.body
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '32px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Tu perfil
        </h1>

        {/* Profile Content */}
        <div style={{
          backgroundColor: 'white',
          padding: 'clamp(20px, 4vw, 40px)'
        }}>
          {/* Profile Photo Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px' }}>
            {/* Photo Square */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '16px',
              backgroundColor: '#032567',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {previewUrl && selectedFile ? (
                // Mostrar preview mientras se está subiendo o si hay archivo seleccionado
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : profile?.profilePhotoUrl && !imageError ? (
                <img 
                  src={`${getImageUrl(profile.profilePhotoUrl)}?t=${profile._imageCacheKey || profile.updatedAt || Date.now()}`}
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  key={`profile-${profile._imageCacheKey || profile.updatedAt || Date.now()}`}
                  onError={(e) => {
                    console.error('[MyProfile] Image load error:', e);
                    console.error('[MyProfile] Image URL:', `${getImageUrl(profile.profilePhotoUrl)}?t=${profile._imageCacheKey || profile.updatedAt || Date.now()}`);
                    // If image fails to load, show initials instead
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log('[MyProfile] Image loaded successfully');
                    // Reset error state on successful load
                    setImageError(false);
                  }}
                />
              ) : (
                <span style={{
                  color: 'white',
                  fontSize: '4rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </span>
              )}
            </div>

            {/* Buttons - Side by side */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* File input label - only for selecting file */}
              <label style={{
                padding: '0.5rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: uploadingPhoto ? '#94a3b8' : '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                if (!uploadingPhoto) e.target.style.backgroundColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                if (!uploadingPhoto) e.target.style.backgroundColor = '#032567';
              }}
              >
                Seleccionar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </label>

              {/* Save button - only shown when file is selected */}
              {selectedFile && (
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: uploadingPhoto ? '#94a3b8' : '#032567',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingPhoto) e.target.style.backgroundColor = '#1A6EFF';
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingPhoto) e.target.style.backgroundColor = '#032567';
                  }}
                >
                  {uploadingPhoto ? 'Subiendo...' : 'Guardar foto'}
                </button>
              )}

              {/* Cancel button - only shown when file is selected but not saved */}
              {selectedFile && !uploadingPhoto && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#57534e',
                    backgroundColor: 'white',
                    border: '2px solid #d9d9d9',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Cancelar
                </button>
              )}

              {/* Delete button - only shown when there's an existing photo and no new file selected */}
              {profile?.profilePhotoUrl && !selectedFile && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploadingPhoto}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#dc2626',
                    backgroundColor: 'white',
                    border: '2px solid #dc2626',
                    borderRadius: '25px',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingPhoto) e.target.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingPhoto) e.target.style.backgroundColor = 'white';
                  }}
                >
                  Eliminar foto de perfil
                </button>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Información personal
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name fields */}
            <div className="form-grid-2cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'clamp(12px, 2vw, 16px)' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={profile?.firstName || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Apellido
                </label>
                <input
                  type="text"
                  value={profile?.lastName || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>
            </div>

            {/* Email and ID */}
            <div className="form-grid-2cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'clamp(12px, 2vw, 16px)' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Correo corporativo
                </label>
                <input
                  type="text"
                  value={profile?.corporateEmail || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  ID Universitario
                </label>
                <input
                  type="text"
                  value={profile?.universityId || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Teléfono
              </label>
              <input
                type="text"
                value={profile?.phone || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed',
                  color: '#57534e'
                }}
              />
            </div>

            {/* Change Password Button */}
            <div style={{ marginTop: '16px' }}>
              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#032567',
                    backgroundColor: 'white',
                    border: '2px solid #032567',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Cambiar contraseña
                </button>
              ) : (
                <div style={{
                  backgroundColor: '#f5f5f4',
                  padding: '24px',
                  borderRadius: '12px',
                  marginTop: '16px'
                }}>
                  <ChangePassword onSuccess={() => {
                    setShowChangePassword(false);
                    setSuccess('Contraseña cambiada exitosamente');
                  }} />
                  <button
                    onClick={() => setShowChangePassword(false)}
                    style={{
                      marginTop: '16px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '1rem',
                      fontWeight: 'normal',
                      color: '#57534e',
                      backgroundColor: 'white',
                      border: '2px solid #d9d9d9',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section (for drivers) */}
          {isDriver && profile?.id && (
            <div style={{
              marginTop: '48px',
              paddingTop: '32px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '24px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Reseñas
              </h2>
              <ReviewList driverId={profile.id} />
            </div>
          )}

          {/* Role Toggle Section */}
          <div style={{
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid #e7e5e4'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Cambiar rol
            </h2>
            
            {profile?.role === 'passenger' ? (
              <button
                onClick={() => navigate('/become-driver')}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Convertirme en conductor
              </button>
            ) : (
              <button
                onClick={() => setShowRoleModal(true)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cambiar a Pasajero
              </button>
            )}
          </div>
        </div>

        {/* Role Toggle Modal */}
        {showRoleModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div className="modal-content-responsive" style={{
              maxWidth: 'clamp(280px, 90vw, 28rem)',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: 'clamp(16px, 4vw, 24px)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                fontWeight: '600',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Cambiar a Pasajero
              </h3>
              <p style={{
                color: '#57534e',
                marginBottom: '24px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem'
              }}>
                ¿Estás seguro de que quieres cambiar tu rol a Pasajero? Podrás volver a ser conductor cuando quieras.
              </p>
              <div className="form-actions-flex" style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowRoleModal(false)}
                  disabled={roleLoading}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#57534e',
                    backgroundColor: 'white',
                    border: '2px solid #d9d9d9',
                    borderRadius: '25px',
                    cursor: roleLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#f5f5f4';
                  }}
                  onMouseLeave={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = 'white';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleRole}
                  disabled={roleLoading}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: roleLoading ? '#94a3b8' : '#032567',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: roleLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#1A6EFF';
                  }}
                  onMouseLeave={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#032567';
                  }}
                >
                  {roleLoading ? 'Cambiando...' : 'Sí, cambiar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .profile-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .form-grid-2cols {
            grid-template-columns: 1fr !important;
          }
          .form-actions-flex {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .form-actions-flex button {
            width: 100% !important;
            padding: 12px 16px !important;
            font-size: 1rem !important;
          }
          .profile-header-flex {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }
          .profile-photo {
            width: 120px !important;
            height: 120px !important;
          }
          .profile-info-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .profile-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .form-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .form-actions-flex button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
          }
          .profile-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        
        /* Desktop - 769px and above */
        @media (min-width: 769px) {
          .mobile-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
        
        /* Global modal responsive styles */
        .modal-content-responsive {
          -webkit-overflow-scrolling: touch;
        }
        
        @media (max-width: 480px) {
          .modal-content-responsive h2,
          .modal-content-responsive h3 {
            font-size: clamp(1rem, 4vw, 1.5rem) !important;
          }
          .modal-content-responsive {
            padding: clamp(12px, 3vw, 16px) !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .profile-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .profile-header-flex {
            gap: 16px !important;
          }
          .profile-photo {
            width: 100px !important;
            height: 100px !important;
          }
        }
        
        /* Notification alerts positioning */
        .notification-alert {
          position: fixed !important;
          z-index: 9999 !important;
        }
        
        /* Desktop - align with content */
        @media (min-width: 769px) {
          .notification-alert {
            left: 50% !important;
            transform: translateX(-50%) !important;
            max-width: 1280px !important;
            width: calc(100% - 48px) !important;
            padding-left: clamp(16px, 3vw, 24px) !important;
            padding-right: clamp(16px, 3vw, 24px) !important;
          }
        }
        
        /* Mobile - full width with padding */
        @media (max-width: 768px) {
          .notification-alert {
            left: 16px !important;
            right: 16px !important;
            width: calc(100% - 32px) !important;
            max-width: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
