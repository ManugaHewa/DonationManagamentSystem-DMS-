import { useAuthStore } from '../../../stores/auth.stores';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { useNavigate } from 'react-router-dom';

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return async () => {
    try {
      // Call backend logout to invalidate refresh token
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local state
      logout();
      navigate('/login', { replace: true });
    }
  };
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Login response:', data); // Debug log
      
      // Extract user, accessToken, refreshToken from nested data object
      const { user, accessToken, refreshToken } = data.data;
      
      // Set auth state
      setAuth(user, accessToken, refreshToken);
      
      // Navigate based on role
      if (user.role === 'DONOR') {
        navigate('/donor/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
    },
  });
}
