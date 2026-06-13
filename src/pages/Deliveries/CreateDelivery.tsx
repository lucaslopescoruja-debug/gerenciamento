import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { operationsApi } from '@/api/operations'
import { usersApi } from '@/api/users'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Truck, CheckCircle2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function CreateDelivery() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'

  const [operationId, setOperationId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [helperId, setHelperId] = useState('')

  const { data: operations = [] } = useQuery({
    queryKey: ['operations'],
    queryFn: operationsApi.getOperations,
  })

  // We only want 'motorista' users for the driver selection
  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  })
  
  const drivers = usersList.filter(u => u.role === 'motorista' && u.active)
  const helpers = usersList.filter(u => ['ajudante', 'motorista', 'conferente'].includes(u.role) && u.active)
  
  // Only show operations that are not completely cancelled. Usually you deliver something that is dispatched or completed in the warehouse.
  const availableOperations = operations.filter(o => o.status !== 'cancelled')

  const createMutation = useMutation({
    mutationFn: () => deliveriesApi.createDeliveryRoute(operationId, driverId, helperId || undefined),
    onSuccess: (data) => {
      toast.success('Rota de Entrega criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      navigate(`/entregas/${data.id}`) // go straight to route clients page to add clients
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!operationId || !driverId) {
      toast.error('Selecione uma Carga e um Motorista.')
      return
    }
    createMutation.mutate()
  }

  if (!isManager) {
    return <Navigate to="/entregas" replace />
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto slide-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Nova Rota de Entrega</h1>
          <p className="text-sm text-muted-foreground">Vincule uma carga a um motorista</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Seleção de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Carga (Rota Originária)</Label>
              <select 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={operationId}
                onChange={e => setOperationId(e.target.value)}
              >
                <option value="">Selecione a carga...</option>
                {availableOperations.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.load_number} - {op.status === 'dispatched' ? 'Em Rota' : op.status === 'completed' ? 'Carga Finalizada' : 'Carregando'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Motorista Responsável</Label>
              <select 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={driverId}
                onChange={e => setDriverId(e.target.value)}
              >
                <option value="">Selecione o motorista...</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.username})
                  </option>
                ))}
              </select>
              {drivers.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400 mt-1">Nenhum motorista cadastrado no sistema.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ajudante (Opcional)</Label>
              <select 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={helperId}
                onChange={e => setHelperId(e.target.value)}
              >
                <option value="">Selecione o ajudante...</option>
                {helpers.map(helper => (
                  <option key={helper.id} value={helper.id}>
                    {helper.name} ({helper.username})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
          <Truck className="h-5 w-5 mr-2" />
          {createMutation.isPending ? 'Criando...' : 'Criar Rota de Entrega'}
        </Button>
      </form>
    </div>
  )
}
