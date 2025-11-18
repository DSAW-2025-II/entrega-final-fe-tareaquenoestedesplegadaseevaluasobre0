// Dashboard: página principal para usuarios autenticados
// Muestra contenido diferente según el rol (pasajero vs conductor)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getCurrentUser } from '../api/auth';
import { searchTrips } from '../api/trip';
import { getMyTripOffers } from '../api/tripOffer';
import Navbar from '../components/common/Navbar';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ items: [], total: 0 });
  const [profile, setProfile] = useState(null);
  
  // Filtros de búsqueda (para pasajeros)
  const [searchFilters, setSearchFilters] = useState({
    qOrigin: '',
    qDestination: '',
  });

  const isDriver = user?.role === 'driver';

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

  // Cargar datos del dashboard según el rol
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDriver) {
        // Cargar ofertas de viaje del conductor (limitar a 6 más recientes)
        const result = await getMyTripOffers({ page: 1, pageSize: 6 });
        setData(result);
      } else {
        // Cargar viajes disponibles para pasajeros (limitar a 6 más recientes)
        const filters = {
          page: 1,
          pageSize: 6,
        };
        
        // Agregar filtros de búsqueda si se proporcionaron
        if (searchFilters.qOrigin?.trim()) {
          filters.qOrigin = searchFilters.qOrigin.trim();
        }
        if (searchFilters.qDestination?.trim()) {
          filters.qDestination = searchFilters.qDestination.trim();
        }
        
        const result = await searchTrips(filters);
        setData(result);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, searchFilters.qOrigin, searchFilters.qDestination]);


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: '#f5f5f4', color: '#57534e', text: 'Borrador' },
      published: { bg: '#ecfdf5', color: '#047857', text: 'Publicado' },
      canceled: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelado' },
      completed: { bg: '#eff6ff', color: '#1d4ed8', text: 'Completado' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 48px) clamp(12px, 3vw, 24px)',
        boxSizing: 'border-box'
      }}>
        {/* Hero / Welcome Section */}
        <div style={{ marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: '1.2'
          }}>
            ¡Hola de nuevo, {user?.firstName}!
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.8rem)',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif'
          }}>
            {isDriver ? 'Gestiona tus viajes y ofertas' : 'Encuentra el viaje perfecto para ti'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>
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
                fontSize: '18px',
                lineHeight: '1'
              }}
            >
              X
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '3px solid #e7e5e4',
              borderTop: '3px solid #032567',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Driver Content */}
            {isDriver && (
              <>
                {/* CTA Buttons */}
                <div style={{ 
                  marginBottom: '40px',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => navigate('/driver/create-trip')}
                    style={{
                      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1.25rem, 3vw, 2rem)',
                      fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                      fontWeight: 'normal',
                      color: 'white',
                      backgroundColor: '#032567',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1A6EFF';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#032567';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>+</span>
                    Ofrecer nuevo viaje
                  </button>
                </div>

                {/* Section title */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: 'normal',
                    color: '#1c1917',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Tus viajes recientes
                  </h2>
                  {data.items.length > 0 && (
                    <button
                      onClick={() => navigate('/my-trips')}
                      style={{
                        padding: '0.4rem 1rem',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#032567',
                        backgroundColor: 'transparent',
                        border: '2px solid #032567',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Ver todos
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {data.items.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '80px 24px',
                    backgroundColor: '#fafafa',
                    borderRadius: '16px',
                    border: '2px dashed #e7e5e4'
                  }}>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'normal',
                      color: '#1c1917',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      No tienes viajes aún
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      color: '#57534e',
                      marginBottom: '24px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Comienza a ofrecer viajes para conectar con otros estudiantes
                    </p>
                    <button
                      onClick={() => navigate('/driver/create-trip')}
                      style={{
                        padding: '0.5rem 1.5rem',
                        fontSize: '1.1rem',
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
                      Ofrecer mi primer viaje
                    </button>
                  </div>
                ) : (
                  /* Trip Cards Grid */
                  <div className="trips-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
                    gap: 'clamp(16px, 3vw, 24px)'
                  }}>
                    {data.items.map((trip) => (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/driver/trips/${trip.id}`)}
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e7e5e4',
                          borderRadius: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Header: Status + Price */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          {getStatusBadge(trip.status)}
                          <span style={{
                            fontSize: '1.3rem',
                            fontWeight: '600',
                            color: '#032567',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {formatPrice(trip.pricePerSeat)}
                          </span>
                        </div>

                        {/* Route */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            marginBottom: '4px',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ color: '#16a34a' }}>●</span>
                            {trip.origin.text}
                          </div>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ color: '#dc2626' }}>●</span>
                            {trip.destination.text}
                          </div>
                        </div>

                        {/* Date */}
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#57534e',
                          marginBottom: '16px',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {formatDate(trip.departureAt)}
                        </p>

                        {/* Footer: Seats + Notes */}
                        <div style={{
                          paddingTop: '16px',
                          borderTop: '1px solid #e7e5e4',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.9rem',
                          color: '#57534e',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          <span>{trip.totalSeats} asientos</span>
                          {trip.notes && (
                            <span style={{
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {trip.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </>
        )}
      </div>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .dashboard-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .trips-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .section-header-flex {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .dashboard-logo-text {
            display: none !important;
          }
        }
        
        /* Mobile Horizontal (landscape) and Tablet - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .dashboard-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)) !important;
            gap: 20px !important;
          }
        }
        
        /* Tablet Landscape - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)) !important;
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
        
        /* Small Desktop - 1025px to 1280px */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .trips-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
