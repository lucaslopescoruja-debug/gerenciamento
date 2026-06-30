import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, Plus, Printer, Settings, FileText, Store, Calendar, DollarSign, MessageSquare, FileDigit, Trash2, Boxes, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { OrderDetailsModal } from '@/components/Sales/OrderDetailsModal'
import { ImportOrdersModal } from './ImportOrdersModal'

export default function SalesOrders() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { user, company, isMaster } = useAuth()

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups'],
    queryFn: salesApi.getOrderGroups,
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const isVendedor = user?.role === 'vendedor' || user?.role === 'representante'

  const filteredOrders = orders.filter(o => {
    // Esconde os pedidos importados via planilha do App Força de Vendas
    if (o.notes?.includes('[Origem: Importação Planilha]')) {
      return false
    }

    if (isVendedor && !isMaster) {
      const repName = o.sales_rep?.nickname || o.sales_rep?.legal_name
      if (repName !== user?.name) {
        return false
      }
    }

    if (selectedGroupId && o.order_group_id !== selectedGroupId) {
      return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return o.id.toLowerCase().includes(term) ||
             o.customer?.fantasy_name?.toLowerCase().includes(term) ||
             o.customer?.legal_name?.toLowerCase().includes(term) ||
             o.order_number?.toString().includes(term)
    }
    return true
  })

  // Group by date logic (mocking "HOJE" for all to match the design)
  const groupedOrders = {
    'HOJE': filteredOrders
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <span className="bg-yellow-200 text-yellow-800 text-[11px] font-bold px-3 py-1 rounded-full">OrÃ§amento</span>
      case 'Pedido Criado':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full">Pedido Criado</span>
      case 'Faturado':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-1 rounded-full">Faturado</span>
      case 'Enviado':
        return <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">Enviado</span>
      case 'Retornou':
        return <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-3 py-1 rounded-full">Retornou</span>
      case 'Entregue':
        return <span className="bg-green-100 text-green-800 text-[11px] font-bold px-3 py-1 rounded-full">Entregue</span>
      case 'Cancelado':
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-3 py-1 rounded-full">Cancelado</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full">{status}</span>
    }
  }

  return (
    <div className="space-y-6 slide-in max-w-6xl mx-auto pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Meus Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie seus orÃ§amentos e pedidos de venda</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/vendas/novo-pedido">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 h-10 shadow-sm rounded-md">
              <Plus className="h-4 w-4 mr-2" /> Criar pedido / orÃ§amento
            </Button>
          </Link>


          
          <Button variant="outline" className="text-primary border-border bg-background font-semibold px-4 h-10 rounded-md">
            <Printer className="h-4 w-4 mr-2" /> Imprimir pedidos
          </Button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input 
              placeholder="Pedido, cliente ou representante..." 
              className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <select
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
            >
              <option value="">Todos os Grupos</option>
              {orderGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Carregando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhum pedido encontrado.</div>
        ) : (
          Object.entries(groupedOrders).map(([dateLabel, orders]) => (
            <div key={dateLabel} className="mb-12">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider mb-3">{dateLabel}</h3>
              <div className="space-y-3">
                {orders.map(order => {
                  const isEditable = !['Faturado', 'Retornou', 'Entregue', 'Cancelado'].includes(order.status)
                  return (
                  <div key={order.id} onClick={() => {
                    if (isEditable) {
                      navigate(`/vendas/novo-pedido?id=${order.id}`)
                    } else {
                      setSelectedOrderId(order.id)
                      setIsDetailsOpen(true)
                    }
                  }} className="bg-card border border-border rounded-md p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors shadow-sm relative group flex justify-between items-start">
                    
                    {/* Left Side */}
                    <div className="flex flex-col gap-3">
                      <div className="text-xs font-medium text-foreground">
                        <span className="text-primary font-bold">#{order.order_number || order.id.slice(0, 5).toUpperCase()}</span> emitido por <span className="uppercase text-muted-foreground">{order.sales_rep?.nickname || 'Vendedor'}</span>
                      </div>
                      
                      {order.customer && (
                        <div className="text-[10px] text-muted-foreground uppercase flex flex-col gap-1.5 ml-0.5">
                          <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-muted-foreground/60" /> {order.customer.legal_name || order.customer.fantasy_name}
                          </div>
                          {order.customer.fantasy_name && order.customer.fantasy_name !== order.customer.legal_name && (
                            <div className="ml-5 text-muted-foreground/80">{order.customer.fantasy_name}</div>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" /> {order.payment_condition?.name || 'A VISTA'}
                          </div>
                          {order.order_group_id && (
                            <div className="flex items-center gap-2 mt-0.5 text-blue-600/80">
                              <Boxes className="h-3.5 w-3.5" /> 
                              {orderGroups.find((g: any) => g.id === order.order_group_id)?.name || 'Grupo'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-2 font-bold text-sm text-foreground">
                        {order.status === 'Rascunho' ? (
                          <span className="text-foreground text-xs">{formatCurrency(order.net_amount || 0)}</span>
                        ) : (
                          <>
                            <div className="bg-emerald-500 rounded-full flex items-center justify-center h-4 w-4">
                               <DollarSign className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-foreground">{formatCurrency(order.net_amount || 0)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col justify-between items-end h-full min-h-[80px]">
                      {getStatusBadge(order.status)}
                      {!isEditable && (
                        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block"></span> Somente Leitura
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

      <OrderDetailsModal 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        orderId={selectedOrderId}
      />

      <ImportOrdersModal 
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  )
}

