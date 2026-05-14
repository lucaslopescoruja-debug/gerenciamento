import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '@/api/users';
import type { User, UserPermissions } from '@/types/database';

interface AuthContextType {
  user: User | null;
  login: (username: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUserId = localStorage.getItem('auth_user_id');
    if (storedUserId) {
      usersApi.getUsers().then(users => {
        const found = users.find(u => u.id === storedUserId && u.active);
        if (found) {
          setUser(found);
        } else {
          localStorage.removeItem('auth_user_id');
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password_hash: string) => {
    try {
      const users = await usersApi.getUsers();
      // Simple direct login check (case insensitive for username)
      const found = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password_hash === password_hash &&
        u.active
      );

      if (found) {
        setUser(found);
        localStorage.setItem('auth_user_id', found.id);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_id');
  };

  const hasPermission = (permission: keyof UserPermissions) => {
    // Admin has all permissions implicitly
    if (user?.role === 'admin') return true;
    return user?.permissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
