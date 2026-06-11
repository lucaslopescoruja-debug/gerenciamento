import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { FileText, Search, FileSignature, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { SalesOrder } from '@/types/database'

export default function SalesManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
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

  const filteredOrders = orders.filter(o => {
    const searchMatch = 
      o.customer?.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    return searchMatch
  })

  const handleUpdateStatus = (id: string, currentStatus: string, newStatus: SalesOrder['status']) => {
    if (window.confirm(`Tem certeza que deseja alterar o status de "${currentStatus}" para "${newStatus}"?`)) {
      updateStatusMutation.mutate({ id, status: newStatus })
    }
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
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium text-right">Valor Líquido</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando pedidos...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-medium">
                      {order.customer?.fantasy_name || order.customer?.legal_name}
                      <p className="text-xs text-muted-foreground font-normal">{order.payment_condition?.name}</p>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="Ver Detalhes">
                          <FileSignature className="h-4 w-4" />
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
    </div>
  )
}
