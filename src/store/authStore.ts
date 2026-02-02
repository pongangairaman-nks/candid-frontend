import { create } from 'zustand';
import { authApi, SignupRequest, LoginRequest } from '@/services/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login(data);
      set({ 
        user: result.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
  
  signup: async (data: SignupRequest) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.signup(data);
      set({ 
        user: result.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
  
  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: user !== null });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          authApi.logout();
        }
      }
    }
  },
}));
