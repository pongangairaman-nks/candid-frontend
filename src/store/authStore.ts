import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const user: User = {
        id: '1',
        email,
        name,
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: user !== null });
  },
}));
