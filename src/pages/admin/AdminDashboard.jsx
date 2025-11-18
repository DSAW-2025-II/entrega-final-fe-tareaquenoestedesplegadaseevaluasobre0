// Panel de administración: panel principal de administración con estadísticas y listas de gestión
import { useState } from 'react';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { Link } from 'react-router-dom';
import AdminStats from '../../components/admin/AdminStats';
import UserList from '../../components/admin/UserList';
import TripList from '../../components/admin/TripList';
import BookingList from '../../components/admin/BookingList';
import ReportList from '../../components/admin/ReportList';
import Navbar from '../../components/common/Navbar';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Pestañas del panel de administración
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: null },
    { id: 'users', label: 'Usuarios', icon: null },
    { id: 'trips', label: 'Viajes', icon: null },
    { id: 'bookings', label: 'Reservas', icon: null },
    { id: 'reports', label: 'Reportes', icon: null }
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <Navbar />
        
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(20px, 4vw, 32px)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                Panel de Administración
              </h1>
              <p style={{
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                color: '#57534e',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                Gestiona usuarios, viajes y reservas del sistema
              </p>
            </div>
            <Link
              to="/admin/audit"
              className="audit-link-button"
              style={{
                padding: 'clamp(8px, 1.5vw, 10px) clamp(16px, 2.5vw, 20px)',
                backgroundColor: '#032567',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#032567';
              }}
              >
                Ver Audit Log
              </Link>
          </div>

          {/* Tabs */}
          <div className="admin-tabs" style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '2px solid #e7e5e4',
            paddingBottom: '0',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="admin-tab-button"
                style={{
                  padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                  backgroundColor: activeTab === tab.id ? '#032567' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#57534e',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #032567' : '2px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                  fontWeight: activeTab === tab.id ? '500' : 'normal',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#f5f5f4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {activeTab === 'overview' && (
              <div>
                <AdminStats />
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    marginBottom: '16px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Accesos Rápidos
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <button
                      onClick={() => setActiveTab('users')}
                      style={{
                        padding: '20px',
                        backgroundColor: '#f5f5f4',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#032567';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4';
                        e.currentTarget.style.borderColor = '#e7e5e4';
                      }}
                    >
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Gestionar Usuarios
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('trips')}
                      style={{
                        padding: '20px',
                        backgroundColor: '#f5f5f4',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#032567';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4';
                        e.currentTarget.style.borderColor = '#e7e5e4';
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}></div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Gestionar Viajes
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      style={{
                        padding: '20px',
                        backgroundColor: '#f5f5f4',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#032567';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f4';
                        e.currentTarget.style.borderColor = '#e7e5e4';
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}></div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Gestionar Reservas
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && <UserList />}
            {activeTab === 'trips' && <TripList />}
            {activeTab === 'bookings' && <BookingList />}
            {activeTab === 'reports' && <ReportList />}
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        /* Hide scrollbar but keep functionality */
        .admin-tabs::-webkit-scrollbar {
          display: none;
        }
        .admin-tabs {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .audit-link-button {
            width: 100% !important;
            justify-content: center !important;
            padding: 10px 16px !important;
            font-size: 0.85rem !important;
          }
          .admin-tab-button {
            font-size: 0.8rem !important;
            padding: 8px 12px !important;
            white-space: nowrap !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .audit-link-button {
            width: auto !important;
            min-width: 140px !important;
          }
          .admin-tab-button {
            font-size: 0.85rem !important;
            padding: 10px 16px !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .admin-tab-button {
            padding: 10px 20px !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .admin-tab-button {
            padding: 8px 16px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
