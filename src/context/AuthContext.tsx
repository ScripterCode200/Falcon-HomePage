'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sounds } from '@/lib/soundEffects';

export interface UserData {
  id: string;
  name: string;
  email: string;
  shortcuts?: any[];
  quizStats?: any;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  syncCloudData: (shortcuts?: any[], quizStats?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'falcon_jwt_token_v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Load session from localStorage on initial render
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) {
          setToken(savedToken);
          // Fetch user profile from API
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            // Token invalid or expired
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    sounds.playClick();
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        sounds.playCorrect();
        setIsAuthModalOpen(false);
        return { success: true };
      } else {
        sounds.playWrong();
        return { success: false, message: data.message || 'Login failed.' };
      }
    } catch (err: any) {
      sounds.playWrong();
      return { success: false, message: err.message || 'Network error occurred.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Gather existing local shortcuts to migrate to new account
      let localShortcuts: any[] = [];
      try {
        const saved = localStorage.getItem('falcon_custom_shortcuts_v1');
        if (saved) localShortcuts = JSON.parse(saved);
      } catch {}

      // Gather existing quiz stats to migrate
      let localStats: any = null;
      try {
        const saved = localStorage.getItem('falcon_quiz_stats_v1');
        if (saved) localStats = JSON.parse(saved);
      } catch {}

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          shortcuts: localShortcuts,
          quizStats: localStats,
        }),
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        sounds.playCorrect();
        setIsAuthModalOpen(false);
        return { success: true };
      } else {
        sounds.playWrong();
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (err: any) {
      sounds.playWrong();
      return { success: false, message: err.message || 'Network error occurred.' };
    }
  };

  const logout = () => {
    sounds.playClick();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const syncCloudData = async (shortcuts?: any[], quizStats?: any) => {
    if (!token) return;
    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shortcuts, quizStats }),
      });
    } catch (err) {
      console.error('Failed to sync data to cloud:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        syncCloudData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
