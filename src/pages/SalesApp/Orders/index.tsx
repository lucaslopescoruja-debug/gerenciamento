import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, Plus, Printer, Settings, FileText, Store, Calendar, DollarSign, MessageSquare, FileDigit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SalesOrders() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const filteredOrders = orders.filter(o => {
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
    <div className="flex flex-col min-h-screen bg-background">
      
      <div className="bg-card border-b border-border px-4 md:px-8 pt-4 flex gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-primary text-primary font-bold text-xs tracking-wider cursor-pointer whitespace-nowrap">
          <FileText className="h-4 w-4" /> PEDIDOS
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1200px] w-full mx-auto">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/vendas/novo-pedido/clientes">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 h-10 shadow-sm rounded-md">
                <Plus className="h-4 w-4 mr-2" /> Criar pedido / orçamento
              </Button>
            </Link>
            
            <Button variant="outline" className="text-primary border-border bg-background font-semibold px-4 h-10 rounded-md">
              <Printer className="h-4 w-4 mr-2" /> Imprimir pedidos
            </Button>
          </div>

          <div className="relative w-full md:w-[320px]">
            <Input 
              placeholder="Pedido, cliente ou representada" 
              className="pr-10 h-10 border-border bg-background rounded-md text-sm shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="absolute -bottom-5 right-0 text-[9px] text-muted-foreground hidden md:block">
              ▾ Pesquise por nota fiscal, data de emissão, etc.
            </div>
          </div>
        </div>

        {/* Filters Summary */}
        <div className="text-[11px] text-muted-foreground mb-8 mt-6 font-medium leading-relaxed">
          Mostrando <span className="text-primary font-semibold cursor-pointer hover:underline">Pedidos ativos ▾</span> feitos por <span className="text-primary font-semibold cursor-pointer hover:underline">Todos os vendedores ▾</span> via <span className="text-primary font-semibold cursor-pointer hover:underline">Todas as plataformas ▾</span> Sem considerar o envio ▾ com <span className="text-primary font-semibold cursor-pointer hover:underline">Qualquer status ▾</span>
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
                  <div key={order.id} onClick={() => navigate(`/vendas/pedidos/${order.id}`)} className="bg-card border border-border rounded-md p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors shadow-sm relative group flex justify-between items-start">
                    
                    {/* Left Side */}
                    <div className="flex flex-col gap-3">
                      <div className="text-xs font-medium text-foreground">
                        <span className="text-primary font-bold">#{order.id.slice(0, 5).toUpperCase()}</span> emitido por <span className="uppercase text-muted-foreground">{order.sales_rep?.nickname || 'Vendedor'}</span>
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

      </div>
      

    </div>
  )
}
