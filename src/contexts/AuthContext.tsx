import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { companiesApi } from '@/api/companies';
import { toast } from '@/components/ui/toaster';
import type { User, UserPermissions, Company } from '@/types/database';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isMaster: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => Promise<boolean>;
  exitCompany: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o perfil (public.users) a partir da sessão do Supabase Auth.
  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setUser(null); setCompany(null); return; }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .eq('active', true)
      .maybeSingle();

    if (!profile) { setUser(null); setCompany(null); return; }
    setUser(profile as User);

    if (profile.company_id) {
      const comp = await companiesApi.getCompany(profile.company_id);
      setCompany(comp && comp.active ? comp : null);
    } else {
      setCompany(null); // super admin sem empresa selecionada
    }
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange(() => { loadProfile(); });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error('Usuário ou senha inválidos'); return false; }
    await loadProfile();
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
  };

  // Troca de empresa do super admin: ver nota abaixo sobre impersonação real.
  const switchCompany = async (companyId: string) => {
    if (!user?.is_super_admin) return false;
    const comp = await companiesApi.getCompany(companyId);
    if (comp && comp.active) { setCompany(comp); return true; }
    toast.error('Empresa inativa ou inexistente.');
    return false;
  };

  const exitCompany = () => {
    if (!user?.is_super_admin) return;
    setCompany(null);
  };

  const hasPermission = (permission: keyof UserPermissions) => {
    if (user?.role === 'admin' || user?.role === 'master' || user?.role === 'gestor' || user?.is_super_admin) return true;
    if (!user || !user.permissions) return false;
    if (user.permissions[permission] !== undefined) return user.permissions[permission] === true;
    if (user.role === 'vendedor' || user.role === 'representante')
      return ['can_view_dashboard','can_manage_products','can_use_sales_app','can_manage_sales','can_manage_customers'].includes(permission);
    if (user.role === 'conferente' || user.role === 'operador')
      return ['can_view_dashboard','can_manage_loads','can_do_conference'].includes(permission);
    if (user.role === 'motorista' || user.role === 'ajudante')
      return ['can_view_dashboard','can_do_delivery'].includes(permission);
    if (user.role === 'mecanico')
      return ['can_view_dashboard','can_manage_equipments'].includes(permission);
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
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
