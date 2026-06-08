import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { usersApi } from '@/api/users'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  Bell,
  Pencil,
  CalendarDays
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

  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editDriver, setEditDriver] = useState('')
  const [editHelper, setEditHelper] = useState('')

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['delivery_routes'],
    queryFn: deliveriesApi.getDeliveryRoutes,
  })

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: deliveriesApi.getPendingApprovals,
    refetchInterval: 60000,
    enabled: isManager,
  })

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isManager,
  })
  
  const drivers = usersList.filter((u: any) => u.role === 'motorista' && u.active)
  const helpers = usersList.filter((u: any) => u.role === 'ajudante' && u.active)

  const deleteMutation = useMutation({
    mutationFn: deliveriesApi.deleteDeliveryRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      toast({ title: 'Entrega excluída com sucesso', variant: 'default' })
    },
    onError: (error: any) => {
      toast({ title: `Erro ao excluir: ${error.message}`, variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<DeliveryRoute> }) => {
      return await deliveriesApi.updateDeliveryRoute(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      toast({ title: 'Rota atualizada com sucesso' })
      setEditingRoute(null)
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar rota', description: err.message, variant: 'destructive' })
    }
  })

  const handleEdit = (e: React.MouseEvent, route: DeliveryRoute) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingRoute(route)
    setEditTitle(route.title || '')
    setEditDate(route.scheduled_date || '')
    setEditDriver(route.driver_id || '')
    setEditHelper(route.helper_id || '')
  }

  const saveEdit = () => {
    if (!editingRoute) return
    updateMutation.mutate({
      id: editingRoute.id,
      updates: {
        title: editTitle || undefined,
        scheduled_date: editDate || undefined,
        driver_id: editDriver,
        helper_id: editHelper || undefined
      }
    })
  }

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
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        route.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        route.status === 'in_progress' ? 'bg-violet-500/15 text-violet-400' :
                        'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}>
                        {config && <config.icon className="h-6 w-6" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-foreground text-lg truncate">
                            {route.title || route.operation?.load_number || 'Rota Sem Nome'}
                          </span>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Truck className="h-4 w-4" /> {route.driver?.name || 'Sem Motorista'}
                            {route.helper?.name && ` | Ajudante: ${route.helper.name}`}
                          </span>
                          {route.scheduled_date && (
                            <span className="flex items-center gap-1 font-medium bg-muted/50 px-2 rounded">
                              <CalendarDays className="h-3.5 w-3.5 text-primary" />
                              {new Date(route.scheduled_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 mt-2 sm:mt-0">
                      {isManager && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 z-10"
                            onClick={(e) => handleEdit(e, route)}
                            title="Editar Rota"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
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
                        </>
                      )}
                      
                      <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      <Dialog open={!!editingRoute} onOpenChange={(open) => !open && setEditingRoute(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle>Editar Rota de Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título Personalizado (Opcional)</Label>
              <Input 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Ex: Rota Zona Sul"
              />
              <p className="text-xs text-muted-foreground">Se vazio, usará o número da carga.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Data Prevista (Opcional)</Label>
              <Input 
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Motorista Responsável</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editDriver}
                onChange={e => setEditDriver(e.target.value)}
              >
                <option value="">Selecione o motorista...</option>
                {drivers.map((driver: any) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Ajudante (Opcional)</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editHelper}
                onChange={e => setEditHelper(e.target.value)}
              >
                <option value="">Nenhum ajudante</option>
                {helpers.map((helper: any) => (
                  <option key={helper.id} value={helper.id}>
                    {helper.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setEditingRoute(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={!editDriver || updateMutation.isPending} className="ml-2">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
