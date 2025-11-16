import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getCurrentUser } from '../../api/auth';
import { getImageUrl } from '../../utils/imageUrl';
import NotificationBell from '../notifications/NotificationBell';
import RoleSwitch from './RoleSwitch';
import logo from '../../assets/images/UniSabana Logo.png';

/**
 * Navbar Component - Consistent navigation bar for all authenticated pages
 * @param {Object} props
 * @param {string} props.activeLink - The currently active navigation link ('my-trips', 'reports', 'search', etc.)
 * @param {boolean} props.showSearch - Whether to show the "Buscar viajes" link (default: true for passengers)
 */
export default function Navbar({ activeLink = null, showSearch = null }) {
  const { user, logout, setUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [profile, setProfile] = useState(null);
  
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';

  // Load full profile if user is authenticated but missing profilePhotoUrl or corporateEmail fields
  // This handles cases where user was logged in before we added these fields
  // Also loads profile to check if user has vehicle (for role switch)
  useEffect(() => {
    const loadFullProfile = async () => {
      if (isAuthenticated && user) {
        // Check if user object is missing the new fields (old format)
        const hasProfilePhotoUrl = 'profilePhotoUrl' in user;
        const hasCorporateEmail = 'corporateEmail' in user;
        
        if (!hasProfilePhotoUrl || !hasCorporateEmail || !profile) {
          try {
            const fullProfile = await getCurrentUser();
            setUser(fullProfile);
            setProfile(fullProfile);
          } catch (err) {
            // Silently fail - user can still use the app
          }
        } else if (!profile) {
          setProfile(user);
        }
      }
    };

    loadFullProfile();
  }, [isAuthenticated, user?.id]); // Only run when user ID changes, not on every render
  
  // Auto-detect active link from location if not provided
  const currentActiveLink = activeLink || (() => {
    const path = location.pathname;
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/my-trips')) return 'my-trips';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/search')) return 'search';
    return null;
  })();

  // Determine if search link should be shown
  const shouldShowSearch = showSearch !== null ? showSearch : !isDriver;

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Reset image error when user or profile photo changes
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
      fontWeight: isActive ? '500' : '500',
      color: isActive ? '#032567' : '#1c1917',
      textDecoration: 'none',
      transition: 'color 0.2s',
      fontFamily: 'Inter, sans-serif',
      borderBottom: isActive ? '2px solid #032567' : '2px solid transparent',
      paddingBottom: '2px'
    };
  };

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header style={{
          width: '100%',
          borderBottom: '1px solid #e7e5e4',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Left: Logo + Text */}
          <Link 
            to={isAdmin ? "/admin" : "/dashboard"} 
            className="navbar-logo-link"
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-menu-button"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              zIndex: 15
            }}
            aria-label="Toggle menu"
          >
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1c1917',
              transition: 'all 0.3s'
            }} />
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1c1917',
              transition: 'all 0.3s'
            }} />
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#1c1917',
              transition: 'all 0.3s'
            }} />
          </button>

          {/* Center: Navigation Links */}
          <nav className="navbar-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 32px)'
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

        {/* Right: Notifications + Role Status + Profile */}
        <div className="navbar-right" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          flexShrink: 0
        }}>
          {/* Notifications */}
          {user && (
            <NotificationBell />
          )}
          
          {/* Role Badge - Shows admin badge for admins, role switch for drivers with vehicle, or regular role badge */}
          {isAdmin ? (
            <div className="role-badge" style={{
              padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)',
              backgroundColor: '#dc2626',
              color: 'white',
              border: '2px solid #dc2626',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap'
            }}>
              Admin
            </div>
          ) : profile?.driver?.hasVehicle ? (
            <RoleSwitch 
              hasVehicle={profile.driver.hasVehicle} 
              currentRole={user?.role || 'passenger'} 
            />
          ) : (
            <div className="role-badge" style={{
              padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)',
              backgroundColor: isDriver ? '#032567' : 'white',
              color: isDriver ? 'white' : '#032567',
              border: '2px solid #032567',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap'
            }}>
              {isDriver ? 'Conductor' : 'Pasajero'}
            </div>
          )}

          {/* Profile button with menu */}
          <div className="profile-menu-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                height: 'clamp(2.5rem, 6vw, 3rem)',
                width: 'clamp(2.5rem, 6vw, 3rem)',
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
                flexShrink: 0
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
                    borderRadius: '50%'
                  }}
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <span>{getInitials(user?.firstName, user?.lastName)}</span>
              )}
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <div className="profile-dropdown" style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: 'clamp(200px, 50vw, 220px)',
                maxWidth: '90vw',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e7e5e4',
                padding: '8px 0',
                zIndex: 20
              }}>
                {/* User info */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e7e5e4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Profile photo in menu */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#032567',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {user?.profilePhotoUrl && !imageError ? (
                      <img
                        src={`${getImageUrl(user.profilePhotoUrl)}?t=${user.updatedAt || Date.now()}`}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
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

                {/* Menu items - Only show for non-admin users */}
                {!isAdmin && (
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
                )}

                {/* Logout */}
                <div style={{
                  borderTop: isAdmin ? 'none' : '1px solid #e7e5e4',
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
          zIndex: 12
        }}
      />
    )}

    {/* Mobile Navigation Menu */}
    <nav
      className="mobile-nav"
      style={{
        position: 'fixed',
        top: showMobileMenu ? '0' : '-100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e7e5e4',
        padding: '80px 24px 24px',
        zIndex: 13,
        transition: 'top 0.3s ease',
        boxShadow: showMobileMenu ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        maxHeight: '100vh',
        overflowY: 'auto'
      }}
    >
      {isAdmin ? (
        <Link
          to="/admin"
          onClick={() => setShowMobileMenu(false)}
          style={{
            ...getLinkStyle('admin'),
            display: 'block',
            padding: '16px 0',
            fontSize: '1.1rem'
          }}
        >
          Admin
        </Link>
      ) : (
        <>
          <Link
            to="/my-trips"
            onClick={() => setShowMobileMenu(false)}
            style={{
              ...getLinkStyle('my-trips'),
              display: 'block',
              padding: '16px 0',
              fontSize: '1.1rem'
            }}
          >
            Mis viajes
          </Link>
          <Link
            to="/reports"
            onClick={() => setShowMobileMenu(false)}
            style={{
              ...getLinkStyle('reports'),
              display: 'block',
              padding: '16px 0',
              fontSize: '1.1rem'
            }}
          >
            Reportes
          </Link>
          {shouldShowSearch && (
            <Link
              to="/search"
              onClick={() => setShowMobileMenu(false)}
              style={{
                ...getLinkStyle('search'),
                display: 'block',
                padding: '16px 0',
                fontSize: '1.1rem'
              }}
            >
              Buscar viajes
            </Link>
          )}
        </>
      )}
    </nav>

    {/* Responsive Styles */}
    <style>{`
      @media (max-width: 768px) {
        .mobile-menu-button {
          display: flex !important;
        }
        .navbar-nav {
          display: none !important;
        }
        .navbar-logo-text {
          display: none !important;
        }
        .navbar-right {
          gap: 8px !important;
        }
        .role-badge {
          font-size: 0.75rem !important;
          padding: 4px 10px !important;
        }
      }
      @media (min-width: 769px) {
        .mobile-nav {
          display: none !important;
        }
      }
      @media (max-width: 480px) {
        .navbar-logo-link {
          gap: 6px !important;
        }
        .profile-dropdown {
          right: -10px !important;
        }
      }
    `}</style>
    </>
  );
}

