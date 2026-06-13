import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentsApi } from '@/api/equipments'
import { customersApi } from '@/api/customers'
import { usersApi } from '@/api/users'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Plus, Search, ClipboardList, CheckCircle2, Truck, Wrench, ArrowRightLeft } from 'lucide-react'
import { EquipmentOrder } from '@/types/database'
import { format } from 'date-fns'

export default function EquipmentOrdersList() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('can_manage_equipments')

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form
  const [type, setType] = useState<'entrega' | 'recolha' | 'troca' | 'manutencao'>('entrega')
  const [customerId, setCustomerId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState('')

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['equipment_orders'],
    queryFn: equipmentsApi.getOrders
  })

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers
  })

  const { data: equipmentsList = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments
  })

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers
  })

  // Filter available equipments for delivery, or customer equipments for collection/maintenance
  const availableEquipments = equipmentsList.filter(e => type === 'entrega' ? e.status === 'Disponível' : (e.current_customer_id === customerId))
  const mechanicsAndDrivers = usersList.filter(u => ['mecanico', 'motorista', 'ajudante'].includes(u.role))

  const createMutation = useMutation({
    mutationFn: (data: Partial<EquipmentOrder>) => equipmentsApi.createOrder(data),
    onSuccess: () => {
      toast.success('Ordem de Serviço criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipment_orders'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !equipmentId || !type) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    createMutation.mutate({ 
      customer_id: customerId, 
      equipment_id: equipmentId, 
      type, 
      driver_id: driverId || null,
      scheduled_date: scheduledDate || null,
      notes 
    })
  }

  const openNew = () => {
    setType('entrega')
    setCustomerId('')
    setEquipmentId('')
    setDriverId('')
    setScheduledDate('')
    setNotes('')
    setIsModalOpen(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entrega': return <Truck className="h-4 w-4 text-blue-500" />
      case 'recolha': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'troca': return <ArrowRightLeft className="h-4 w-4 text-purple-500" />
      case 'manutencao': return <Wrench className="h-4 w-4 text-amber-500" />
      default: return <ClipboardList className="h-4 w-4" />
    }
  }

  const filtered = orders.filter(o => 
    o.customer?.fantasy_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.equipment?.patrimony.toLowerCase().includes(search.toLowerCase()) ||
    o.driver?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> OS de Equipamentos
          </h1>
          <p className="text-sm text-muted-foreground">Ordens de serviço para motoristas e mecânicos</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova OS
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por cliente, patrimônio ou responsável..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <div className="p-3 bg-muted rounded-full">
                  {getTypeIcon(order.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-sm tracking-wide">{order.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.status === 'concluido' ? 'bg-green-100 text-green-700' :
                      order.status === 'em_rota' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="font-bold text-lg">{order.customer?.fantasy_name || order.customer?.legal_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Equipamento: <strong>{order.equipment?.patrimony}</strong> ({order.equipment?.type} {order.equipment?.model})
                  </div>
                  {order.driver && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Responsável: {order.driver.name} | Agendado: {order.scheduled_date ? format(new Date(order.scheduled_date + 'T00:00:00'), 'dd/MM/yyyy') : 'Sem data'}
                    </div>
                  )}
                </div>
              </div>
              
              {canManage && order.status !== 'concluido' && order.status !== 'cancelado' && (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="w-full md:w-auto">
                    Editar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !isLoadingOrders && (
          <div className="text-center p-8 text-muted-foreground">Nenhuma OS encontrada.</div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço de Comodato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de OS *</Label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="entrega">Entrega de Comodato</option>
                  <option value="recolha">Recolha de Comodato</option>
                  <option value="troca">Troca de Equipamento</option>
                  <option value="manutencao">Manutenção no Local</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <select 
                  value={customerId} 
                  onChange={e => setCustomerId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {customersList.map(c => (
                    <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name} ({c.document})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Equipamento *</Label>
              <select 
                value={equipmentId} 
                onChange={e => setEquipmentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={!customerId && type !== 'entrega'}
              >
                <option value="">Selecione o equipamento...</option>
                {availableEquipments.map(e => (
                  <option key={e.id} value={e.id}>{e.patrimony} - {e.type} {e.model} ({e.status})</option>
                ))}
              </select>
              {type !== 'entrega' && !customerId && (
                <p className="text-xs text-amber-600">Selecione o cliente primeiro para ver os equipamentos dele.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável (Opcional)</Label>
                <select 
                  value={driverId} 
                  onChange={e => setDriverId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione o motorista/mecânico...</option>
                  {mechanicsAndDrivers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Data Agendada (Opcional)</Label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações da OS</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Detalhes sobre a entrega, defeito do equipamento, etc..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Gerar OS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
