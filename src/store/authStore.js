// Store de autenticación: gestiona el estado del usuario (persistido en localStorage)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // Estado
      user: null,              // Información del usuario autenticado
      isAuthenticated: false,  // Bandera de autenticación

      // Acciones
      
      // Establecer usuario autenticado
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: true 
        }),

      // Limpiar usuario (cuando expira la sesión)
      clearUser: () => {
        // Limpiar token CSRF del sessionStorage cuando se limpia la sesión
        sessionStorage.removeItem('csrf_token');
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },

      // Cerrar sesión: limpia estado y localStorage
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        });
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('token');
        // Limpiar token CSRF del sessionStorage
        sessionStorage.removeItem('csrf_token');
        return Promise.resolve();
      },

      // Actualizar parcialmente el usuario (ej: cambiar nombre)
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage', // Clave en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

