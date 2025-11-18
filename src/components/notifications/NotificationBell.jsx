// Componente de campana de notificaciones: muestra contador y lista desplegable
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { getNotifications, markNotificationsAsRead } from '../../api/notification';
import { Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]); // Lista de notificaciones
  const [unreadCount, setUnreadCount] = useState(0); // Contador de no leídas
  const [isOpen, setIsOpen] = useState(false); // Estado del dropdown
  const [loading, setLoading] = useState(false); // Cargando notificaciones
  const dropdownRef = useRef(null); // Referencia al dropdown para detectar clics fuera
  const buttonRef = useRef(null); // Referencia al botón para posicionar dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 }); // Posición del dropdown

  // Obtener notificaciones del servidor
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ status: 'all', pageSize: 10 });
      setNotifications(data.items || []);
      setUnreadCount(data.items?.filter(n => !n.isRead).length || 0); // Contar no leídas
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones al montar y cada 30 segundos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Marcar notificaciones como leídas
  const handleMarkAsRead = async (notificationIds) => {
    try {
      await markNotificationsAsRead(notificationIds);
      await fetchNotifications(); // Refrescar lista
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await handleMarkAsRead(unreadIds);
    }
  };

  // Obtener ruta de navegación según el tipo de notificación
  const getNotificationPath = (notification) => {
    const { type, data } = notification;
    const isDriver = user?.role === 'driver';

    switch (type) {
      case 'booking.new':
        // Nueva solicitud de reserva - para conductores
        if (data?.tripId) {
          return `/driver/trips/${data.tripId}`;
        }
        return '/driver/booking-requests';

      case 'booking.accepted':
        // Reserva aceptada - para pasajeros
        return '/my-trips';

      case 'booking.declined':
        // Reserva rechazada - para pasajeros
        return '/my-trips';

      case 'booking.canceled':
        // Reserva cancelada - para pasajeros
        return '/my-trips';

      case 'booking.canceled_by_passenger':
        // Reserva cancelada por pasajero - para conductores
        if (data?.tripId) {
          return `/driver/trips/${data.tripId}`;
        }
        return '/driver/booking-requests';

      case 'trip.canceled':
        // Viaje cancelado - para pasajeros
        return '/my-trips';

      case 'trip.reminder':
        // Recordatorio de viaje - para conductores y pasajeros
        if (isDriver && data?.tripId) {
          return `/driver/trips/${data.tripId}`;
        }
        return '/my-trips';

      default:
        // Default navigation based on role
        return isDriver ? '/driver/trips' : '/my-trips';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead([notification.id]);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate to relevant page
    const path = getNotificationPath(notification);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 8,
              right: window.innerWidth - rect.right
            });
          }
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#032567] text-white text-xs font-normal rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <>
          {/* Overlay for mobile */}
          <div 
            className="notification-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-dropdown" style={{ 
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #e7e5e4',
            maxHeight: '384px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100000
          }}>
          {/* Header */}
          <div className="p-4 border-b border-[#e7e5e4] flex items-center justify-between">
            <h3 className="text-lg font-normal text-neutral-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-[#032567] hover:text-[#1A6EFF] transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-neutral-600">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-neutral-600">No hay notificaciones</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#e7e5e4] hover:bg-[#fafafa] transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-[#fafafa]' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-[#032567] rounded-full mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-normal text-neutral-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </>,
        document.body
      )}

      {/* Responsive Styles */}
      <style>{`
        /* Overlay for mobile */
        .notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.3);
          z-index: 99999;
          display: none;
        }
        
        .notification-dropdown {
          z-index: 100000 !important;
          position: fixed !important;
        }
        
        /* Desktop - ensure dropdown is above all content */
        @media (min-width: 769px) {
          .notification-dropdown {
            position: fixed !important;
            z-index: 100000 !important;
          }
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .notification-overlay {
            display: block !important;
          }
          .notification-dropdown {
            position: fixed !important;
            top: 70px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            max-width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 100px) !important;
            margin-top: 0 !important;
          }
          .notification-dropdown h3 {
            font-size: clamp(0.9rem, 3vw, 1rem) !important;
          }
          .notification-dropdown button {
            font-size: clamp(0.75rem, 2.5vw, 0.8rem) !important;
            padding: clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px) !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .notification-overlay {
            display: block !important;
          }
          .notification-dropdown {
            position: fixed !important;
            top: 70px !important;
            right: 16px !important;
            left: auto !important;
            width: 320px !important;
            max-width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 100px) !important;
            margin-top: 0 !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .notification-dropdown {
            max-height: calc(100vh - 80px) !important;
            top: 60px !important;
          }
        }
      `}</style>
    </div>
  );
}

