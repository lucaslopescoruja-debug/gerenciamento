import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  PackageX,
  PackageMinus,
  BarChart3,
  PackageCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success', colorClass: string }> = {
  pending: { label: 'Pendente', variant: 'warning', colorClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  in_progress: { label: 'Conferindo', variant: 'default', colorClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  dispatched: { label: 'Em Rota', variant: 'warning', colorClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  completed: { label: 'Finalizada', variant: 'success', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  const isDriverOrHelper = user?.role === 'motorista' || user?.role === 'ajudante'
  const isConferente = user?.role === 'conferente'

  const showLoads = isManager || isConferente
  const showDeliveries = isManager || isDriverOrHelper

  const { data: operations = [], isLoading: isLoadingOp } = useQuery({
    queryKey: ['operations'],
    queryFn: operationsApi.getOperations,
    enabled: showLoads,
  })

  const { data: deliveries = [], isLoading: isLoadingDel } = useQuery({
    queryKey: ['delivery_routes'],
    queryFn: deliveriesApi.getDeliveryRoutes,
    enabled: showDeliveries,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
    enabled: isManager,
  })

  const lowStockProducts = useMemo(() => {
    return products.filter((p: any) => p.min_stock_alert !== undefined && p.min_stock_alert > 0 && p.stock < p.min_stock_alert)
  }, [products])

  const loadStats = useMemo(() => {
    return {
      total: operations.length,
      pending: operations.filter((l: any) => l.status === 'pending').length,
      dispatched: operations.filter((l: any) => l.status === 'dispatched' || l.status === 'in_progress').length,
      completed: operations.filter((l: any) => l.status === 'completed').length,
    }
  }, [operations])

  const deliveryStats = useMemo(() => {
    const relevantDeliveries = isDriverOrHelper 
      ? deliveries.filter((r: any) => r.driver_id === user?.id || r.helper_id === user?.id) 
      : deliveries

    return {
      total: relevantDeliveries.length,
      pending: relevantDeliveries.filter((l: any) => l.status === 'pending').length,
      dispatched: relevantDeliveries.filter((l: any) => l.status === 'in_progress').length,
      completed: relevantDeliveries.filter((l: any) => l.status === 'completed').length,
    }
  }, [deliveries, isDriverOrHelper, user?.id])

  const isLoading = (showLoads && isLoadingOp) || (showDeliveries && isLoadingDel)

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dashboard...</div>
  }

  const delayedDeliveries = deliveries.filter((d: any) => d.status === 'pending' || d.status === 'in_progress').length

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 slide-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral das operações logísticas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total de Cargas" 
          value={loadStats.total} 
          icon={Truck} 
          iconBg="bg-primary" 
          iconColor="text-white" 
          trend="Hoje" 
          trendColor="text-primary"
        />
        <StatsCard 
          title="Pendentes" 
          value={loadStats.pending} 
          icon={Clock} 
          iconBg="bg-orange-500" 
          iconColor="text-white" 
          trend="Hoje" 
          trendColor="text-orange-500"
        />
        <StatsCard 
          title="Em Rota" 
          value={loadStats.dispatched} 
          icon={Truck} 
          iconBg="bg-blue-500" 
          iconColor="text-white" 
          trend="Hoje" 
          trendColor="text-blue-500"
        />
        <StatsCard 
          title="Finalizadas" 
          value={loadStats.completed} 
          icon={CheckCircle2} 
          iconBg="bg-emerald-500" 
          iconColor="text-white" 
          trend="Hoje" 
          trendColor="text-muted-foreground"
        />
        <StatsCard 
          title="Estoque Baixo" 
          value={lowStockProducts.length} 
          icon={AlertTriangle} 
          iconBg="bg-amber-500" 
          iconColor="text-white" 
          trend="Atenção" 
          trendColor="text-amber-500"
        />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Últimas Cargas Table */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Últimas Cargas</h2>
            <Button variant="secondary" size="sm" className="h-8 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border-0" onClick={() => navigate('/cargas')}>
              Ver todas
            </Button>
          </div>
          <div className="p-0 overflow-x-auto">
            {operations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma carga encontrada.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 font-medium">Carga</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Cliente/Origem</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {operations.slice(0, 6).map((load: any) => {
                    const config = statusConfig[load.status] || statusConfig.pending
                    return (
                    <tr key={load.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/cargas/${load.id}`)}>
                      <td className="px-5 py-3.5 font-medium text-foreground">{load.load_number || 'Sem Nome'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.colorClass}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{load.customer?.name || '---'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{new Date(load.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="inline-block h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Alertas Importantes */}
        <Card className="border-border shadow-sm flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Alertas Importantes</h2>
          </div>
          <div className="p-5 flex-1 space-y-4">
            
            {delayedDeliveries > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => navigate('/entregas')}>
                <div className="bg-orange-500/10 p-2.5 rounded-lg shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{delayedDeliveries} rotas em andamento/pendentes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verifique as rotas no painel.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => navigate('/produtos')}>
                <div className="bg-red-500/10 p-2.5 rounded-lg shrink-0">
                  <PackageX className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{lowStockProducts.length} produtos com estoque baixo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Risco de ruptura nas próximas entregas.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
              </div>
            )}

            {loadStats.pending > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => navigate('/cargas')}>
                <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                  <PackageMinus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{loadStats.pending} cargas aguardando conferência</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Inicie a separação.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
              </div>
            )}

            {delayedDeliveries === 0 && lowStockProducts.length === 0 && loadStats.pending === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                Nenhum alerta no momento.
              </div>
            )}

          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <Card className="border-border shadow-sm p-5">
        <h2 className="text-lg font-semibold text-foreground mb-6">Resumo das Operações (Hoje)</h2>
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 h-[250px] min-w-0 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
             <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Gráfico indisponível temporariamente
             </p>
          </div>

          {/* Chart Legend Summary */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col justify-center space-y-4 pr-4">
            
            {/* Legend Toggles */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-primary" /> Cargas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Em Rota
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Finalizadas
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-foreground font-medium">Total de Cargas</span>
              </div>
              <span className="font-bold">{loadStats.total}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-foreground font-medium">Em Rota</span>
              </div>
              <span className="font-bold">{loadStats.dispatched}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm text-foreground font-medium">Pendentes</span>
              </div>
              <span className="font-bold">{loadStats.pending}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-foreground font-medium">Finalizadas</span>
              </div>
              <span className="font-bold">{loadStats.completed}</span>
            </div>

          </div>
        </div>
      </Card>

    </div>
  )
}

function StatsCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendColor }: any) {
  return (
    <Card className="p-4 border-border shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${iconBg} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`h-6 w-6 ${iconBg.replace('bg-', 'text-')} dark:${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className={`text-[10px] font-bold ${trendColor}`}>
            {trend}
          </span>
        </div>
      </div>
    </Card>
  )
}
