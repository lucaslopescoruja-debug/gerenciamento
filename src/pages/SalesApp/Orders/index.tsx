import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, Plus, Printer, Settings, FileText, Store, Calendar, DollarSign, MessageSquare, FileDigit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { OrderDetailsModal } from '@/components/Sales/OrderDetailsModal'

export default function SalesOrders() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { user, isMaster } = useAuth()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const isVendedor = user?.role === 'vendedor' || user?.role === 'representante'

  const filteredOrders = orders.filter(o => {
    if (isVendedor && !isMaster) {
      const repName = o.sales_rep?.nickname || o.sales_rep?.legal_name
      if (repName !== user?.name) {
        return false
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return o.id.toLowerCase().includes(term) ||
             o.customer?.fantasy_name?.toLowerCase().includes(term) ||
             o.customer?.legal_name?.toLowerCase().includes(term)
    }
    return true
  })

  // Group by date logic (mocking "HOJE" for all to match the design)
  const groupedOrders = {
    'HOJE': filteredOrders
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Rascunho') {
      return <span className="bg-yellow-200 text-yellow-800 text-[11px] font-bold px-3 py-1 rounded-full">Em orçamento</span>
    }
    return <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">Concluído</span>
  }

  return (
    <div className="space-y-6 slide-in max-w-6xl mx-auto pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Meus Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie seus orçamentos e pedidos de venda</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/vendas/novo-pedido">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 h-10 shadow-sm rounded-md">
              <Plus className="h-4 w-4 mr-2" /> Criar pedido / orçamento
            </Button>
          </Link>
          
          <Button variant="outline" className="text-primary border-border bg-background font-semibold px-4 h-10 rounded-md">
            <Printer className="h-4 w-4 mr-2" /> Imprimir pedidos
          </Button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Input 
            placeholder="Pedido, cliente ou representada..." 
            className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                {orders.map(order => (
                  <div key={order.id} onClick={() => {
                    if (order.status === 'Rascunho') {
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

      <OrderDetailsModal 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        orderId={selectedOrderId}
      />
    </div>
  )
}
