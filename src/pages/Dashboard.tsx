import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  TrendingUp,
  ScanLine,
  BarChart3,
} from 'lucide-react'

export default function Dashboard() {
  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: operationsApi.getOperations,
  })

  // We should theoretically load items for productivity stats, but for the dashboard
  // we'll just mock the totalScanned / totalExpected until we have a real analytics endpoint.
  // Or we can fetch all items if needed. For now, let's keep it static to avoid massive overfetching.
  const totalScanned = 120
  const totalExpected = 150

  const stats = useMemo(() => ({
    total: operations.length,
    pending: operations.filter(l => l.status === 'pending').length,
    in_progress: operations.filter(l => l.status === 'in_progress').length,
    completed: operations.filter(l => l.status === 'completed').length,
  }), [operations])

  const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
    pending: { label: 'Pendente', variant: 'warning' },
    in_progress: { label: 'Conferindo', variant: 'default' },
    completed: { label: 'Finalizada', variant: 'success' },
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral das operações logísticas</p>
        </div>
        <Link to="/nova-carga">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Carga
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total" value={stats.total} icon={Truck} gradient="from-indigo-500/20 to-purple-500/20" iconColor="text-indigo-400" link="/cargas" />
        <StatsCard title="Pendente" value={stats.pending} icon={Clock} gradient="from-amber-500/20 to-orange-500/20" iconColor="text-amber-400" link="/cargas?status=pending" />
        <StatsCard title="Em rota" value={stats.in_progress} icon={PackageCheck} gradient="from-violet-500/20 to-fuchsia-500/20" iconColor="text-violet-400" link="/cargas?status=in_progress" />
        <StatsCard title="Finalizado" value={stats.completed} icon={CheckCircle2} gradient="from-emerald-500/20 to-teal-500/20" iconColor="text-emerald-400" link="/cargas?status=completed" />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Produtividade do Dia (Exemplo)</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">+12%</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Itens bipados hoje</span>
                <span className="font-bold text-foreground">{totalScanned} / {totalExpected}</span>
              </div>
              <Progress value={totalScanned} max={totalExpected} />
            </div>
            <div className="flex items-center gap-2 glass-card px-4 py-2">
              <ScanLine className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-bold text-foreground">
                {Math.round((totalScanned / Math.max(totalExpected, 1)) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Operações Recentes</h2>
          <Link to="/cargas" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Ver todas →
          </Link>
        </div>

        <div className="space-y-2">
          {operations.length === 0 ? (
            <div className="glass-card text-center py-12">
              <p className="text-muted-foreground">Nenhuma operação registrada no banco de dados.</p>
            </div>
          ) : (
            operations.slice(0, 5).map((op, index) => (
              <Link key={op.id} to={op.type === 'LOAD' ? `/conferencia/${op.id}` : `/inventario`} className="block group">
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
