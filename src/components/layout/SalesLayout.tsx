import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  FileText, Users, Package, Menu, Search, Filter, Box
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Pedidos', icon: FileText, path: '/vendas/pedidos' },
  { label: 'Clientes', icon: Users, path: '/vendas/clientes' },
  { label: 'Produtos', icon: Package, path: '/vendas/produtos' },
  { label: 'Mais', icon: Menu, path: '/vendas/mais' },
] as const

export default function SalesLayout() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* App Header (Mobile optimized) */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          <span className="font-bold text-gray-800 text-lg">Força de Vendas</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {user?.name?.charAt(0).toUpperCase() || 'V'}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-2 pb-safe z-40">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      
      {/* CSS For Safe Area (iOS notch support) */}
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  )
}
