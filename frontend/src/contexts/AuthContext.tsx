import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout, setLoading, setUser } = useAuthStore();

  useEffect(() => {
    // Check if user is already authenticated on app load
    const token = localStorage.getItem('token');
    if (token && !user) {
      refreshUser();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.login({ email, password });
      storeLogin(response.user, response.token, response.refreshToken);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; username: string; password: string; displayName: string }) => {
    try {
      setLoading(true);
      const response = await api.register(data);
      storeLogin(response.user, response.token, response.refreshToken);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await api.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      storeLogout();
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};