'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get<{ success: boolean; user: User }>(
            '/api/auth/me'
          );
          setUser(response.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{
        success: boolean;
        token: string;
        user: User;
      }>('/api/auth/login', { email, password });

      localStorage.setItem('token', response.token);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Login failed. Please try again.'
      );
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await api.post<{
        success: boolean;
        token: string;
        user: User;
      }>('/api/auth/register', { email, password });

      localStorage.setItem('token', response.token);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Registration failed. Please try again.'
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<{ success: boolean; user: User }>(
        '/api/auth/me'
      );
      setUser(response.user);
    } catch (error) {
      console.error('Failed to refresh user data');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
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

