'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerSession } from '@/types/customer';

interface AuthContextType {
  customer: CustomerSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    company?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('impact-studio-session');
    if (stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        localStorage.removeItem('impact-studio-session');
      }
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((data: CustomerSession) => {
    localStorage.setItem('impact-studio-session', JSON.stringify(data));
    setCustomer(data);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }

    const { customer: sessionData } = await res.json();
    saveSession(sessionData);
  }, [saveSession]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    company?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const responseData = await res.json();
      throw new Error(responseData.error || 'Registration failed');
    }

    const { customer: sessionData } = await res.json();
    saveSession(sessionData);
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('impact-studio-session');
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
