import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '@/api/users';
import { companiesApi } from '@/api/companies';
import type { User, UserPermissions, Company } from '@/types/database';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isMaster: boolean;
  login: (username: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => Promise<boolean>;
  exitCompany: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global variable for API layer to use
export let currentCompanyId: string | null = localStorage.getItem('auth_company_id');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUserId = localStorage.getItem('auth_user_id');
    if (storedUserId) {
      usersApi.getUsers().then(async users => {
        const found = users.find(u => u.id === storedUserId && u.active);
        if (found) {
          if (found.company_id) {
            const comp = await companiesApi.getCompany(found.company_id);
            if (comp && comp.active) {
              currentCompanyId = comp.id;
              localStorage.setItem('auth_company_id', comp.id);
              setUser(found);
              setCompany(comp);
            } else {
              currentCompanyId = null;
              localStorage.removeItem('auth_user_id');
              localStorage.removeItem('auth_company_id');
            }
          } else if (found.is_super_admin) {
            currentCompanyId = null;
            localStorage.removeItem('auth_company_id');
            setUser(found);
            setCompany(null);
          } else {
            currentCompanyId = null;
            localStorage.removeItem('auth_user_id');
            localStorage.removeItem('auth_company_id');
          }
        } else {
          currentCompanyId = null;
          localStorage.removeItem('auth_user_id');
          localStorage.removeItem('auth_company_id');
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
      const found = await usersApi.login(username, password_hash);

      if (found) {
        if (found.company_id) {
          const comp = await companiesApi.getCompany(found.company_id);
          if (comp && comp.active) {
            currentCompanyId = comp.id;
            localStorage.setItem('auth_company_id', comp.id);
            setUser(found);
            setCompany(comp);
            localStorage.setItem('auth_user_id', found.id);
            return true;
          }
        } else if (found.is_super_admin) {
          currentCompanyId = null;
          localStorage.removeItem('auth_company_id');
          setUser(found);
          setCompany(null);
          localStorage.setItem('auth_user_id', found.id);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const logout = () => {
    currentCompanyId = null;
    setUser(null);
    setCompany(null);
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_company_id');
  };

  const switchCompany = async (companyId: string) => {
    if (!user?.is_super_admin) return false;
    try {
      const comp = await companiesApi.getCompany(companyId);
      if (comp && comp.active) {
        currentCompanyId = comp.id;
        localStorage.setItem('auth_company_id', comp.id);
        setCompany(comp);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error switching company', e);
      return false;
    }
  };

  const exitCompany = () => {
    if (!user?.is_super_admin) return;
    currentCompanyId = null;
    localStorage.removeItem('auth_company_id');
    setCompany(null);
  };

  const hasPermission = (permission: keyof UserPermissions) => {
    // Admin has all permissions implicitly
    if (user?.role === 'admin') return true;
    if (!user || !user.permissions) return false;
    return user.permissions[permission] === true;
  };

  const isMaster = user?.is_super_admin === true;

  return (
    <AuthContext.Provider value={{ user, company, isMaster, login, logout, switchCompany, exitCompany, isLoading, hasPermission }}>
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
