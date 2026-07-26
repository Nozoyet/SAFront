import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({ 
      user: null,
      token: null,
      isAuthenticated: false,
      isImpersonating: false,
      adminBackup: null, // { user, token } del admin original mientras suplanta

      login: async (nombreUsuario, contrasena) => {
        const res = await api.post('/auth/login', { nombreUsuario, contrasena });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isImpersonating: false, adminBackup: null });
        return user;
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) {}
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isImpersonating: false, adminBackup: null });
      },
//Parar impersonar pero mantiene la sesión del admin original 
       impersonate: (targetToken, targetUser) => {
        const { user, token } = get();
        localStorage.setItem('token', targetToken);
        set({
          adminBackup: { user, token },
          user: targetUser,
          token: targetToken,
          isAuthenticated: true,
          isImpersonating: true,
        });
      },
      //Detienen la suplantación y vuelve al admin original
      stopImpersonating: () => {
        const backup = get().adminBackup;
        if (!backup) return;
        localStorage.setItem('token', backup.token);
        set({
          user: backup.user,
          token: backup.token,
          isAuthenticated: true,
          isImpersonating: false,
          adminBackup: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isImpersonating: state.isImpersonating,
        adminBackup: state.adminBackup,
      }),
    }
  )
);

export default useAuthStore;