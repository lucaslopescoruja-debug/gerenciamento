import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, History, CheckCircle, Clock, Save, Copy, FileText, Settings, Settings2, ShieldCheck, MapPin, X, Box, AlertCircle, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Equipment } from '@/types/database'

import { InternalMaintenanceModal } from './InternalMaintenanceModal'

export default function EquipmentsList() {
  const queryClient = useQueryClient()
  const { hasPermission, user, isMaster } = useAuth()
  const hasAccess = hasPermission('can_manage_equipments')
  const canEdit = user?.role === 'admin' || user?.role === 'gestor' || isMaster

  const [showFilters, setShowFilters] = useState(() => {
    return sessionStorage.getItem('equipmentsShowFilters') === 'true'
  })

  const defaultFilters = {
    patrimonio: '',
    patrimonioType: 'contains',
    modelo: '',
    modeloType: 'contains',
    cliente: '',
    clienteType: 'contains',
    status: 'Todos',
    voltagem: 'Todos',
    tipo: 'Todos'
  }

  type FiltersType = typeof defaultFilters

  const [filters, setFilters] = useState<FiltersType>(() => {
    const saved = sessionStorage.getItem('equipmentsFilters')
    if (saved) {
      try { 
        return { ...defaultFilters, ...JSON.parse(saved) } 
      } catch (e) {}
    }
    return defaultFilters
  })

  const [sortField, setSortField] = useState<'patrimony' | 'model' | 'status' | 'customer'>('patrimony')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    sessionStorage.setItem('equipmentsFilters', JSON.stringify(filters))
    setCurrentPage(1)
  }, [filters, sortField, sortOrder])

  useEffect(() => {
    sessionStorage.setItem('equipmentsShowFilters', showFilters.toString())
  }, [showFilters])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyEquipment, setHistoryEquipment] = useState<Equipment | null>(null)
  const [historyTab, setHistoryTab] = useState<'movimentacoes' | 'os'>('movimentacoes')

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null)


  // Form
  const [patrimony, setPatrimony] = useState('')
  const [type, setType] = useState('Freezer Vertical')
  const [model, setModel] = useState('')
  const [size, setSize] = useState('')
  const [voltage, setVoltage] = useState<'127v' | '220v' | 'Bivolt' | ''>('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente' | 'Equipamento de Estoque'>('Disponível')
  const [currentCustomerId, setCurrentCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers
  })

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments
  })

  useEffect(() => {
    if (customerSearch.trim().length > 0) {
      const term = customerSearch.toLowerCase()
      const filtered = customersList.filter((c: any) => 
        (c.fantasy_name && c.fantasy_name.toLowerCase().includes(term)) ||
        (c.legal_name && c.legal_name.toLowerCase().includes(term)) ||
        (c.document && c.document.includes(term))
      ).slice(0, 10)
      setFilteredCustomers(filtered)
      setShowCustomerDropdown(true)
    } else {
      setFilteredCustomers([])
      setShowCustomerDropdown(false)
    }
  }, [customerSearch, customersList])

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

  const { data: equipmentOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['equipment_orders', historyEquipment?.id],
    queryFn: () => equipmentsApi.getEquipmentOrders(historyEquipment!.id),
    enabled: !!historyEquipment && isHistoryModalOpen
  })

  const openHistory = (eq: Equipment) => {
    setHistoryEquipment(eq)
    setIsHistoryModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patrimony || !type || !model || !voltage) {
      toast.error('Preencha os campos obrigatórios (Patrimônio, Tipo, Modelo e Voltagem)')
      return
    }

    const isDuplicate = equipments.some(eq => 
      eq.patrimony.toLowerCase().trim() === patrimony.toLowerCase().trim() && eq.id !== editing?.id
    )

    if (isDuplicate) {
      toast.error('Equipamento já cadastrado com este Nº de Patrimônio/Série.')
      return
    }

    if (editing) {
      updateMutation.mutate({ patrimony: patrimony.trim(), type, model, size, voltage, notes, status, current_customer_id: status === 'No Cliente' ? currentCustomerId : null })
    } else {
      createMutation.mutate({ patrimony: patrimony.trim(), type, model, size, voltage, notes, status, current_customer_id: status === 'No Cliente' ? currentCustomerId : null })
    }
  }

  const openNew = () => {
    setEditing(null)
    setPatrimony('')
    setType('Freezer Vertical')
    setModel('')
    setSize('')
    setVoltage('')
    setNotes('')
    setStatus('Disponível')
    setCurrentCustomerId('')
    setCustomerSearch('')
    setIsModalOpen(true)
  }

  const openEdit = (eq: Equipment) => {
    setEditing(eq)
    setPatrimony(eq.patrimony)
    setType(eq.type)
    setModel(eq.model)
    setSize(eq.size || '')
    setVoltage(eq.voltage as any || '')
    setNotes(eq.notes || '')
    setStatus(eq.status as any)
    setCurrentCustomerId(eq.current_customer_id || '')
    setCustomerSearch(eq.customer ? (eq.customer.legal_name || eq.customer.fantasy_name || '') : '')
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

  const applyFilter = (value: string, filterValue: string, type: string) => {
    if (!filterValue) return true
    const val = (value || '').toLowerCase()
    const filterVal = filterValue.toLowerCase()
    if (type === 'equals') return val === filterVal
    if (type === 'startsWith') return val.startsWith(filterVal)
    return val.includes(filterVal)
  }

  const filtered = equipments
    .filter(eq => 
      applyFilter(eq.patrimony, filters.patrimonio, filters.patrimonioType) &&
      applyFilter(`${eq.type} ${eq.model} ${eq.size || ''}`, filters.modelo, filters.modeloType) &&
      applyFilter(eq.customer?.fantasy_name || eq.customer?.legal_name || '', filters.cliente, filters.clienteType) &&
      (filters.status === 'Todos' || eq.status === filters.status) &&
      (filters.voltagem === 'Todos' || eq.voltage === filters.voltagem) &&
      (filters.tipo === 'Todos' || eq.type === filters.tipo)
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
        aVal = a.customer?.legal_name || a.customer?.fantasy_name || ''
        bVal = b.customer?.legal_name || b.customer?.fantasy_name || ''
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (!hasAccess) {
    return <div className="p-8 text-center text-muted-foreground">Você não tem permissão para acessar esta página.</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Box className="h-6 w-6 text-primary" /> Ativos e Equipamentos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie o parque de equipamentos em comodato</p>
        </div>
        {hasAccess && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        )}
      </div>

      {/* Painel de Filtros */}
      <div className="glass-card relative z-50">
        <div 
          className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-xl"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4 text-primary" />
            Filtros Avançados
          </div>
          {showFilters ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </div>
        
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
            
            {/* Patrimônio */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Patrimônio / Série</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.patrimonioType}
                    onChange={(e) => setFilters(f => ({ ...f, patrimonioType: e.target.value }))}
                  >
                    <option value="contains">Contém</option>
                    <option value="startsWith">Inicia com</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.patrimonio}
                    onChange={(e) => setFilters(f => ({ ...f, patrimonio: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Modelo */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Marca / Modelo / Tamanho</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.modeloType}
                    onChange={(e) => setFilters(f => ({ ...f, modeloType: e.target.value }))}
                  >
                    <option value="contains">Contém</option>
                    <option value="startsWith">Inicia com</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.modelo}
                    onChange={(e) => setFilters(f => ({ ...f, modelo: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Cliente Atual */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Cliente Atual</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.clienteType}
                    onChange={(e) => setFilters(f => ({ ...f, clienteType: e.target.value }))}
                  >
                    <option value="contains">Contém</option>
                    <option value="startsWith">Inicia com</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.cliente}
                    onChange={(e) => setFilters(f => ({ ...f, cliente: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Status e Voltagem */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Situação</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="Todos">Todos</option>
                  <option value="Teste">Em Teste</option>
                  <option value="Disponível">Disponível no Galpão</option>
                  <option value="Em Manutenção">Em Manutenção</option>
                  <option value="Danificado">Danificado / Sucata</option>
                  <option value="No Cliente">No Cliente</option>
                  <option value="Equipamento de Estoque">Equipamento de Estoque</option>
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Voltagem</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.voltagem}
                  onChange={(e) => setFilters(f => ({ ...f, voltagem: e.target.value }))}
                >
                  <option value="Todos">Todos</option>
                  <option value="127v">127v</option>
                  <option value="220v">220v</option>
                  <option value="Bivolt">Bivolt</option>
                </select>
              </div>
              
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Tipo</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={filters.tipo}
                  onChange={(e) => setFilters(f => ({ ...f, tipo: e.target.value }))}
                >
                  <option value="Todos">Todos</option>
                  <option value="Freezer Vertical">Freezer Vertical</option>
                  <option value="Freezer Horizontal">Freezer Horizontal</option>
                  <option value="Lixeira">Lixeira</option>
                  <option value="Windbanner">Windbanner</option>
                  <option value="Expositor">Expositor</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="col-span-full flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilters(defaultFilters)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/50">
        <div className="text-sm font-medium text-muted-foreground">
          {filtered.length} equipamento(s) encontrado(s)
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap hidden sm:block">Ordenar:</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-[200px]"
            value={sortField}
            onChange={e => {
              setSortField(e.target.value as any)
              setSortOrder('asc')
            }}
          >
            <option value="patrimony">Nº Série / Patrimônio</option>
            <option value="model">Marca / Modelo</option>
            <option value="status">Situação</option>
            <option value="customer">Cliente Atual</option>
          </select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} title="Inverter Ordem">
            {sortOrder === 'asc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] cursor-pointer whitespace-nowrap" onClick={() => handleSort('patrimony')}>
                  Nº Série <SortIcon field="patrimony" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('model')}>
                  Equipamento <SortIcon field="model" />
                </TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">
                  Especificações
                </TableHead>
                <TableHead className="w-[160px] cursor-pointer whitespace-nowrap" onClick={() => handleSort('status')}>
                  Situação <SortIcon field="status" />
                </TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('customer')}>
                  Cliente Atual <SortIcon field="customer" />
                </TableHead>
                <TableHead className="w-[140px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(eq => (
                <TableRow key={eq.id}>
                  <TableCell className="font-mono text-sm font-semibold text-muted-foreground">{eq.patrimony}</TableCell>
                  <TableCell>
                    <div className="font-bold text-base text-foreground">{eq.type} <span className="font-medium text-foreground/80">- {eq.model}</span></div>
                    {eq.notes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={eq.notes}>Obs: {eq.notes}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{eq.size || '-'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{eq.voltage || '-'}</div>
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
                      (() => {
                        const legalName = eq.customer.legal_name || eq.customer.nickname || eq.customer.fantasy_name;
                        const fantasyName = eq.customer.fantasy_name;
                        const showFantasy = fantasyName && legalName && fantasyName !== legalName;
                        return (
                          <div>
                            <div className="font-medium text-sm text-foreground">{legalName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {showFantasy ? `${fantasyName} - ` : ''}
                              {eq.customer.document || ''}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openHistory(eq)} title="Histórico">
                        <History className="h-4 w-4" />
                      </Button>
                      {canEdit ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(eq)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        eq.status !== 'No Cliente' && (
                          <Button variant="outline" size="sm" className="ml-2" onClick={() => {
                            setMaintenanceEquipment(eq)
                            setIsMaintenanceModalOpen(true)
                          }}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manutenção
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 p-4 border-t border-border/50 bg-muted/20 rounded-b-xl">
              <span className="text-sm text-muted-foreground">
                Exibindo itens {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                >
                  <span className="sr-only">Primeira</span>
                  <span className="text-xs font-bold">|&lt;</span>
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="px-3 text-sm font-medium">
                  {currentPage} de {totalPages || 1}
                </span>

                <Button 
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
                >
                  <span className="sr-only">Última</span>
                  <span className="text-xs font-bold">&gt;|</span>
                </Button>
              </div>
            </div>
          )}
      </Card>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum equipamento encontrado.
          </Card>
        ) : (
          paginated.map(eq => (
            <Card key={eq.id} className="p-4 space-y-4 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-foreground truncate">{eq.model} - {eq.type}</div>
                  {eq.size && <span className="text-sm text-foreground mt-0.5">{eq.size}</span>}
                  {eq.voltage && <span className="text-sm text-foreground mt-0.5 ml-2">({eq.voltage})</span>}
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">Patri.: {eq.patrimony}</div>
                  {eq.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">Obs: {eq.notes}</div>}
                </div>
                <Badge variant="outline" className={`whitespace-nowrap shrink-0 ${
                    eq.status === 'Disponível' ? 'bg-green-100 text-green-700 border-green-200' :
                    eq.status === 'No Cliente' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {eq.status}
                </Badge>
              </div>
              
              {eq.customer && (
                <div className="text-sm bg-muted/30 p-2.5 rounded-md border border-border/50">
                  <span className="font-semibold text-foreground/80 block mb-0.5">Cliente Atual</span>
                  <div className="truncate text-foreground">
                    {eq.customer.legal_name || eq.customer.nickname || eq.customer.fantasy_name}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => openHistory(eq)} title="Histórico" className="flex-1">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
                {canEdit ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(eq)} className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(eq.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-none px-3">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  eq.status !== 'No Cliente' && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setMaintenanceEquipment(eq)
                      setIsMaintenanceModalOpen(true)
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manutenção
                    </Button>
                  )
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 p-4 border-t border-border/50 bg-muted/20 rounded-b-xl md:hidden">
          <span className="text-sm text-muted-foreground">
            Exibindo itens {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            >
              <span className="sr-only">Primeira</span>
              <span className="text-xs font-bold">|&lt;</span>
            </Button>
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 text-sm font-medium">
              {currentPage} de {totalPages || 1}
            </span>

            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
            >
              <span className="sr-only">Última</span>
              <span className="text-xs font-bold">&gt;|</span>
            </Button>
          </div>
        </div>
      )}

      <InternalMaintenanceModal 
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false)
          setMaintenanceEquipment(null)
        }}
        equipment={maintenanceEquipment}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº Patrimônio / Série *</Label>
                <Input value={patrimony} onChange={e => setPatrimony(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Freezer Vertical">Freezer Vertical</option>
                  <option value="Freezer Horizontal">Freezer Horizontal</option>
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
              <Label>Voltagem *</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="voltage" value="127v" checked={voltage === '127v'} onChange={e => setVoltage(e.target.value as any)} className="cursor-pointer" />
                  127v
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="voltage" value="220v" checked={voltage === '220v'} onChange={e => setVoltage(e.target.value as any)} className="cursor-pointer" />
                  220v
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="voltage" value="Bivolt" checked={voltage === 'Bivolt'} onChange={e => setVoltage(e.target.value as any)} className="cursor-pointer" />
                  Bivolt
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Situação / Status *</Label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Teste">Em Teste</option>
                <option value="Disponível">Disponível no Galpão</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Danificado">Danificado / Sucata</option>
                <option value="No Cliente">No Cliente</option>
                <option value="Equipamento de Estoque">Equipamento de Estoque</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Observações gerais sobre o equipamento..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {status === 'No Cliente' && (
              <div className="space-y-2 col-span-2 relative">
                <Label>Cliente Atual (Vínculo Manual) *</Label>
                <div className="relative">
                  <Input 
                    placeholder="Digite nome, fantasia ou CNPJ/CPF..." 
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value)
                      setCurrentCustomerId('') // clear ID if typing
                    }}
                    required={!currentCustomerId}
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id}
                          className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                          onClick={() => {
                            setCurrentCustomerId(c.id)
                            setCustomerSearch(c.legal_name || c.fantasy_name || '')
                            setShowCustomerDropdown(false)
                          }}
                        >
                          <div className="font-bold text-foreground">{c.legal_name || c.fantasy_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">Doc: {c.document}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            {isLoadingOrders ? (
              <p className="text-center py-4">Carregando histórico...</p>
            ) : equipmentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum histórico de OS encontrado para este equipamento.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold whitespace-nowrap">#{order.os_number || '---'}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="uppercase text-xs font-medium">{order.type}</TableCell>
                        <TableCell>
                          {order.type === 'manutencao' ? (
                            <div className="text-sm">
                              {order.supplies && order.supplies.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {order.supplies.map((s: any, idx: number) => (
                                    <li key={idx}>{s.quantity_consumed} {s.supply?.unit} - {s.supply?.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-muted-foreground italic">Nenhum insumo registrado</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="font-semibold">Local:</span> {order.customer?.legal_name || order.customer?.fantasy_name || 'Depósito / Galpão'}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
