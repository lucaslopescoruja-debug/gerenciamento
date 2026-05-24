import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  MapPin,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { deliveriesApi } from '@/api/deliveries'

export default function Dashboard() {
  const { user } = useAuth()
  const isDriver = user?.role === 'motorista'

  const { data: operations = [], isLoading: isLoadingOp } = useQuery({
    queryKey: ['operations'],
    queryFn: operationsApi.getOperations,
    enabled: !isDriver,
  })

  const { data: deliveries = [], isLoading: isLoadingDel } = useQuery({
    queryKey: ['delivery_routes'],
    queryFn: deliveriesApi.getDeliveryRoutes,
    enabled: isDriver,
  })

  const stats = useMemo(() => {
    if (isDriver) {
      const myDeliveries = deliveries.filter((r: any) => r.driver_id === user?.id)
      return {
        total: myDeliveries.length,
        pending: myDeliveries.filter((l: any) => l.status === 'pending').length,
        dispatched: myDeliveries.filter((l: any) => l.status === 'in_progress').length,
        completed: myDeliveries.filter((l: any) => l.status === 'completed').length,
      }
    }
    return {
      total: operations.length,
      pending: operations.filter(l => l.status === 'pending').length,
      dispatched: operations.filter(l => l.status === 'dispatched').length,
      completed: operations.filter(l => l.status === 'completed').length,
    }
  }, [operations, deliveries, isDriver, user?.id])

  const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
    pending: { label: 'Pendente', variant: 'warning' },
    in_progress: { label: 'Conferindo', variant: 'default' },
    dispatched: { label: 'Em Rota', variant: 'warning' },
    completed: { label: 'Finalizada', variant: 'success' },
  }

  if (isLoadingOp || isLoadingDel) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral das operações logísticas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total" value={stats.total} icon={Truck} gradient="from-indigo-500/20 to-purple-500/20" iconColor="text-indigo-400" link="/cargas" />
        <StatsCard title="Pendente" value={stats.pending} icon={Clock} gradient="from-amber-500/20 to-orange-500/20" iconColor="text-amber-400" link="/cargas?status=pending" />
        <StatsCard title="Em rota" value={stats.dispatched} icon={PackageCheck} gradient="from-violet-500/20 to-fuchsia-500/20" iconColor="text-violet-400" link="/cargas?status=dispatched" />
        <StatsCard title="Finalizado" value={stats.completed} icon={CheckCircle2} gradient="from-emerald-500/20 to-teal-500/20" iconColor="text-emerald-400" link="/cargas?status=completed" />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isDriver ? 'Entregas Recentes' : 'Operações Recentes'}
          </h2>
          <Link to={isDriver ? "/entregas" : "/cargas"} className="text-sm text-primary hover:text-primary/80 transition-colors">
            Ver todas →
          </Link>
        </div>

        <div className="space-y-2">
          {isDriver ? (
            deliveries.filter((r: any) => r.driver_id === user?.id).length === 0 ? (
              <div className="glass-card text-center py-12">
                <p className="text-muted-foreground">Nenhuma rota de entrega disponível no momento.</p>
              </div>
            ) : (
              deliveries.filter((r: any) => r.driver_id === user?.id).slice(0, 5).map((route: any, index: number) => (
                <Link key={route.id} to={`/entregas/${route.id}`} className="block group">
                  <div className="glass-card glass-card-hover p-4 flex items-center justify-between transition-all duration-200" style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">{route.operation?.load_number || 'Rota Sem Nome'}</span>
                        <Badge variant={statusConfig[route.status]?.variant || 'default'}>
                          {statusConfig[route.status]?.label || route.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 shrink-0 text-primary" /> Rota de Entrega
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Link>
              ))
            )
          ) : (
            operations.length === 0 ? (
              <div className="glass-card text-center py-12">
                <p className="text-muted-foreground">Nenhuma operação registrada no banco de dados.</p>
              </div>
            ) : (
              operations.slice(0, 5).map((op, index) => (
              <Link key={op.id} to={['LOAD', 'RECEIPT', 'BLIND_RECEIPT'].includes(op.type) ? `/conferencia/${op.id}` : `/inventario`} className="block group">
                <div className="glass-card glass-card-hover p-4 flex items-center justify-between transition-all duration-200" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{op.load_number}</span>
                      <Badge variant={statusConfig[op.status]?.variant || 'default'}>
                        {statusConfig[op.status]?.label || op.status}
                      </Badge>
                      {op.type === 'INVENTORY' && <Badge variant="secondary">Inventário</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{op.client_name}</p>
                    {op.driver_name && (
                      <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs text-muted-foreground/70">
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {op.vehicle_plate}</span>
                        <span>{op.driver_name}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))
          )
        )}
      </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, gradient, iconColor, link }: any) {
  return (
    <Link to={link}>
      <div className={`glass-card glass-card-hover p-4 h-24 flex flex-col justify-between bg-gradient-to-br ${gradient} cursor-pointer`}>
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className="text-3xl font-bold text-foreground">{value}</span>
      </div>
    </Link>
  )
}
