import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentsApi } from '@/api/equipments'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Box, Edit2, History, AlertCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import type { Equipment } from '@/types/database'

export default function EquipmentsList() {
  const queryClient = useQueryClient()
  const { hasPermission, user } = useAuth()
  const canManage = hasPermission('can_manage_equipments') && user?.role !== 'mecanico'

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyEquipment, setHistoryEquipment] = useState<Equipment | null>(null)

  const [sortField, setSortField] = useState<'patrimony' | 'model' | 'status' | 'customer'>('patrimony')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form
  const [patrimony, setPatrimony] = useState('')
  const [type, setType] = useState('Freezer')
  const [model, setModel] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState<'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente'>('Disponível')
  const [currentCustomerId, setCurrentCustomerId] = useState('')

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers
  })

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentsApi.createEquipment(data),
    onSuccess: () => {
      toast.success('Equipamento cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentsApi.updateEquipment(editing!.id, data, 'Status Alterado Manualmente'),
    onSuccess: () => {
      toast.success('Equipamento atualizado!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: equipmentsApi.deleteEquipment,
    onSuccess: () => {
      toast.success('Equipamento excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja apagar este equipamento? O histórico e as ordens de serviço vinculadas a ele também poderão ser afetadas.')) {
      deleteMutation.mutate(id)
    }
  }

  const { data: equipmentHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['equipment_history', historyEquipment?.id],
    queryFn: () => equipmentsApi.getEquipmentHistory(historyEquipment!.id),
    enabled: !!historyEquipment && isHistoryModalOpen
  })

  const openHistory = (eq: Equipment) => {
    setHistoryEquipment(eq)
    setIsHistoryModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patrimony || !type || !model) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    if (editing) {
      updateMutation.mutate({ patrimony, type, model, size, status, current_customer_id: status === 'No Cliente' ? currentCustomerId : null })
    } else {
      createMutation.mutate({ patrimony, type, model, size, status, current_customer_id: status === 'No Cliente' ? currentCustomerId : null })
    }
  }

  const openNew = () => {
    setEditing(null)
    setPatrimony('')
    setType('Freezer')
    setModel('')
    setSize('')
    setStatus('Disponível')
    setIsModalOpen(true)
  }

  const openEdit = (eq: Equipment) => {
    setEditing(eq)
    setPatrimony(eq.patrimony)
    setType(eq.type)
    setModel(eq.model)
    setSize(eq.size || '')
    setStatus(eq.status as any)
    setCurrentCustomerId(eq.current_customer_id || '')
    setIsModalOpen(true)
  }

  const handleSort = (field: 'patrimony' | 'model' | 'status' | 'customer') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
  }

  const filtered = equipments
    .filter(eq => 
      eq.patrimony.toLowerCase().includes(search.toLowerCase()) ||
      eq.model.toLowerCase().includes(search.toLowerCase()) ||
      eq.customer?.fantasy_name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = ''
      let bVal = ''
      
      if (sortField === 'patrimony') {
        aVal = a.patrimony
        bVal = b.patrimony
      } else if (sortField === 'model') {
        aVal = `${a.type} ${a.model}`
        bVal = `${b.type} ${b.model}`
      } else if (sortField === 'status') {
        aVal = a.status
        bVal = b.status
      } else if (sortField === 'customer') {
        aVal = a.customer?.fantasy_name || a.customer?.legal_name || ''
        bVal = b.customer?.fantasy_name || b.customer?.legal_name || ''
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  if (!canManage) {
    return <div className="p-8 text-center text-muted-foreground">Você não tem permissão para acessar esta página.</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Box className="h-6 w-6 text-primary" /> Ativos e Equipamentos
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de patrimônio e comodatos</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por patrimônio, modelo ou cliente..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('patrimony')}>
                  Nº Série / Patrimônio <SortIcon field="patrimony" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('model')}>
                  Marca / Modelo <SortIcon field="model" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('status')}>
                  Situação <SortIcon field="status" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('customer')}>
                  Cliente Atual <SortIcon field="customer" />
                </TableHead>
                {canManage && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(eq => (
                <TableRow key={eq.id}>
                  <TableCell className="font-mono text-xs">{eq.patrimony}</TableCell>
                  <TableCell>
                    <div className="font-bold">{eq.type} {eq.model}</div>
                    {eq.size && <div className="text-xs text-muted-foreground">{eq.size}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      eq.status === 'Disponível' ? 'bg-green-100 text-green-700' :
                      eq.status === 'No Cliente' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {eq.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {eq.customer ? (
                      <span className="font-medium text-sm">{eq.customer.fantasy_name || eq.customer.legal_name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(eq)} title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openHistory(eq)} title="Histórico">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(eq.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center text-muted-foreground">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº Patrimônio / Série *</Label>
                <Input value={patrimony} onChange={e => setPatrimony(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Freezer">Freezer</option>
                  <option value="Geladeira">Geladeira</option>
                  <option value="Lixeira">Lixeira</option>
                  <option value="Windbanner">Windbanner</option>
                  <option value="Expositor">Expositor</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca/Modelo *</Label>
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Ex: Metalfrio" required />
              </div>
              <div className="space-y-2">
                <Label>Tamanho / Litragem</Label>
                <Input value={size} onChange={e => setSize(e.target.value)} placeholder="Ex: 400L" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Situação / Status *</Label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Disponível">Disponível (No Galpão)</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Teste">Em Teste</option>
                <option value="Danificado">Danificado / Sucata</option>
                <option value="No Cliente">No Cliente</option>
              </select>
            </div>

            {status === 'No Cliente' && (
              <div className="space-y-2 col-span-2">
                <Label>Cliente Atual (Vínculo Manual)</Label>
                <select 
                  value={currentCustomerId} 
                  onChange={e => setCurrentCustomerId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {customersList.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.fantasy_name || c.legal_name} ({c.document})</option>
                  ))}
                </select>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico do Equipamento: {historyEquipment?.patrimony}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingHistory ? (
              <p className="text-center py-4">Carregando histórico...</p>
            ) : equipmentHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum histórico encontrado para este equipamento.</p>
            ) : (
              equipmentHistory.map(h => (
                <div key={h.id} className="border p-3 rounded bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm">{h.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {h.customer && <div className="text-sm bg-background p-2 rounded mb-2 border">Cliente: <span className="font-medium">{h.customer.fantasy_name || h.customer.legal_name}</span></div>}
                  {h.notes && <div className="text-sm mt-2 text-muted-foreground">{h.notes}</div>}
                  <div className="text-xs mt-2 text-primary font-medium">Por: {h.user?.name || 'Sistema'}</div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
