/**
 * AI Work Tracker - 认证 Hook
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User } from '@lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取当前用户
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.success && data.data) {
        setUser(data.data);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时获取用户
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 登录
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        return true;
      } else {
        setError(data.error || '登录失败');
        return false;
      }
    } catch (err) {
      setError('网络错误，请重试');
      return false;
    }
  }, []);

  // 注册
  const register = useCallback(async (
    username: string, 
    password: string, 
    displayName?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, display_name: displayName })
      });

      const data = await res.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        return true;
      } else {
        setError(data.error || '注册失败');
        return false;
      }
    } catch (err) {
      setError('网络错误，请重试');
      return false;
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

