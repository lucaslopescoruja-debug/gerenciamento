import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  Package,
  ScanLine,
  ClipboardList,
  ShieldCheck,
  Menu,
  X,
  Boxes,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User as UserIcon } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', permission: 'can_view_dashboard' },
  { label: 'Cargas', icon: Truck, path: '/cargas', permission: 'can_manage_loads' },
  { label: 'Nova Carga', icon: ClipboardList, path: '/nova-carga', permission: 'can_manage_loads' },
  { label: 'Produtos', icon: Package, path: '/produtos', permission: 'can_manage_products' },
  { label: 'Contagens', icon: ScanLine, path: '/contagens', permission: 'can_do_conference' },
  { label: 'Acesso', icon: ShieldCheck, path: '/acesso', permission: 'can_manage_users' },
] as const

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { user, logout, hasPermission } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg gradient-text">Estoque Fácil</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
        <div className="p-5 border-b border-border hidden md:flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm gradient-text">Estoque Fácil</h1>
            <p className="text-xs text-muted-foreground">Logística Inteligente</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-auto mt-14 md:mt-0">
          {navItems.map((item) => {
            if (!hasPermission(item.permission as any)) return null;
            if (item.path === '/nova-carga' && !isManager) return null;
            
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-3">
          {/* User Profile */}
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'operator'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between glass-card p-3">
            <span className="text-sm font-medium text-muted-foreground">Aparência</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground bg-background/50"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
