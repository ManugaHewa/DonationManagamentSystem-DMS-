import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hydrated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true, // Only set when we have valid user
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false, // Clear when logging out
        }),

      updateToken: (accessToken) => set({ accessToken }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'dms-auth',
      onRehydrateStorage: () => (state) => {
        // After rehydration, validate state consistency
        if (state) {
          // If isAuthenticated but no user, clear everything
          if (state.isAuthenticated && !state.user) {
            state.logout();
          }
          state.setHydrated(true);
        }
      },
    }
  )
);
