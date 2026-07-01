import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Menu, X, Boxes, LayoutDashboard, Truck, Package, ClipboardList, 
  Settings, Users, CheckSquare, Palette, Sun, Moon, Search,
  Clock, History, UserIcon, FileSignature, Box, Building2, Banknote,
  Megaphone, StickyNote, MapPin, Bell, ShieldCheck, LogOut, Lock,
  ChevronDown, Map, Tag, Briefcase, HelpCircle, Wifi, WifiOff, RefreshCw
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { operationsApi } from '@/api/operations'
import { saasApi } from '@/api/saas'
import { toast } from '@/components/ui/toaster'
import { ProfileModal } from '@/components/ProfileModal'
import { TesterNotes } from '@/components/TesterNotes'
import type { LucideIcon } from 'lucide-react'

// ATUALIZE ESTA VERSÃO PARA TESTAR SE O APLICATIVO ATUALIZOU NOS DISPOSITIVOS
const APP_VERSION = 'v3.3.000'

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  permission: string;
  masterOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'can_view_dashboard' },
      { label: 'App Força de Vendas', icon: Briefcase, path: '/vendas', permission: 'can_use_sales_app' }
    ]
  },
  {
    title: 'OPERAÇÕES',
    items: [
      { label: 'Gestão de Pedidos', icon: FileSignature, path: '/vendas/gestao', permission: 'can_manage_sales' },
      { label: 'Cargas', icon: Truck, path: '/cargas', permission: 'can_manage_loads' },
      { label: 'Entregas', icon: MapPin, path: '/entregas', permission: 'can_do_delivery' }
    ]
  },
  {
    title: 'ESTOQUE',
    items: [
      { label: 'Estoque', icon: Package, path: '/produtos', permission: 'can_manage_products' },
      { label: 'Tabelas de Preço', icon: Tag, path: '/cadastros/tabelas-de-preco', permission: 'can_manage_price_tables' },
      { label: 'Condições de Pagamento', icon: Banknote, path: '/cadastros/condicoes-pagamento', permission: 'can_manage_payment_conditions' }
    ]
  },
  {
    title: 'COMODATOS',
    items: [
      { label: 'Equipamentos', icon: Box, path: '/comodatos', permission: 'can_manage_equipments' },
      { label: 'Ordens de Serviço', icon: ClipboardList, path: '/comodatos/os', permission: 'can_manage_os' },
      { label: 'Insumos / Peças', icon: Package, path: '/comodatos/insumos', permission: 'can_manage_supplies' },
      { label: 'Solicitar Peças', icon: Tag, path: '/comodatos/solicitacoes', permission: 'can_request_supplies' }
    ]
  },
  {
    title: 'CRM & CADASTROS',
    items: [
      { label: 'Clientes', icon: Building2, path: '/cadastros/clientes', permission: 'can_manage_customers' },
      { label: 'Grupos de Pedidos', icon: Boxes, path: '/vendas/grupos', permission: 'can_manage_order_groups' },
      { label: 'Representantes', icon: Users, path: '/cadastros/representantes', permission: 'can_manage_reps' },
      { label: 'Regiões', icon: Map, path: '/cadastros/regioes', permission: 'can_manage_regions' }
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { label: 'Minha Empresa', icon: Building2, path: '/configuracoes/empresa', permission: 'can_manage_company' },
      { label: 'Acessos', icon: ShieldCheck, path: '/acesso', permission: 'can_manage_users' }
    ]
  }
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  const [closedGroups, setClosedGroups] = useState<string[]>(
    navGroups.map(g => g.title).filter(Boolean)
  )
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const toggleGroup = (title: string) => {
    if (!title) return;
    
    setClosedGroups(prev => {
      const isCurrentlyClosed = prev.includes(title);
      const allGroups = navGroups.map(g => g.title).filter(Boolean);
      
      if (isCurrentlyClosed) {
        // We are opening it. Close all others.
        return allGroups.filter(g => g !== title);
      } else {
        // We are closing it. Close all.
        return allGroups;
      }
    });
  }

  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Ao mudar de rota, abre o menu atual e fecha todos os outros
    const activeGroup = navGroups.find(g => 
      g.items.some(item => location.pathname === item.path || (
        item.path !== '/dashboard' && 
        location.pathname.startsWith(item.path) &&
        !(item.path === '/vendas' && (location.pathname.startsWith('/vendas/gestao') || location.pathname.startsWith('/vendas/grupos')))
      ))
    )

    if (activeGroup?.title) {
      const allGroups = navGroups.map(g => g.title).filter(Boolean)
      setClosedGroups(allGroups.filter(g => g !== activeGroup.title))
    }
  }, [location.pathname])
  const { user, company, logout, hasPermission, isMaster } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master' || isMaster

  const isDark = theme.includes('dark');

  // Lembrete de backup toda sexta-feira às 15h
  useEffect(() => {
    if (!isManager) return;

    const checkBackupReminder = () => {
      const now = new Date();
      // 5 = Sexta-feira
      if (now.getDay() === 5 && now.getHours() >= 15) {
        const lastAlert = localStorage.getItem('last_backup_alert');
        const todayStr = now.toISOString().split('T')[0];
        
        if (lastAlert !== todayStr) {
          toast.info(
            '🛡️ Lembrete de Segurança: Como hoje é sexta-feira, não se esqueça de realizar o backup do sistema para manter seus dados seguros.',
            { 
              duration: 0,
              action: {
                label: 'Fazer Backup Agora',
                onClick: () => navigate('/configuracoes/empresa')
              }
            }
          );
          localStorage.setItem('last_backup_alert', todayStr);
        }
      }
    };

    checkBackupReminder();
    const interval = setInterval(checkBackupReminder, 1000 * 60 * 60); // Verifica a cada 1 hora
    return () => clearInterval(interval);
  }, [isManager]);

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending_approvals', company?.id],
    queryFn: () => deliveriesApi.getPendingApprovals(company?.id),
    refetchInterval: 60000,
    enabled: !!user && !!company?.id
  })

  const { data: leads = [] } = useQuery({
    queryKey: ['system_leads'],
    queryFn: saasApi.getLeads,
    refetchInterval: 15000,
    enabled: isMaster
  })

  const unreadLeadsCount = leads.filter((lead: any) => !lead.viewed).length

  const { data: pendingStockAdjustments = [] } = useQuery({
    queryKey: ['pending_stock_adjustments', company?.id],
    queryFn: () => operationsApi.getPendingStockAdjustments(company?.id),
    refetchInterval: 60000,
    enabled: !!user && isManager && !!company?.id
  })

  const { data: pendingOperationAlerts = [] } = useQuery({
    queryKey: ['pending_operation_alerts', company?.id],
    queryFn: () => operationsApi.getPendingOperationAlerts(company?.id),
    refetchInterval: 60000,
    enabled: !!user && isManager && !!company?.id
  })

  const totalPendingApprovals = pendingApprovals.length + 
    (isManager ? (pendingStockAdjustments.length + pendingOperationAlerts.length) : 0)

  const toggleDarkLight = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const getPlanRequirement = (path: string) => {
    // App Força de Vendas
    if (path === '/vendas') return 'platina'
    
    // OPERAÇÕES
    if (path === '/vendas/gestao') return 'ouro'
    if (path === '/cargas') return 'prata'
    if (path === '/entregas') return 'ouro'
    
    // ESTOQUE
    if (path === '/produtos') return 'bronze' // Estoque (Produtos)
    if (path === '/cadastros/tabelas-de-preco') return 'platina'
    if (path === '/cadastros/condicoes-pagamento') return 'platina'
    
    // COMODATOS
    if (path === '/comodatos') return 'ouro'
    if (path === '/comodatos/os') return 'ouro'
    if (path === '/comodatos/insumos') return 'ouro'
    if (path === '/comodatos/solicitacoes') return 'ouro'
    
    // CRM & CADASTROS
    if (path === '/cadastros/clientes') return 'ouro'
    if (path === '/vendas/grupos') return 'platina'
    if (path === '/cadastros/representantes') return 'platina'
    if (path === '/cadastros/regioes') return 'ouro'
    
    // SISTEMA
    if (path === '/configuracoes/empresa') return 'bronze'
    if (path === '/acesso') return 'bronze'

    return 'bronze'
  }

  const isFeatureLocked = (path: string) => {
    if (isMaster || user?.role === 'master') return false; // Master has no limits

    const plan = company?.plan || 'platina' // default to platina if not set
    const requirement = getPlanRequirement(path)
    
    if (requirement === 'bronze') return false
    if (requirement === 'prata' && plan === 'bronze') return true
    if (requirement === 'ouro' && (plan === 'bronze' || plan === 'prata')) return true
    if (requirement === 'platina' && plan !== 'platina') return true
    return false
  }

  const handleNavClick = (e: React.MouseEvent, path: string, isLocked: boolean) => {
    if (isLocked) {
      e.preventDefault()
      toast.error('Recurso indisponível no seu plano atual. Faça o upgrade para acessar!')
    } else {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain drop-shadow-md" />
          <span className="font-bold text-lg gradient-text whitespace-nowrap">Estoque Fácil <span className="text-[10px] text-green-500 ml-1">{APP_VERSION.split('.')[0]}</span></span>
        </Link>
        <div className="flex items-center gap-1">
          {!isOnline && (
            <div className="flex items-center justify-center mr-1 p-1 bg-red-500/10 text-red-500 rounded-full" title="Você está offline">
              <WifiOff className="h-4 w-4" />
            </div>
          )}
          {isManager && (
            <Link
              to="/liberacoes"
              className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground relative"
              title="Liberações"
            >
              <Bell className="h-5 w-5" />
              {totalPendingApprovals > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {totalPendingApprovals}
                </span>
              )}
            </Link>
          )}
          {isMaster && (
            <Link
              to="/saas/leads"
              className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground relative"
              title="Leads e Contatos"
            >
              <Users className="h-5 w-5" />
              {unreadLeadsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                  {unreadLeadsCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={toggleDarkLight}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky md:top-0 top-0 left-0 z-40 h-full md:h-screen w-64 border-r border-border bg-card/95 backdrop-blur-xl flex flex-col transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <Link to="/dashboard" className="h-16 px-5 border-b border-border hidden md:flex items-center gap-3 shrink-0 cursor-pointer hover:bg-muted/30 transition-colors">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain drop-shadow-md" />
          <div>
            <h1 className="font-bold text-sm gradient-text flex items-baseline gap-1">Estoque Fácil <span className="text-[10px] text-green-500">{APP_VERSION.split('.')[0]}</span></h1>
            <p className="text-xs text-muted-foreground">{company?.name || (isMaster ? 'Painel Master' : 'Carregando...')}</p>
          </div>
        </Link>

        {/* Mobile User Profile */}
        <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-border/50 mt-14 bg-card/50">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            {(user?.name || user?.username || 'US').substring(0, 2)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-tight truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">{user?.role || 'operator'}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors shrink-0" title="Sair">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-auto md:mt-0">
          {/* Grouped Navigation Items */}
          {company && navGroups.map((group, gIdx) => {
            const hasVisibleItems = group.items.some(item => {
              if (item.masterOnly && !isMaster) return false;
              return hasPermission(item.permission as any);
            });
            if (!hasVisibleItems) return null;

            const isClosed = closedGroups.includes(group.title);

            return (
              <div key={gIdx} className="mb-4">
                {group.title ? (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 pb-2 cursor-pointer group/header hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/header:text-foreground transition-colors">
                      {group.title}
                    </span>
                    <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isClosed && "-rotate-90")} />
                  </button>
                ) : null}
                
                <div className={cn(
                  "space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out origin-top",
                  isClosed ? "max-h-0 opacity-0 scale-y-95 mt-0" : "max-h-[500px] opacity-100 scale-y-100"
                )}>
                  {group.items.map((item) => {
                    if (item.masterOnly && !isMaster) return null;
                    if (!hasPermission(item.permission as any)) return null;
                    const isActive = location.pathname === item.path || (
                      item.path !== '/dashboard' && 
                      location.pathname.startsWith(item.path) &&
                      !(item.path === '/vendas' && (location.pathname.startsWith('/vendas/gestao') || location.pathname.startsWith('/vendas/grupos')))
                    );
                    const isLocked = isFeatureLocked(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={(e) => handleNavClick(e, item.path, isLocked)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                          isActive
                            ? "bg-primary/15 text-primary border border-primary/20"
                            : isLocked 
                              ? "opacity-60 grayscale cursor-not-allowed text-muted-foreground hover:bg-muted/50" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <item.icon className={cn("h-4.5 w-4.5", isActive && "text-primary")} />
                        {item.label}
                        {isLocked && <Lock className="h-3.5 w-3.5 ml-auto text-muted-foreground opacity-70 group-hover:text-red-400 group-hover:opacity-100 transition-colors" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
          
          {/* Menu SaaS Exclusivo Master */}
          {isMaster && (
            <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu Global
              </div>
              
              <Link
                to="/saas"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas' || location.pathname === '/saas/empresas'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <Building2 className={cn("h-4.5 w-4.5", (location.pathname === '/saas' || location.pathname === '/saas/empresas') && "text-purple-500")} />
                Empresas
              </Link>

              <Link
                to="/saas/financeiro"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas/financeiro'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <Banknote className={cn("h-4.5 w-4.5", location.pathname === '/saas/financeiro' && "text-purple-500")} />
                Financeiro
              </Link>

              <Link
                to="/saas/acessos"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas/acessos'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <Users className={cn("h-4.5 w-4.5", location.pathname === '/saas/acessos' && "text-purple-500")} />
                Acessos Globais
              </Link>

              <Link
                to="/saas/campanhas"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas/campanhas'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <Megaphone className={cn("h-4.5 w-4.5", location.pathname === '/saas/campanhas' && "text-purple-500")} />
                Campanhas
              </Link>

              <Link
                to="/saas/anotacoes"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas/anotacoes'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <StickyNote className={cn("h-4.5 w-4.5", location.pathname === '/saas/anotacoes' && "text-purple-500")} />
                Mural de Recados
              </Link>

              <Link
                to="/saas/leads"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/saas/leads'
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : "text-muted-foreground hover:text-purple-500 hover:bg-muted/50"
                )}
              >
                <Users className={cn("h-4.5 w-4.5", location.pathname === '/saas/leads' && "text-purple-500")} />
                Leads & Contatos
              </Link>
            </div>
          )}
          
          {/* Bottom Actions */}
          <div className="pt-4 mt-4 border-t border-border/50 space-y-1 pb-4">
            <Link
              to="/ajuda"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === '/ajuda'
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HelpCircle className={cn("h-4.5 w-4.5", location.pathname === '/ajuda' && "text-primary")} />
              Ajuda e Suporte
            </Link>
            <div className="px-3 pt-2 text-center pb-2">
              <span className="text-[10px] text-muted-foreground/50 font-medium select-all">
                Versão {APP_VERSION}
              </span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 px-6 border-b border-border bg-card/50 backdrop-blur-md items-center justify-end sticky top-0 z-30">
          <div className="flex items-center gap-4">
             {/* User Menu Trigger */}
             <div className="relative">
               <div 
                 className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                 onClick={() => setShowProfileMenu(!showProfileMenu)}
               >
                  <div className="text-right">
                     <p className="text-sm font-bold text-foreground leading-none">{user?.name || 'Usuário'}</p>
                     <p className="text-xs text-muted-foreground capitalize mt-1">{user?.role || 'operator'}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-border">
                     {user?.avatar_url ? (
                       <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                     ) : (
                       <UserIcon className="h-4 w-4 text-primary" />
                     )}
                  </div>
               </div>

               {/* Dropdown Menu */}
               {showProfileMenu && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                   <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card shadow-lg z-50 py-1 slide-in fade-in animate-in">
                     <button 
                       className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                       onClick={() => {
                         setShowProfileMenu(false)
                         setIsProfileModalOpen(true)
                       }}
                     >
                       <UserIcon className="h-4 w-4" />
                       Meu Perfil
                     </button>

                     <button 
                       className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                       onClick={() => {
                         setShowProfileMenu(false)
                         toggleDarkLight()
                       }}
                     >
                       {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                       Modo {isDark ? 'Claro' : 'Escuro'}
                     </button>
                     <div className="h-px bg-border my-1"></div>
                     <button 
                       className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                       onClick={() => {
                         setShowProfileMenu(false)
                         logout()
                       }}
                     >
                       <LogOut className="h-4 w-4" />
                       Sair
                     </button>
                   </div>
                 </>
               )}
             </div>
             
             <div className="h-6 w-px bg-border mx-1"></div>
             
             {!isOnline && (
               <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium">
                 <WifiOff className="h-4 w-4" />
                 <span>Offline</span>
               </div>
             )}

             {isManager && (
               <Link
                  to="/liberacoes"
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer relative"
                  title="Liberações"
               >
                  <Bell className="h-5 w-5" />
                  {totalPendingApprovals > 0 && (
                     <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                        {totalPendingApprovals}
                     </span>
                  )}
               </Link>
             )}
             
             {isMaster && (
                <Link
                   to="/saas/leads"
                   className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer relative"
                   title="Leads e Contatos"
                >
                   <Users className="h-5 w-5" />
                   {unreadLeadsCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                         {unreadLeadsCount}
                      </span>
                   )}
                </Link>
             )}
             
             <TesterNotes />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  )
}
