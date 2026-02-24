
'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../lib/auth';
import { loginAction, updateUserAction } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User> & { id: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = 'eduarchive_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    const result = await loginAction(email, pass);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setLoading(false);
  };
  
  const updateUser = useCallback(async (updatedUserData: Partial<User> & { id: string }) => {
    setLoading(true);
    const result = await updateUserAction(updatedUserData);
    if (result.success && result.user) {
        if (user && user.id === result.user.id) {
            setUser(result.user);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
        }
    }
    setLoading(false);
    return result;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
