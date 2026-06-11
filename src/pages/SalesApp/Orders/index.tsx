import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, Plus, Filter, AlertCircle, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SalesOrders() {
  const [activeTab, setActiveTab] = useState<'all' | 'drafts'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  // No Mercos a tela de Pedidos é a principal e o "Não enviados" corresponde aos Rascunhos
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'drafts' && o.status !== 'Rascunho') return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return o.customer?.fantasy_name?.toLowerCase().includes(term) ||
             o.customer?.legal_name?.toLowerCase().includes(term)
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho': return 'text-amber-500'
      case 'Enviado': return 'text-blue-500'
      case 'Faturado': return 'text-emerald-500'
      case 'Cancelado': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const draftsCount = orders.filter(o => o.status === 'Rascunho').length

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-6">
      <div className="bg-white p-4 space-y-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar pedido ou orçamento" 
              className="pl-10 h-12 bg-gray-100 border-none text-base rounded-xl"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/vendas/novo-pedido/clientes">
            <Button size="icon" className="h-12 w-12 rounded-xl shrink-0">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'drafts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Não enviados
            {draftsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {draftsCount}
              </span>
            )}
          </button>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1 font-medium">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500" /> Em orçamento</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Faturado</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500" /> Enviado</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500" /> Cancelado</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <ShoppingCart className="h-12 w-12 mb-3 text-gray-300" />
            <p>Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <Link key={order.id} to={`/vendas/pedidos/${order.id}`} className="block bg-white p-4 active:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon status={order.status} />
                    <span className={`font-bold text-sm ${order.status === 'Rascunho' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {order.status === 'Rascunho' ? 'Orçamento' : 'Pedido'} #{order.id.slice(0, 5).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{order.sales_rep?.nickname || 'Vendedor'}</span>
                    <div className={`w-2.5 h-2.5 ${getStatusColor(order.status).replace('text-', 'bg-')} ${order.status === 'Rascunho' ? 'clip-triangle' : 'rounded-full'}`} />
                  </div>
                </div>

                <div className="flex items-start gap-2 mb-3">
                  <div className="mt-0.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 uppercase line-clamp-1">{order.customer?.fantasy_name || order.customer?.legal_name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{order.customer?.address || 'Sem endereço'}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-1">
                  <div className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <span className="bg-gray-100 p-0.5 rounded text-[10px]">R$</span>
                    {order.payment_condition?.name || 'Condição não informada'}
                  </div>
                  <div className="font-bold text-lg text-gray-800">
                    {formatCurrency(order.net_amount)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  )
}

function CheckCircleIcon({ status }: { status: string }) {
  if (status === 'Rascunho') {
    return (
      <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
