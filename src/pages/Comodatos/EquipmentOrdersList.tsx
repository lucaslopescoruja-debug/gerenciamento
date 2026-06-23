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
import { Plus, Search, ClipboardList, CheckCircle2, Truck, Wrench, ArrowRightLeft, PenTool, FileText } from 'lucide-react'
import type { EquipmentOrder } from '@/types/database'
import { ExecutionModal } from './ExecutionModal'
import { generateContractPDF } from '@/utils/pdf'

export default function EquipmentOrdersList() {
  const queryClient = useQueryClient()
  const { hasPermission, user, company } = useAuth()
  const canManage = hasPermission('can_manage_os') && user?.role !== 'mecanico'

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Execution Modal
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false)
  const [executingOrder, setExecutingOrder] = useState<EquipmentOrder | null>(null)

  // Details Modal (Read-Only)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [detailsOrder, setDetailsOrder] = useState<EquipmentOrder | null>(null)
  
  const { data: detailsSupplies = [] } = useQuery({
    queryKey: ['order_supplies', detailsOrder?.id],
    queryFn: () => equipmentsApi.getOrderSupplies(detailsOrder!.id),
    enabled: isDetailsModalOpen && !!detailsOrder
  })

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
    queryFn: () => usersApi.getUsers(company?.id),
    enabled: !!company?.id,
  })

  // Filter available equipments for delivery, or customer equipments for collection/maintenance
  const availableEquipments = equipmentsList.filter(e => type === 'entrega' ? e.status === 'Disponível' : (e.current_customer_id === customerId))
  const mechanicsAndDrivers = usersList.filter(u => ['mecanico', 'motorista', 'ajudante'].includes(u.role))

  const [editingId, setEditingId] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Partial<EquipmentOrder>) => equipmentsApi.createOrder(data),
    onSuccess: () => {
      toast.success('Ordem de Serviço criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipment_orders'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EquipmentOrder>) => equipmentsApi.updateOrder(editingId!, data),
    onSuccess: () => {
      toast.success('Ordem de Serviço atualizada!')
      queryClient.invalidateQueries({ queryKey: ['equipment_orders'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: equipmentsApi.deleteOrder,
    onSuccess: () => {
      toast.success('Ordem de Serviço excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipment_orders'] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !equipmentId || !type) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const payload = {
      customer_id: customerId, 
      equipment_id: equipmentId, 
      type, 
      driver_id: driverId || null,
      scheduled_date: scheduledDate || null,
      notes 
    }

    if (editingId) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const openNew = () => {
    setEditingId(null)
    setType('entrega')
    setCustomerId('')
    setEquipmentId('')
    setDriverId('')
    setScheduledDate('')
    setNotes('')
    setIsModalOpen(true)
  }

  const openEdit = (order: EquipmentOrder) => {
    setEditingId(order.id)
    setType(order.type)
    setCustomerId(order.customer_id || '')
    setEquipmentId(order.equipment_id)
    setDriverId(order.driver_id || '')
    setScheduledDate(order.scheduled_date || '')
    setNotes(order.notes || '')
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta OS? A exclusão é permanente.')) {
      deleteMutation.mutate(id)
    }
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
    o.driver?.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.os_number && String(o.os_number).includes(search))
  )

  const statusOrder: Record<string, number> = {
    'pendente': 1,
    'em_rota': 2,
    'concluido': 3,
    'cancelado': 4
  }

  const sortedOrders = [...filtered].sort((a, b) => {
    const sA = statusOrder[a.status] || 99
    const sB = statusOrder[b.status] || 99
    if (sA !== sB) return sA - sB
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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
        {sortedOrders.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <div className="p-3 bg-muted rounded-full">
                  {getTypeIcon(order.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg">#{order.os_number || '---'}</span>
                    <span className="font-bold uppercase text-sm tracking-wide text-muted-foreground">{order.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.status === 'concluido' ? 'bg-green-100 text-green-700' :
                      order.status === 'em_rota' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  {(() => {
                    const legalName = order.customer?.legal_name || order.customer?.nickname || order.customer?.fantasy_name;
                    const fantasyName = order.customer?.fantasy_name;
                    const showFantasy = fantasyName && legalName && fantasyName !== legalName;
                    return (
                      <>
                        <div className="font-bold text-lg">{legalName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 mb-2">
                          {showFantasy ? `${fantasyName} - ` : ''}
                          {order.customer?.document || 'Sem documento'}
                        </div>
                      </>
                    )
                  })()}
                  <div className="text-sm text-muted-foreground">
                    Equipamento: <strong>{order.equipment?.patrimony}</strong> ({order.equipment?.type} {order.equipment?.model})
                  </div>
                  {order.driver && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Responsável: {order.driver.name} | Agendado: {order.scheduled_date ? new Date(order.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {canManage && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => openEdit(order)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none text-red-500 hover:text-red-700" onClick={() => handleDelete(order.id)}>
                      Excluir
                    </Button>
                  </>
                )}
                {order.status !== 'concluido' && order.status !== 'cancelado' && (
                  <Button 
                    size="sm" 
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={() => {
                      setExecutingOrder(order)
                      setIsExecutionModalOpen(true)
                    }}
                  >
                    <PenTool className="h-4 w-4 mr-2" /> Executar OS
                  </Button>
                )}
                {order.status === 'concluido' && (
                  <>
                    {(order.type === 'entrega' || order.type === 'troca' || order.type === 'recolha') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 md:flex-none text-blue-600 border-blue-200 hover:bg-blue-50" 
                        onClick={async () => {
                          try {
                            await generateContractPDF(order, company)
                          } catch (err: any) {
                            toast.error(err.message || 'Erro ao gerar PDF')
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Baixar Contrato
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => {
                      setDetailsOrder(order)
                      setIsDetailsModalOpen(true)
                    }}>
                      Ver Detalhes
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedOrders.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
            Nenhuma OS encontrada.
          </div>
        )}
      </div>

      <ExecutionModal 
        isOpen={isExecutionModalOpen}
        onClose={() => {
          setIsExecutionModalOpen(false)
          setExecutingOrder(null)
        }}
        order={executingOrder}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
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
                    <option key={c.id} value={c.id}>{c.legal_name || c.fantasy_name} ({c.document})</option>
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

      {/* ReadOnly Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da OS #{detailsOrder?.os_number}</DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground font-bold">Cliente</div>
                  <div>{detailsOrder.customer?.legal_name || detailsOrder.customer?.fantasy_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-bold">Equipamento Original</div>
                  <div>{detailsOrder.equipment?.patrimony} - {detailsOrder.equipment?.model}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-bold">Tipo da OS</div>
                  <div className="uppercase">{detailsOrder.type}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-bold">Data de Conclusão</div>
                  <div>{detailsOrder.completed_at ? new Date(detailsOrder.completed_at).toLocaleString('pt-BR') : '---'}</div>
                </div>
              </div>

              {detailsOrder.defect_description && (
                <div>
                  <h3 className="font-bold text-sm border-b pb-1 mb-2">Defeito Relatado</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailsOrder.defect_description}</p>
                </div>
              )}

              {detailsOrder.solution_description && (
                <div>
                  <h3 className="font-bold text-sm border-b pb-1 mb-2">Solução Aplicada / Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailsOrder.solution_description}</p>
                </div>
              )}

              {detailsOrder.action_taken && (
                <div>
                  <h3 className="font-bold text-sm border-b pb-1 mb-2">Ação Tomada</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailsOrder.action_taken}</p>
                </div>
              )}

              {detailsSupplies.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm border-b pb-1 mb-2">Insumos e Peças Consumidas</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {detailsSupplies.map(s => (
                      <li key={s.id}>{s.quantity_consumed} {s.supply?.unit} - {s.supply?.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detailsOrder.signature_data && (
                <div>
                  <h3 className="font-bold text-sm border-b pb-1 mb-2">Assinatura ({detailsOrder.receiver_name} - {detailsOrder.receiver_doc})</h3>
                  <img src={detailsOrder.signature_data} alt="Assinatura" className="max-h-32 border bg-white rounded" />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-row justify-between items-center sm:justify-between">
            {detailsOrder && (detailsOrder.type === 'entrega' || detailsOrder.type === 'troca' || detailsOrder.type === 'recolha') ? (
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-200 hover:bg-blue-50" 
                onClick={async () => {
                  try {
                    await generateContractPDF(detailsOrder, company)
                  } catch (err: any) {
                    toast.error(err.message || 'Erro ao gerar PDF')
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar Contrato
              </Button>
            ) : <div />}
            <Button onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
