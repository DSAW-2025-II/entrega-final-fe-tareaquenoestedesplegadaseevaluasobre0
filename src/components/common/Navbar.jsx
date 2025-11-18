// Barra de navegación principal: logo, menú, notificaciones, perfil
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getCurrentUser } from '../../api/auth';
import { getImageUrl } from '../../utils/imageUrl';
import NotificationBell from '../notifications/NotificationBell';
import RoleSwitch from './RoleSwitch';
import logo from '../../assets/images/UniSabana Logo.png';

export default function Navbar({ activeLink = null, showSearch = null }) {
  const { user, logout, setUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Menú desplegable del perfil
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Menú hamburguesa móvil
  const [imageError, setImageError] = useState(false); // Error al cargar foto de perfil
  const [profile, setProfile] = useState(null); // Perfil completo del usuario
  const profileButtonRef = useRef(null); // Referencia al botón de perfil para posicionar menú
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 }); // Posición del menú desplegable
  
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';

  // Cargar perfil completo al autenticarse
  useEffect(() => {
    const loadFullProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const fullProfile = await getCurrentUser();
          setUser(fullProfile);
          setProfile(fullProfile);
        } catch (err) {
          // Fallar silenciosamente
        }
      }
    };
    loadFullProfile();
  }, [isAuthenticated, user?.id]);

  // Detectar link activo automáticamente desde la URL
  const currentActiveLink = activeLink || (() => {
    const path = location.pathname;
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/my-trips')) return 'my-trips';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/search')) return 'search';
    if (path.includes('/profile')) return 'profile';
    return null;
  })();

  // Determinar si mostrar el link de búsqueda (solo para pasajeros por defecto)
  const shouldShowSearch = showSearch !== null ? showSearch : !isDriver;

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

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Reiniciar error de imagen cuando cambia el usuario
  useEffect(() => {
    setImageError(false);
  }, [user?.profilePhotoUrl, user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[Navbar] Logout error:', err);
      navigate('/login');
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getLinkStyle = (linkName) => {
    const isActive = currentActiveLink === linkName;
    return {
      fontSize: '1rem',
      fontWeight: isActive ? '600' : '400',
      color: isActive ? '#032567' : '#1c1917',
      textDecoration: 'none',
      transition: 'color 0.2s',
      fontFamily: 'Inter, sans-serif',
      display: 'block',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: isActive ? '#f0f9ff' : 'transparent'
    };
  };

  return (
    <>
      <header style={{
        width: '100%',
        maxWidth: '100vw',
        borderBottom: '1px solid #e7e5e4',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1001,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(12px, 2vw, 16px) clamp(12px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Left: Logo */}
          <Link 
            to={isAdmin ? "/admin" : "/dashboard"} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 12px)',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              flex: '0 1 auto',
              minWidth: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src={logo} 
              alt="Wheels UniSabana Logo" 
              style={{ 
                height: 'clamp(2.5rem, 8vw, 4rem)', 
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span className="navbar-logo-text" style={{
              fontSize: 'clamp(14px, 3.5vw, 20px)',
              fontWeight: 'normal',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Wheels UniSabana
            </span>
          </Link>

          {/* Center: Navigation Links (Desktop only) */}
          <nav className="navbar-nav-desktop" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 32px)',
            flex: 1,
            justifyContent: 'center',
            margin: '0 clamp(16px, 3vw, 32px)'
          }}>
            {isAdmin ? (
              <Link
                to="/admin"
                style={getLinkStyle('admin')}
                onMouseEnter={(e) => {
                  if (currentActiveLink !== 'admin') e.target.style.color = '#032567';
                }}
                onMouseLeave={(e) => {
                  if (currentActiveLink !== 'admin') e.target.style.color = '#1c1917';
                }}
              >
                Admin
              </Link>
            ) : (
              <>
                <Link
                  to="/my-trips"
                  style={getLinkStyle('my-trips')}
                  onMouseEnter={(e) => {
                    if (currentActiveLink !== 'my-trips') e.target.style.color = '#032567';
                  }}
                  onMouseLeave={(e) => {
                    if (currentActiveLink !== 'my-trips') e.target.style.color = '#1c1917';
                  }}
                >
                  Mis viajes
                </Link>
                
                <Link
                  to="/reports"
                  style={getLinkStyle('reports')}
                  onMouseEnter={(e) => {
                    if (currentActiveLink !== 'reports') e.target.style.color = '#032567';
                  }}
                  onMouseLeave={(e) => {
                    if (currentActiveLink !== 'reports') e.target.style.color = '#1c1917';
                  }}
                >
                  Reportes
                </Link>
                
                {/* Only show "Buscar viajes" for passengers */}
                {shouldShowSearch && (
                  <Link
                    to="/search"
                    style={getLinkStyle('search')}
                    onMouseEnter={(e) => {
                      if (currentActiveLink !== 'search') e.target.style.color = '#032567';
                    }}
                    onMouseLeave={(e) => {
                      if (currentActiveLink !== 'search') e.target.style.color = '#1c1917';
                    }}
                  >
                    Buscar viajes
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right: Hamburger Menu + Notifications + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 16px)',
            flexShrink: 0
          }}>
            {/* Hamburger Menu Button (Mobile only) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="hamburger-menu-button"
              style={{
                display: 'none', // Hidden by default, shown via media query
                flexDirection: 'column',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                zIndex: 15,
                justifyContent: 'center',
                alignItems: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              aria-label="Toggle menu"
            >
              <span style={{
                width: '24px',
                height: '2px',
                backgroundColor: '#1c1917',
                transition: 'all 0.3s',
                transform: showMobileMenu ? 'rotate(45deg) translateY(8px)' : 'none'
              }} />
              <span style={{
                width: '24px',
                height: '2px',
                backgroundColor: '#1c1917',
                transition: 'all 0.3s',
                opacity: showMobileMenu ? 0 : 1
              }} />
              <span style={{
                width: '24px',
                height: '2px',
                backgroundColor: '#1c1917',
                transition: 'all 0.3s',
                transform: showMobileMenu ? 'rotate(-45deg) translateY(-8px)' : 'none'
              }} />
            </button>

            {/* Notifications */}
            {user && (
              <NotificationBell />
            )}

            {/* Role Switch or Badge - Shows toggle if user has vehicle, otherwise static badge */}
            {user && !isAdmin && (
              <div className="role-badge-navbar" style={{
                display: 'none' // Hidden on mobile, shown via media query
              }}>
                {profile?.driver?.hasVehicle ? (
                  <RoleSwitch 
                    hasVehicle={profile.driver.hasVehicle} 
                    currentRole={user?.role || 'passenger'} 
                  />
                ) : (
                  <div style={{
                    padding: 'clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)',
                    backgroundColor: isDriver ? '#032567' : 'white',
                    color: isDriver ? 'white' : '#032567',
                    border: '2px solid #032567',
                    borderRadius: '20px',
                    fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
                    fontWeight: '500',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap'
                  }}
                  title={isDriver ? 'Conductor' : 'Pasajero'}
                  >
                    {isDriver ? 'Conductor' : 'Pasajero'}
                  </div>
                )}
              </div>
            )}

            {/* Profile Button */}
            <div className="profile-menu-container" style={{ position: 'relative' }}>
              <button
                ref={profileButtonRef}
                onClick={() => {
                  if (profileButtonRef.current) {
                    const rect = profileButtonRef.current.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right
                    });
                  }
                  setShowProfileMenu(!showProfileMenu);
                }}
                style={{
                  height: 'clamp(2.5rem, 6vw, 3rem)',
                  width: 'clamp(2.5rem, 6vw, 3rem)',
                  minWidth: 'clamp(2.5rem, 6vw, 3rem)',
                  minHeight: 'clamp(2.5rem, 6vw, 3rem)',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  overflow: 'hidden',
                  padding: 0,
                  flexShrink: 0,
                  aspectRatio: '1 / 1'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.profilePhotoUrl && !imageError ? (
                  <img
                    src={`${getImageUrl(user.profilePhotoUrl)}?t=${user.updatedAt || Date.now()}`}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      aspectRatio: '1 / 1',
                      display: 'block'
                    }}
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <span>{getInitials(user?.firstName, user?.lastName)}</span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 999
                    }}
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div style={{
                    position: 'fixed',
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                    width: 'clamp(200px, 50vw, 220px)',
                    maxWidth: '90vw',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #e7e5e4',
                    padding: '8px 0',
                    zIndex: 1000
                  }}>
                    {/* User info */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e7e5e4',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        minHeight: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#032567',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        flexShrink: 0,
                        overflow: 'hidden',
                        aspectRatio: '1 / 1'
                      }}>
                        {user?.profilePhotoUrl && !imageError ? (
                          <img
                            src={`${getImageUrl(user.profilePhotoUrl)}?t=${user.updatedAt || Date.now()}`}
                            alt={`${user?.firstName} ${user?.lastName}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '50%',
                              aspectRatio: '1 / 1'
                            }}
                            onError={() => setImageError(true)}
                            onLoad={() => setImageError(false)}
                          />
                        ) : (
                          <span>{getInitials(user?.firstName, user?.lastName)}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#57534e',
                          margin: '4px 0 0 0',
                          fontFamily: 'Inter, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user?.corporateEmail}
                        </p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '4px 0' }}>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          color: '#1c1917',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Mi perfil
                      </button>

                      {isDriver && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/driver/my-vehicle');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            color: '#1c1917',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          Mi vehículo
                        </button>
                      )}
                    </div>

                    {/* Logout */}
                    <div style={{
                      borderTop: '1px solid #e7e5e4',
                      paddingTop: '4px'
                    }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 12,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <nav
        className="mobile-nav-drawer"
        style={{
          position: 'fixed',
          top: 0,
          left: showMobileMenu ? '0' : '-100%',
          width: 'clamp(280px, 80vw, 320px)',
          maxWidth: 'min(85vw, 320px)',
          height: '100vh',
          maxHeight: '100dvh', // Dynamic viewport height for mobile browsers
          backgroundColor: 'white',
          zIndex: 13,
          transition: 'left 0.3s ease',
          boxShadow: showMobileMenu ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Prevent outer scrolling, let inner sections handle it
          boxSizing: 'border-box'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: 'clamp(16px, 4vw, 24px)',
          borderBottom: '1px solid #e7e5e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0 // Prevent header from shrinking
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 2vw, 12px)',
            flex: 1,
            minWidth: 0
          }}>
            <img 
              src={logo} 
              alt="Wheels UniSabana Logo" 
              style={{ 
                height: 'clamp(2rem, 6vw, 3rem)', 
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 'normal',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Wheels UniSabana
            </span>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#57534e',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        {/* Navigation Links */}
        <div style={{
          padding: 'clamp(12px, 3vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          minHeight: 0, // Allow flex item to shrink below content size
          overflowY: 'auto' // Make this section scrollable if content overflows
        }}>
          {isAdmin ? (
            <Link
              to="/admin"
              onClick={() => setShowMobileMenu(false)}
              style={getLinkStyle('admin')}
            >
              Admin
            </Link>
          ) : (
            <>
              {/* Navigation links based on role */}
              <Link
                to="/my-trips"
                onClick={() => setShowMobileMenu(false)}
                style={getLinkStyle('my-trips')}
              >
                Mis viajes
              </Link>
              <Link
                to="/reports"
                onClick={() => setShowMobileMenu(false)}
                style={getLinkStyle('reports')}
              >
                Reportes
              </Link>
              {/* Only show "Buscar viajes" for passengers */}
              {shouldShowSearch && (
                <Link
                  to="/search"
                  onClick={() => setShowMobileMenu(false)}
                  style={getLinkStyle('search')}
                >
                  Buscar viajes
                </Link>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer - Role Switch only */}
        {!isAdmin && profile?.driver?.hasVehicle && (
          <div style={{
            padding: 'clamp(12px, 3vw, 16px)',
            borderTop: '1px solid #e7e5e4',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 'clamp(16px, 4vw, 24px)',
            paddingBottom: 'clamp(16px, 4vw, 24px)',
            flexShrink: 0, // Prevent footer from shrinking
            backgroundColor: 'white' // Ensure footer has background
          }}>
            <RoleSwitch
              hasVehicle={profile.driver.hasVehicle}
              currentRole={user?.role || 'passenger'}
            />
          </div>
        )}
      </nav>

      {/* Responsive Styles */}
      <style>{`
        /* Hide logo text on very small screens */
        @media (max-width: 360px) {
          .navbar-logo-text {
            display: none !important;
          }
        }
        
        /* Desktop navigation links */
        @media (min-width: 769px) {
          .navbar-nav-desktop {
            display: flex !important;
          }
          .role-badge-navbar {
            display: flex !important;
            align-items: center !important;
          }
          .hamburger-menu-button {
            display: none !important;
          }
          .mobile-nav-drawer {
            display: none !important;
          }
        }
        
        /* Mobile - hide desktop nav, show hamburger */
        @media (max-width: 768px) {
          .navbar-nav-desktop {
            display: none !important;
          }
          .role-badge-navbar {
            display: none !important;
          }
          .hamburger-menu-button {
            display: flex !important;
          }
          .mobile-nav-drawer {
            height: 100vh !important;
            height: 100dvh !important; /* Dynamic viewport height for mobile browsers */
            max-height: 100vh !important;
            max-height: 100dvh !important;
          }
        }
        
        /* Adjust drawer for landscape mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .mobile-nav-drawer {
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100vh !important;
            max-height: 100dvh !important;
          }
        }
      `}</style>
    </>
  );
}
