import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Truck,
  ChevronRight,
  Plus,
  Clock,
  PackageCheck,
  CheckCircle2,
  Trash2,
  MapPin,
  FileSignature,
  Bell
} from 'lucide-react'
import type { DeliveryRoute } from '@/types/database'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success'; icon: typeof Clock }> = {
  pending: { label: 'Aguardando', variant: 'warning', icon: Clock },
  in_progress: { label: 'Em Entrega', variant: 'default', icon: PackageCheck },
  completed: { label: 'Concluído', variant: 'success', icon: CheckCircle2 },
}

export default function DeliveriesList() {
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const queryClient = useQueryClient()

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['delivery_routes'],
    queryFn: deliveriesApi.getDeliveryRoutes,
  })

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: deliveriesApi.getPendingApprovals,
    refetchInterval: 10000, // refresh every 10 seconds
    enabled: isManager,
  })

  const deleteMutation = useMutation({
    mutationFn: deliveriesApi.deleteDeliveryRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      toast.success('Entrega excluída com sucesso')
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`)
    }
  })

  // Motorista ou Ajudante só vê as rotas deles. Gestor vê tudo.
  const filteredRoutes = useMemo(() => {
    if (isManager) return routes
    return routes.filter((r: any) => r.driver_id === user?.id || r.helper_id === user?.id)
  }, [routes, isManager, user?.id])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando rotas de entrega...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Entregas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredRoutes.length} rotas de entrega encontradas
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Link to="/historico">
              <Button variant="outline" className="gap-2 w-full sm:w-auto h-12 sm:h-10 text-lg sm:text-sm">
                <FileSignature className="h-5 w-5 sm:h-4 sm:w-4" /> Comprovantes
              </Button>
            </Link>
            <Link to="/entregas/nova">
              <Button className="gap-2 w-full sm:w-auto h-12 sm:h-10 text-lg sm:text-sm">
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" /> Criar Rota
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredRoutes.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma rota de entrega disponível</p>
          </div>
        ) : (
          filteredRoutes.map((route: any, index: number) => {
            const config = statusConfig[route.status] || statusConfig.pending
            return (
              <Link key={route.id} to={`/entregas/${route.id}`} className="block group">
                <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all glass-card cursor-pointer slide-up" style={{ animationDelay: `${index * 60}ms` }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      route.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                      route.status === 'in_progress' ? 'bg-violet-500/15 text-violet-400' :
                      'bg-amber-500/15 text-amber-400'
                    }`}>
                      {config && <config.icon className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-lg truncate">
                          {route.operation?.load_number || 'Rota Sem Nome'}
                        </span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Truck className="h-4 w-4" /> {route.driver?.name || 'Sem Motorista'}
                          {route.helper?.name && ` | Ajudante: ${route.helper.name}`}
                        </span>
                      </div>
                    </div>

                    {isManager && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 h-10 w-10 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 z-10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (window.confirm('Tem certeza que deseja APAGAR esta rota de entrega definitivamente?')) {
                            deleteMutation.mutate(route.id)
                          }
                        }}
                        title="Apagar Rota de Entrega"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                    
                    <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
