// Página de perfil de pasajero: página pública para ver el perfil de un pasajero
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getPublicProfile } from '../api/user';
import Navbar from '../components/common/Navbar';
import { getImageUrl } from '../utils/imageUrl';
import Loading from '../components/common/Loading';
import { User } from 'lucide-react';
import { formatPhone } from '../utils/phoneFormatter';

export default function PassengerProfile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [passengerId, setPassengerId] = useState(null);
  const [passengerInfo, setPassengerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[PassengerProfile] Component mounted/updated');
    console.log('[PassengerProfile] params object:', params);
    console.log('[PassengerProfile] window.location.pathname:', window.location.pathname);
    
    // Intentar múltiples formas de obtener passengerId
    let extractedPassengerId = params?.passengerId;
    
    // Si no está en params, intentar extraer de la URL
    if (!extractedPassengerId) {
      const pathMatch = window.location.pathname.match(/\/passengers\/([a-f\d]{24})/i);
      extractedPassengerId = pathMatch ? pathMatch[1] : null;
    }
    
    console.log('[PassengerProfile] extractedPassengerId:', extractedPassengerId);
    
    if (!extractedPassengerId) {
      console.error('[PassengerProfile] passengerId is undefined!');
      setError('ID del pasajero no válido');
      setLoading(false);
      return;
    }
    
    // Almacenar passengerId en estado
    setPassengerId(extractedPassengerId);
    
    // Cargar datos con el passengerId extraído
    loadPassengerData(extractedPassengerId);
  }, [params]);

  // Cargar datos del perfil público del pasajero
  const loadPassengerData = async (idToUse = null) => {
    const finalPassengerId = idToUse || passengerId;
    
    if (!finalPassengerId) {
      console.error('[PassengerProfile] Cannot load passenger data: passengerId is undefined');
      setError('ID del pasajero no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[PassengerProfile] Loading passenger data for passengerId:', finalPassengerId);
      console.log('[PassengerProfile] passengerId type:', typeof finalPassengerId);
      console.log('[PassengerProfile] passengerId length:', finalPassengerId?.length);
      console.log('[PassengerProfile] About to call getPublicProfile with:', finalPassengerId);
      
      const profileData = await getPublicProfile(finalPassengerId);
      console.log('[PassengerProfile] Profile loaded successfully:', profileData);
      setPassengerInfo(profileData);
    } catch (err) {
      console.error('[PassengerProfile] Error loading passenger data:', err);
      console.error('[PassengerProfile] Error details:', {
        status: err.status,
        code: err.code,
        message: err.message
      });
      
      if (err.status === 404) {
        setError('Pasajero no encontrado');
      } else {
        setError(`Error al cargar el perfil del pasajero: ${err.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Navbar />
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#991b1b', fontSize: '16px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
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
            Volver
          </button>
        </div>
      </div>
    );
  }

  const isDriver = user?.role === 'driver';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Navbar activeLink={null} showSearch={!isDriver} />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        <div className="profile-header-flex" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 3vw, 32px)',
          marginBottom: 'clamp(24px, 5vw, 48px)',
          flexWrap: 'wrap'
        }}>
          {/* Profile Photo */}
          <div style={{
            width: 'clamp(80px, 15vw, 120px)',
            height: 'clamp(80px, 15vw, 120px)',
            minWidth: 'clamp(80px, 15vw, 120px)',
            minHeight: 'clamp(80px, 15vw, 120px)',
            borderRadius: '50%',
            backgroundColor: '#032567',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            flexShrink: 0,
            aspectRatio: '1 / 1'
          }}>
            {passengerInfo?.profilePhotoUrl ? (
              <img
                src={getImageUrl(passengerInfo.profilePhotoUrl)}
                alt={`${passengerInfo.firstName} ${passengerInfo.lastName}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  aspectRatio: '1 / 1',
                  display: 'block'
                }}
              />
            ) : (
              <span>{getInitials(passengerInfo?.firstName || 'P', passengerInfo?.lastName || '')}</span>
            )}
          </div>

          {/* Passenger Name and Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 'normal',
              color: '#1c1917',
              margin: '0 0 8px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              {passengerInfo?.firstName}
            </h1>

            {/* Passenger Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              backgroundColor: '#eff6ff',
              color: '#032567',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif'
            }}>
              <User className="w-4 h-4" />
              <span>Pasajero</span>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f4',
          borderRadius: '12px',
          border: '1px solid #e7e5e4'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '500',
            color: '#1c1917',
            margin: '0 0 16px 0',
            fontFamily: 'Inter, sans-serif'
          }}>
            Información
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#57534e',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Correo
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {passengerInfo?.corporateEmail || 'No disponible'}
              </p>
            </div>
            
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#57534e',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                ID Universitario
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {passengerInfo?.universityId || 'No disponible'}
              </p>
            </div>
            
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#57534e',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Teléfono
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {passengerInfo?.phone ? formatPhone(passengerInfo.phone) : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
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
          .profile-header-flex {
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            gap: 24px !important;
          }
          .profile-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
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
      `}</style>
    </div>
  );
}

