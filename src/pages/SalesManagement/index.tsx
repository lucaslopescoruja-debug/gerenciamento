import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { FileText, Search, FileSignature, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, Upload, Edit } from 'lucide-react'
import { ImportMaxiprodModal } from '@/components/Sales/ImportMaxiprodModal'
import type { SalesOrder } from '@/types/database'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SalesManagement() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const { data: selectedOrderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['sales_order_details', selectedOrderId],
    queryFn: () => salesApi.getSalesOrder(selectedOrderId!),
    enabled: !!selectedOrderId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: SalesOrder['status'] }) => 
      salesApi.updateSalesOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Status do pedido atualizado')
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`)
  })

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const searchMatch = 
        o.customer?.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filterStatus !== 'all' && o.status !== filterStatus) return false
      return searchMatch
    })
  }, [orders, searchTerm, filterStatus])

  type SortFieldType = 'created_at' | 'customer_name' | 'sales_rep' | 'net_amount' | 'status' | null
  const [sortField, setSortField] = useState<SortFieldType>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const renderSortIcon = (field: SortFieldType) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
  }

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'created_at': valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime(); break;
        case 'customer_name': 
          valA = a.customer?.legal_name || a.customer?.nickname || a.customer?.fantasy_name || ''; 
          valB = b.customer?.legal_name || b.customer?.nickname || b.customer?.fantasy_name || ''; 
          break;
        case 'sales_rep': valA = a.sales_rep?.nickname || ''; valB = b.sales_rep?.nickname || ''; break;
        case 'net_amount': valA = a.net_amount; valB = b.net_amount; break;
        case 'status': valA = a.status; valB = b.status; break;
      }

      valA = valA ?? ''
      valB = valB ?? ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' })
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredOrders, sortField, sortAsc])

  const handleUpdateStatus = (id: string, currentStatus: string, newStatus: SalesOrder['status']) => {
    if (window.confirm(`Tem certeza que deseja alterar o status de "${currentStatus}" para "${newStatus}"?`)) {
      updateStatusMutation.mutate({ id, status: newStatus })
    }
  }

  const openDetails = (id: string) => {
    setSelectedOrderId(id)
    setIsDetailsOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Rascunho': return 'secondary'
      case 'Enviado': return 'warning'
      case 'Faturado': return 'success'
      case 'Cancelado': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Gestão de Pedidos
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe e fature os pedidos enviados pelos vendedores.</p>
        </div>
        <Button 
          variant="outline" 
          className="text-blue-600 border-blue-500 hover:bg-blue-50 font-bold px-4 h-10 shadow-sm rounded-md"
          onClick={() => setIsImportModalOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" /> Importar Planilha
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome do cliente..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select 
          className="flex h-10 w-full sm:w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="Rascunho">Em Rascunho</option>
          <option value="Enviado">Aguardando Faturamento (Enviado)</option>
          <option value="Faturado">Faturados</option>
          <option value="Cancelado">Cancelados</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('created_at')}>
                  Data {renderSortIcon('created_at')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('customer_name')}>
                  Cliente {renderSortIcon('customer_name')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('sales_rep')}>
                  Vendedor {renderSortIcon('sales_rep')}
                </th>
                <th className="px-4 py-3 font-medium text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('net_amount')}>
                  Valor Líquido {renderSortIcon('net_amount')}
                </th>
                <th className="px-4 py-3 font-medium text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                  Status {renderSortIcon('status')}
                </th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ?
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando pedidos...</td></tr>
               : sortedOrders.length === 0 ? 
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
               : (
                sortedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-primary">
                      #{order.order_number || order.id.slice(0, 5).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-medium">
                      {(() => {
                        const legalName = order.customer?.legal_name || order.customer?.nickname || order.customer?.fantasy_name;
                        const fantasyName = order.customer?.fantasy_name;
                        const showFantasy = fantasyName && legalName && fantasyName !== legalName;
                        return (
                          <>
                            <div className="font-bold">{legalName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {showFantasy ? `${fantasyName} - ` : ''}
                              {order.customer?.document || ''}
                            </div>
                          </>
                        )
                      })()}
                      <p className="text-xs text-muted-foreground font-normal mt-1">{order.payment_condition?.name}</p>
                    </td>
                    <td className="px-4 py-3">{order.sales_rep?.nickname || '---'}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(order.net_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'Enviado' && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleUpdateStatus(order.id, order.status, 'Faturado')}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Faturar
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(order.id, order.status, 'Cancelado')}>
                              <XCircle className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-blue-600 hover:text-blue-700" title="Editar Pedido (Completo)" onClick={() => navigate(`/vendas/novo?id=${order.id}&returnTo=/vendas/gestao`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="Ver Detalhes" onClick={() => openDetails(order.id)}>
                          <FileSignature className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" title="Excluir Pedido" onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                            salesApi.deleteSalesOrder(order.id)
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
                                toast.success('Pedido excluído com sucesso')
                              })
                              .catch((e: any) => toast.error('Erro ao excluir pedido: ' + e.message))
                          }
                        }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle>Resumo do Pedido</DialogTitle>
            <DialogDescription>
              Detalhes dos itens e valores deste pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto flex-1">
            {isLoadingDetails ? (
              <div className="py-8 text-center text-muted-foreground">Carregando detalhes...</div>
            ) : selectedOrderDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Cliente</p>
                    <p className="text-sm font-semibold">{selectedOrderDetails.customer?.legal_name || 'Consumidor'}</p>
                  </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Vendedor</p>
                  <p className="text-sm font-semibold">{selectedOrderDetails.sales_rep?.nickname || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Data</p>
                  <p className="text-sm font-semibold">{formatDate(selectedOrderDetails.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Cond. Pgto</p>
                  <p className="text-sm font-semibold">{selectedOrderDetails.payment_condition?.name || '---'}</p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right w-24">Qtd</TableHead>
                      <TableHead className="text-right w-32">Preço Unit.</TableHead>
                      <TableHead className="text-right w-24">Desc. %</TableHead>
                      <TableHead className="text-right w-32">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderDetails.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{item.product?.description}</div>
                          <div className="text-xs text-muted-foreground">Cód: {item.product?.code}</div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{item.discount_percent || 0}%</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end space-y-2 bg-muted/20 p-4 rounded-lg">
                <div className="flex justify-between w-full sm:w-64 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency((selectedOrderDetails.net_amount || 0) + (selectedOrderDetails.total_discount || 0))}</span>
                </div>
                <div className="flex justify-between w-full sm:w-64 text-sm text-red-500">
                  <span>Descontos:</span>
                  <span>- {formatCurrency(selectedOrderDetails.total_discount || 0)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2 border-t border-border">
                  <span>Total Líquido:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedOrderDetails.net_amount || 0)}</span>
                </div>
              </div>

              {selectedOrderDetails.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observações:</p>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
                    {selectedOrderDetails.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Erro ao carregar os detalhes do pedido.</div>
          )}
          </div>
        </DialogContent>
      </Dialog>
      <ImportMaxiprodModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} />
    </div>
  )
}



