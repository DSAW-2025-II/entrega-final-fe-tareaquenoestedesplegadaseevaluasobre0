import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationsAsRead } from '../../api/notification';
import { Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';

/**
 * Notification Bell Component
 * Shows notification count and dropdown list
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ status: 'all', pageSize: 10 });
      setNotifications(data.items || []);
      setUnreadCount(data.items?.filter(n => !n.isRead).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
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

  const handleMarkAsRead = async (notificationIds) => {
    try {
      await markNotificationsAsRead(notificationIds);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await handleMarkAsRead(unreadIds);
    }
  };

  /**
   * Get navigation path based on notification type and data
   */
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
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#e7e5e4] z-50 max-h-96 overflow-hidden flex flex-col">
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
      )}
    </div>
  );
}

