import { create } from 'zustand';
import { authService } from '../services/api';

/**
 * Auth store WITHOUT persist middleware.
 * State lives only in memory (session).
 * When browser is refreshed or closed → user must log in again.
 */
const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    set({ accessToken: token });
    // Keep token in sessionStorage only (cleared when tab/browser closes)
    if (token) sessionStorage.setItem('accessToken', token);
    else sessionStorage.removeItem('accessToken');
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(credentials);
      set({ isLoading: false });

      // Admin logs in directly — no OTP
      if (!data.data.requiresOTP) {
        const { accessToken, user } = data.data;
        set({ user, accessToken, isAuthenticated: true });
        sessionStorage.setItem('accessToken', accessToken);
        return { success: true, user };
      }

      // Member / Trainer — OTP required
      return {
        success: true,
        requiresOTP: true,
        userId: data.data.userId,
        email: data.data.email,
        emailSent: data.data.emailSent,
        devOTP: data.data.devOTP || null,
      };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  },

  verifyLoginOTP: async ({ userId, otp }) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.verifyLoginOTP({ userId, otp });
      const { accessToken, user } = data.data;
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
      sessionStorage.setItem('accessToken', accessToken);
      return { success: true, user };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message || 'OTP verification failed' };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.register(userData);
      set({ isLoading: false });
      return {
        success: true,
        data: {
          userId: data.data.userId,
          email: data.data.email,
          emailSent: data.data.emailSent,
          devOTP: data.data.devOTP || null,
        },
      };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  },

  verifyEmail: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.verifyEmail(payload);
      const { accessToken, user } = data.data;
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
      sessionStorage.setItem('accessToken', accessToken);
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message || 'Verification failed' };
    }
  },

  logout: async () => {
    try { await authService.logout(); } catch (_) { }
    set({ user: null, accessToken: null, isAuthenticated: false });
    sessionStorage.removeItem('accessToken');
    // Also clear any old localStorage keys from previous version
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth-storage');
  },

  fetchMe: async () => {
    try {
      const { data } = await authService.getMe();
      set({ user: data.data.user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  updateUser: (updates) =>
    set((state) => ({ user: { ...state.user, ...updates } })),
}));

export default useAuthStore;