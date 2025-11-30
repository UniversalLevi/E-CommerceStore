'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string, isMobile?: boolean) => Promise<void>;
  register: (email: string, mobile: string, password: string, name?: string, country?: string) => Promise<void>;
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
      try {
        const response = await api.get<{ success: boolean; user: User }>(
          '/api/auth/me'
        );
        setUser(response.user);
      } catch (error) {
        // Not authenticated - cookie not present or invalid
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (emailOrMobile: string, password: string, isMobile: boolean = false) => {
    try {
      const payload = isMobile 
        ? { mobile: emailOrMobile, password }
        : { email: emailOrMobile, password };

      const response = await api.post<{
        success: boolean;
        user: User;
      }>('/api/auth/login', payload);

      setUser(response.user);
      // Redirect based on user role
      if (response.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, mobile: string, password: string, name?: string, country?: string) => {
    try {
      const payload: any = { email, mobile, password };
      if (name) payload.name = name;
      if (country) payload.country = country;

      const response = await api.post<{
        success: boolean;
        user: User;
      }>('/api/auth/register', payload);

      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    setUser(null);
    router.push('/');
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

