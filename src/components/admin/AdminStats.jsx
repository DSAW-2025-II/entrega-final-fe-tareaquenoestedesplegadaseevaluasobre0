// Componente de estadísticas de administración: muestra estadísticas generales del panel de admin
import { useState, useEffect } from 'react';
import { listUsers, listTrips, listBookings } from '../../api/admin';

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalBookings: 0,
    activeTrips: 0,
    pendingBookings: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  // Cargar estadísticas generales del sistema
  const loadStats = async () => {
    try {
      const [usersData, tripsData, bookingsData] = await Promise.all([
        listUsers({ page: 1, pageSize: 1 }),
        listTrips({ page: 1, pageSize: 1 }),
        listBookings({ page: 1, pageSize: 1 })
      ]);

      // Obtener conteo de viajes activos
      const activeTripsData = await listTrips({ status: ['published'], page: 1, pageSize: 1 });
      
      // Obtener conteo de reservas pendientes
      const pendingBookingsData = await listBookings({ status: ['pending'], page: 1, pageSize: 1 });

      setStats({
        totalUsers: usersData.total || 0,
        totalTrips: tripsData.total || 0,
        totalBookings: bookingsData.total || 0,
        activeTrips: activeTripsData.total || 0,
        pendingBookings: pendingBookingsData.total || 0,
        loading: false
      });
    } catch (err) {
      console.error('[AdminStats] Error loading stats:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            backgroundColor: '#f5f5f4',
            borderRadius: '12px',
            padding: '24px',
            height: '120px'
          }} />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      color: '#032567',
      icon: null
    },
    {
      title: 'Total Viajes',
      value: stats.totalTrips,
      color: '#047857',
      icon: null
    },
    {
      title: 'Viajes Activos',
      value: stats.activeTrips,
      color: '#1d4ed8',
      icon: null
    },
    {
      title: 'Total Reservas',
      value: stats.totalBookings,
      color: '#7c3aed',
      icon: null
    },
    {
      title: 'Reservas Pendientes',
      value: stats.pendingBookings,
      color: '#dc2626',
      icon: null
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    }}>
      {statCards.map((stat, index) => (
        <div
          key={index}
          style={{
            backgroundColor: 'white',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            padding: '24px',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              color: stat.color,
              fontFamily: 'Inter, sans-serif'
            }}>
              {stat.value.toLocaleString()}
            </span>
          </div>
          <p style={{
            fontSize: '0.9rem',
            color: '#57534e',
            margin: 0,
            fontFamily: 'Inter, sans-serif'
          }}>
            {stat.title}
          </p>
        </div>
      ))}

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .stat-card {
            padding: 16px !important;
          }
          .stat-value {
            font-size: 1.8rem !important;
          }
          .stat-title {
            font-size: 0.85rem !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .stat-card {
            padding: 12px !important;
          }
          .stat-value {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

