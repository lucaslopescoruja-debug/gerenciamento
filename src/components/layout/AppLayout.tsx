import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Menu, X, Boxes, LayoutDashboard, Truck, Package, ClipboardList, 
  Settings, Users, CheckSquare, Palette, Sun, Moon, Search,
  Clock, History, UserIcon, FileSignature, Box, Building2, Banknote,
  Megaphone, StickyNote, MapPin, Bell, ShieldCheck, LogOut
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { operationsApi } from '@/api/operations'


const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', permission: 'can_view_dashboard' },
  { label: 'Cargas', icon: Truck, path: '/cargas', permission: 'can_manage_loads' },
  { label: 'Entregas', icon: MapPin, path: '/entregas', permission: 'can_do_delivery' },
  { label: 'Estoque', icon: Package, path: '/produtos', permission: 'can_manage_products' },
  { label: 'Acesso', icon: ShieldCheck, path: '/acesso', permission: 'can_manage_users' },
] as const

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { user, company, logout, hasPermission, isMaster } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'

  const isDark = theme.includes('dark');
  const isClassic = theme.startsWith('classic-');

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: deliveriesApi.getPendingApprovals,
    refetchInterval: 10000,
    enabled: !!user
  })

  const { data: pendingStockAdjustments = [] } = useQuery({
    queryKey: ['pending_stock_adjustments'],
    queryFn: () => operationsApi.getPendingStockAdjustments(),
    refetchInterval: 10000,
    enabled: !!user && isManager
  })

  const { data: pendingOperationAlerts = [] } = useQuery({
    queryKey: ['pending_operation_alerts'],
    queryFn: () => operationsApi.getPendingOperationAlerts(),
    refetchInterval: 10000,
    enabled: !!user && isManager
  })

  const totalPendingApprovals = pendingApprovals.length + 
    (isManager ? (pendingStockAdjustments.length + pendingOperationAlerts.length) : 0)

  const toggleDarkLight = () => {
    const newTheme = (isClassic ? 'classic-' : '') + (isDark ? 'light' : 'dark')
    setTheme(newTheme as any)
  }

  const toggleStyle = () => {
    const newTheme = (isClassic ? '' : 'classic-') + (isDark ? 'dark' : 'light')
    setTheme(newTheme as any)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
          <Boxes className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg gradient-text">Estoque Fácil</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
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
          <button
            onClick={toggleStyle}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
            title="Alternar tema (Padrão / Clássico)"
          >
            <Palette className="h-5 w-5" />
          </button>
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
        <Link to="/" className="h-16 px-5 border-b border-border hidden md:flex items-center gap-3 shrink-0 cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm gradient-text">Estoque Fácil</h1>
            <p className="text-xs text-muted-foreground">{company?.name || (isMaster ? 'Painel Master' : 'Carregando...')}</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-auto mt-14 md:mt-0">
          {/* Navigation Items - Only show if user has an active company context */}
          {company && navItems.map((item) => {
            if (!hasPermission(item.permission as any)) return null
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5", isActive && "text-primary")} />
                {item.label}
              </Link>
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
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 px-6 border-b border-border bg-card/50 backdrop-blur-md items-center justify-end sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="text-right">
                   <p className="text-sm font-bold text-foreground leading-none">{user?.name || 'Usuário'}</p>
                   <p className="text-xs text-muted-foreground capitalize mt-1">{user?.role || 'operator'}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                   <UserIcon className="h-4 w-4 text-primary" />
                </div>
             </div>
             
             <div className="h-6 w-px bg-border mx-1"></div>
             
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
             
             <button onClick={toggleStyle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer" title="Alternar tema (Padrão / Clássico)">
                <Palette className="h-5 w-5" />
             </button>
             <button onClick={toggleDarkLight} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer" title="Alternar tema">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
             </button>
             
             <button onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors cursor-pointer" title="Sair">
                <LogOut className="h-5 w-5" />
             </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
