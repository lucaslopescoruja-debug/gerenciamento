import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  FileText, Users, Package, Menu, Search, Filter, Box, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'
import { maxiprodApi } from '@/api/maxiprod'

const navItems = [
  { label: 'Pedidos', icon: FileText, path: '/vendas/pedidos' },
  { label: 'Clientes', icon: Users, path: '/vendas/clientes' },
  { label: 'Produtos', icon: Package, path: '/vendas/produtos' },
  { label: 'Mais', icon: Menu, path: '/vendas/mais' },
] as const

export default function SalesLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const isDark = theme.includes('dark')
  const isClassic = theme.startsWith('classic-')

  const toggleDarkLight = () => {
    const newTheme = (isClassic ? 'classic-' : '') + (isDark ? 'light' : 'dark')
    setTheme(newTheme as any)
  }

  useEffect(() => {
    // Sincroniza em background quando o Vendedor abre o App, se necessário
    if (user?.company_id) {
      maxiprodApi.autoSyncStockIfNeeded(10).catch(console.error)
    }
  }, [user?.company_id])

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* App Header (Mobile optimized) */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          <span className="font-bold text-foreground text-lg">Força de Vendas</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDarkLight} className="text-muted-foreground hover:text-foreground transition-colors">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'V'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* CSS For Safe Area (iOS notch support) */}
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  )
}
