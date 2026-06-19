import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { companiesApi } from '@/api/companies';
import { usersApi } from '@/api/users';
import { toast } from '@/components/ui/toaster';
import type { User, UserPermissions, Company } from '@/types/database';

// Variável global na memória do JS para persistir apenas enquanto a aba/SPA não for recarregada.
let isMasterSessionActive = false;
let isLoggingIn = false;

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isMaster: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresConfirmation?: boolean; pendingUserId?: string; isInitialPassword?: boolean; mustChangePassword?: boolean }>;
  confirmLogin: (pendingUserId?: string, isInitialPassword?: boolean) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  cancelLogin: () => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<boolean>;
  exitCompany: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  updateUserLocally: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o perfil (public.users) a partir da sessão do Supabase Auth.
  const loadProfile = useCallback(async () => {
    // ====== MODO FALLBACK OFFLINE ======
    if (!navigator.onLine) {
      const offlineProfileStr = localStorage.getItem('offline_user_profile');
      if (offlineProfileStr) {
        try {
          const offlineData = JSON.parse(offlineProfileStr);
          setUser(offlineData.user);
          setCompany(offlineData.company);
          return;
        } catch(e) {
          console.error("Failed to parse offline profile", e);
        }
      }
    }
    // ===================================

    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Se a sessão expirou E estamos offline, mas algo deu erro na verificação do navigator.onLine,
    // garantimos que ele resgate o cache.
    if (error && !navigator.onLine) {
      const offlineProfileStr = localStorage.getItem('offline_user_profile');
      if (offlineProfileStr) {
        try {
          const offlineData = JSON.parse(offlineProfileStr);
          setUser(offlineData.user);
          setCompany(offlineData.company);
          return;
        } catch(e) {}
      }
    }

    if (!session?.user) { 
      setUser(null); 
      setCompany(null); 
      localStorage.removeItem('offline_user_profile');
      return; 
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .eq('active', true)
      .maybeSingle();

    if (profileError && (profileError.message.includes('Failed to fetch') || profileError.message.includes('Network'))) {
      const offlineProfileStr = localStorage.getItem('offline_user_profile');
      if (offlineProfileStr) {
        try {
          const offlineData = JSON.parse(offlineProfileStr);
          setUser(offlineData.user);
          setCompany(offlineData.company);
          return;
        } catch(e) {}
      }
    }

    if (!profile) { setUser(null); setCompany(null); return; }

    // ====== FORÇA LOGOUT DO MASTER EM F5/RELOAD ======
    // Se for master e não fez login na aba atual (ex: recarregou a página ou duplicou a aba), forçar logout
    if (profile.is_super_admin && !isMasterSessionActive) {
      await supabase.auth.signOut();
      setUser(null);
      setCompany(null);
      return;
    }
    // =================================================

    // ====== PROTEÇÃO DE SESSÃO ÚNICA (1 MÁQUINA POR PERFIL) ======
    let localSessionId = localStorage.getItem('device_session_id');
    
    // Se não tiver localSessionId (ex: logou antes da feature existir ou limpou os dados), cria e assume a sessão
    if (!localSessionId) {
       localSessionId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
       localStorage.setItem('device_session_id', localSessionId);
       // Atualiza silenciosamente no banco para assumir que esta é a sessão válida
       await supabase.from('users').update({ last_session_id: localSessionId }).eq('id', profile.id);
       profile.last_session_id = localSessionId; 
    }

    // Se os IDs não baterem, significa que há conflito com outra máquina
    if (profile.last_session_id && profile.last_session_id !== localSessionId) {
        if (isLoggingIn) {
            // Em processo de login, apenas interrompe o carregamento do perfil atual.
            // O componente Login vai receber requiresConfirmation e exibir o modal sem navegar.
            return;
        } else {
            // Navegação normal, a outra máquina assumiu o controle, então expulsa essa
            await supabase.auth.signOut();
            toast.error('Sessão encerrada! Outro dispositivo fez login com sua conta.');
            setUser(null);
            setCompany(null);
            return;
        }
    }
    // =============================================================

    setUser(profile as User);

    let targetCompanyId = profile.company_id || profile.impersonated_company_id;

    // Se o master está fazendo um login fresco, limpar a empresa logada anteriormente
    if (isLoggingIn && profile.is_super_admin) {
      try {
        await supabase.from('users').update({ impersonated_company_id: null }).eq('id', profile.id);
        profile.impersonated_company_id = null;
        targetCompanyId = profile.company_id; // que para master costuma ser null
      } catch (e) {
        console.error('Erro ao limpar impersonated_company_id do master no login', e);
      }
    }

    if (targetCompanyId) {
      const comp = await companiesApi.getCompany(targetCompanyId);
      const companyData = comp && comp.active ? comp : null;
      setCompany(companyData);
      localStorage.setItem('offline_user_profile', JSON.stringify({ user: profile, company: companyData }));
    } else {
      setCompany(null); // super admin sem empresa selecionada
      localStorage.setItem('offline_user_profile', JSON.stringify({ user: profile, company: null }));
    }
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange(() => { loadProfile(); });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    // Marca a sessão como ativa ANTES de fazer login para garantir que os listeners de auth reconheçam
    isMasterSessionActive = true;
    isLoggingIn = true; // Impede que o loadProfile deslogue imediatamente caso pegue o banco desatualizado

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
      isMasterSessionActive = false;
      isLoggingIn = false;
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        toast.error('Sem conexão com a internet. Verifique sua rede.');
      } else {
        toast.error('Usuário ou senha inválidos'); 
      }
      return { success: false }; 
    }
    
    // Verifica sessão atual no banco
    const { data: userProfile } = await supabase.from('users').select('id, last_session_id').eq('auth_user_id', data.session.user.id).maybeSingle();
    let localSessionId = localStorage.getItem('device_session_id');

    // Se já existe um session ID no banco para este usuário e ele for diferente do atual, pede confirmação
    if (userProfile && userProfile.last_session_id && userProfile.last_session_id !== localSessionId) {
      return { 
         success: true, 
         requiresConfirmation: true, 
         pendingUserId: userProfile.id,
         isInitialPassword: password === 'Trocar@123'
      };
    }
    
    // Se não tiver conflito, loga direto
    return await confirmLogin(userProfile?.id, password === 'Trocar@123');
  };

  const confirmLogin = async (pendingUserId?: string, isInitialPassword?: boolean) => {
    // Gera novo ID da máquina e salva localmente e no banco
    const newSessionId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
    localStorage.setItem('device_session_id', newSessionId);

    if (pendingUserId) {
      await supabase.from('users').update({ last_session_id: newSessionId }).eq('id', pendingUserId);
    }
    
    isLoggingIn = false;
    
    let mustChangePassword = false;

    // Força a troca de senha se a senha for o padrão inicial
    if (isInitialPassword && pendingUserId) {
      mustChangePassword = true;
      try {
        await usersApi.updateUser(pendingUserId, { must_change_password: true });
      } catch (e) {
        console.error("Erro ao forçar troca de senha", e);
      }
    }
    
    await loadProfile();
    return { success: true, mustChangePassword };
  };

  const cancelLogin = async () => {
    await supabase.auth.signOut();
    isLoggingIn = false;
    isMasterSessionActive = false;
    localStorage.removeItem('offline_user_profile');
    setUser(null);
    setCompany(null);
  };

  const logout = async () => {
    if (user) {
      await supabase.from('users').update({ last_session_id: null }).eq('id', user.id);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('offline_user_profile');
    setUser(null);
    setCompany(null);
  };

  const switchCompany = async (companyId: string) => {
    if (!user?.is_super_admin) return false;
    const comp = await companiesApi.getCompany(companyId);
    if (comp && comp.active) { 
      setCompany(comp); 
      // Update impersonated_company_id in db for RLS impersonation
      await supabase.from('users').update({ impersonated_company_id: companyId }).eq('auth_user_id', user.auth_user_id);
      return true; 
    }
    toast.error('Empresa inativa ou inexistente.');
    return false;
  };

  const exitCompany = async () => {
    if (!user?.is_super_admin) return;
    setCompany(null);
    await supabase.from('users').update({ impersonated_company_id: null }).eq('auth_user_id', user.auth_user_id);
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

  const updateUserLocally = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
      
      // Atualizar também o fallback offline se existir
      const offlineProfileStr = localStorage.getItem('offline_user_profile');
      if (offlineProfileStr) {
        try {
          const offlineData = JSON.parse(offlineProfileStr);
          offlineData.user = { ...offlineData.user, ...updates };
          localStorage.setItem('offline_user_profile', JSON.stringify(offlineData));
        } catch(e) {}
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, company, isMaster, login, confirmLogin, cancelLogin, logout, switchCompany, exitCompany, isLoading, hasPermission, updateUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
