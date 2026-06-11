import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { customersApi } from '@/api/customers'
import { Search, Building2, MapPin, Phone, ShieldAlert, BadgeInfo } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

export default function SalesCustomers() {
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  // For a salesman, they should only see their customers, but the API might return all or we filter here if API doesn't.
  // Assuming getCustomers returns all company customers, we'll filter by sales_rep_id later when sales_rep is bound to user.
  // For now, we list all and filter by search.
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  })

  const filteredCustomers = customers.filter(c => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return c.fantasy_name?.toLowerCase().includes(term) ||
             c.legal_name?.toLowerCase().includes(term) ||
             c.document?.includes(term)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-6">
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Buscar clientes por nome ou CNPJ" 
            className="pl-10 h-12 bg-gray-100 border-none text-base rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando clientes...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Building2 className="h-12 w-12 mb-3 text-gray-300" />
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                {!customer.active && (
                  <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Bloqueado
                  </div>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${customer.active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <h3 className={`font-bold text-sm truncate ${customer.active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                      {customer.fantasy_name || customer.legal_name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{customer.document}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mt-1">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                    <span className="line-clamp-2">{customer.address}{customer.number ? `, ${customer.number}` : ''} - {customer.city}/{customer.state}</span>
                  </div>
                  {customer.phone1 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{customer.phone1}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-500">
                    Tabela: <span className="text-gray-800">{customer.price_table?.name || 'Padrão'}</span>
                  </div>
                  <Link to={`/vendas/novo-pedido/carrinho?cliente=${customer.id}`}>
                    <button 
                      disabled={!customer.active}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                        customer.active 
                          ? 'bg-primary/10 text-primary active:bg-primary/20' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Novo Pedido
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
