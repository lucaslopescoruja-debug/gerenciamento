import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '@/api/users';
import { companiesApi } from '@/api/companies';
import { toast } from '@/components/ui/toaster';
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
            let comp = await companiesApi.getCompany(found.company_id);
            if (comp && comp.active) {
              const isActive = await companiesApi.verifyCompanyFinancialStatus(comp.id);
              if (!isActive) {
                comp.active = false;
              }
            }

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
          let comp = await companiesApi.getCompany(found.company_id);
          if (comp && comp.active) {
            const isActive = await companiesApi.verifyCompanyFinancialStatus(comp.id);
            if (!isActive) {
              comp.active = false;
            }
          }

          if (comp && comp.active) {
            currentCompanyId = comp.id;
            localStorage.setItem('auth_company_id', comp.id);
            setUser(found);
            setCompany(comp);
            localStorage.setItem('auth_user_id', found.id);
            return true;
          } else {
            toast.error('Empresa inativa. Verifique possíveis pendências. Favor contactar o suporte');
            return false;
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
      let comp = await companiesApi.getCompany(companyId);
      if (comp && comp.active) {
        const isActive = await companiesApi.verifyCompanyFinancialStatus(comp.id);
        if (!isActive) {
          comp.active = false;
        }
      }

      if (comp && comp.active) {
        currentCompanyId = comp.id;
        localStorage.setItem('auth_company_id', comp.id);
        setCompany(comp);
        return true;
      }
      toast.error('Empresa inativa. Verifique possíveis pendências. Favor contactar o suporte');
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
    // Admin, Master e Gestor têm todas as permissões implicitamente
    if (user?.role === 'admin' || user?.role === 'master' || user?.role === 'gestor' || user?.is_super_admin) return true;
    
    if (!user || !user.permissions) return false;

    // Se a permissão estiver explicitamente definida no banco (marcada ou desmarcada), respeita ela!
    if (user.permissions[permission] !== undefined) {
      return user.permissions[permission] === true;
    }

    // Fallbacks para chaves antigas não preenchidas no JSON (usuários legados)
    if (user.role === 'vendedor' || user.role === 'representante') {
      return ['can_view_dashboard', 'can_manage_products', 'can_use_sales_app', 'can_manage_sales', 'can_manage_customers'].includes(permission);
    }
    if (user.role === 'conferente' || user.role === 'operador') {
      return ['can_view_dashboard', 'can_manage_loads', 'can_do_conference'].includes(permission);
    }
    if (user.role === 'motorista' || user.role === 'ajudante') {
      return ['can_view_dashboard', 'can_do_delivery'].includes(permission);
    }
    if (user.role === 'mecanico') {
      return ['can_view_dashboard', 'can_manage_equipments'].includes(permission);
    }

    return false;
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
