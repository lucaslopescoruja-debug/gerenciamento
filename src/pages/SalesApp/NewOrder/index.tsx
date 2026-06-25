import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { FileText, Save, Send, Eye, X, Search, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function NewOrder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const orderId = searchParams.get('id')
  const creatingRef = useRef(false)

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { customersApi } = await import('@/api/customers')
      return customersApi.getCustomers()
    }
  })

  const [productSearch, setProductSearch] = useState('')
  const [showProductResults, setShowProductResults] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { productsApi } = await import('@/api/products')
      return productsApi.getProducts()
    }
  })

  const filteredProducts = productSearch.length > 1 
    ? products.filter((p: any) => 
        p.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.ean?.includes(productSearch)
      ).slice(0, 5)
    : []

  const filteredCustomers = customerSearch.length > 1 
    ? customers.filter((c: any) => 
        c.legal_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.fantasy_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.document?.includes(customerSearch)
      ).slice(0, 5)
    : []

  // Fetch current order if ID exists
  const { data: order, isLoading } = useQuery({
    queryKey: ['sales_order', orderId],
    queryFn: () => salesApi.getSalesOrder(orderId!),
    enabled: !!orderId,
  })

  // Create Draft Order Mutation
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      // Default to user's company (or first company if not available in context)
      const { data: companies } = await supabase.from('companies').select('id').limit(1)
      const companyId = companies?.[0]?.id

      if (!companyId) throw new Error('Nenhuma empresa encontrada para o vendedor')

      // Find the correct sales_rep_id from sales_reps table based on user name
      let salesRepId = null
      if (user?.name) {
        const { data: reps } = await supabase
          .from('sales_reps')
          .select('id')
          .or(`nickname.eq."${user.name}",legal_name.eq."${user.name}"`)
          .limit(1)
        if (reps && reps.length > 0) {
          salesRepId = reps[0].id
        }
      }

      return salesApi.createSalesOrder({
        company_id: companyId,
        customer_id: null,
        sales_rep_id: salesRepId,
        price_table_id: null,
        payment_condition_id: null,
        status: 'Rascunho',
        total_amount: 0,
        total_discount: 0,
        net_amount: 0,
        notes: null,
        delivery_date: null
      })
    },
    onSuccess: (data) => {
      setSearchParams({ id: data.id })
    },
    onError: (err: any) => {
      toast.error('Erro ao gerar rascunho de pedido: ' + err.message)
      navigate('/vendas/pedidos')
    }
  })

  // Run once on mount if no orderId
  useEffect(() => {
    if (!orderId && !creatingRef.current) {
      creatingRef.current = true
      createDraftMutation.mutate()
    }
  }, [orderId])

  if (!orderId || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        Gerando novo pedido...
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-20">Pedido não encontrado.</div>
  }

  const handleAddProduct = async (product: any) => {
    try {
      const { salesApi } = await import('@/api/sales')
      await salesApi.addSalesOrderItems([{
        sales_order_id: orderId!,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price || 0,
        discount_percent: 0,
        net_price: product.price || 0,
        total_price: product.price || 0
      }])
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
      toast.success(`${product.description} adicionado!`)
    } catch (e: any) {
      toast.error('Erro ao adicionar produto: ' + e.message)
    }
  }

  const handleUpdate = async (updates: any) => {
    try {
      await salesApi.updateSalesOrder(orderId, updates)
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
    } catch (e: any) {
      toast.error('Erro ao atualizar: ' + e.message)
    }
  }

  const handleUpdateItem = async (itemId: string, quantity: number, price: number) => {
    try {
      if (quantity < 1) return handleDeleteItem(itemId)
      
      const { salesApi } = await import('@/api/sales')
      await salesApi.updateSalesOrderItem(itemId, {
        quantity,
        total_price: quantity * price
      })
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
    } catch (e: any) {
      toast.error('Erro ao atualizar item: ' + e.message)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { salesApi } = await import('@/api/sales')
      await salesApi.deleteSalesOrderItem(itemId)
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
    } catch (e: any) {
      toast.error('Erro ao remover item: ' + e.message)
    }
  }

  const handleGenerateOrder = async () => {
    if (!order.customer_id) {
      toast.error('Selecione um cliente para gerar o pedido')
      return
    }
    if (!order.items || order.items.length === 0) {
      toast.error('Adicione pelo menos um produto')
      return
    }
    
    try {
      await salesApi.updateSalesOrder(orderId, { status: 'Enviado' })
      toast.success('Pedido gerado e enviado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      navigate('/vendas/pedidos')
    } catch (e: any) {
      toast.error('Erro ao gerar pedido: ' + e.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6 slide-up">
      {/* HEADER TIPO MERCOS */}
      <div className="bg-card border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-bold text-xl text-primary">
            #{order.order_number || '---'}
          </div>
          <Badge variant={order.status === 'Rascunho' ? 'secondary' : 'default'} className="uppercase text-[10px]">
            {order.status === 'Rascunho' ? 'Em Orçamento' : order.status}
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerateOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
            <Save className="h-4 w-4 mr-2" /> Gerar pedido
          </Button>
          <Button variant="outline" className="h-9 font-medium border-border">
            <Eye className="h-4 w-4 mr-2" /> Visualizar
          </Button>
          <Button variant="outline" className="h-9 font-medium border-border">
            <Send className="h-4 w-4 mr-2" /> Enviar por e-mail
          </Button>
          <Button variant="ghost" onClick={() => navigate('/vendas/pedidos')} className="h-9 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-2" /> Fechar
          </Button>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {/* BLOCO 1: CLIENTE */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Cliente</h2>
          </div>
          
          <div className="relative max-w-2xl">
            {order.customer ? (
              <div className="flex justify-between items-center p-3 border border-primary/20 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-bold">{order.customer.legal_name || order.customer.fantasy_name}</p>
                  <p className="text-xs text-muted-foreground flex gap-3 mt-1">
                    <span>{order.customer.document}</span>
                    {order.customer.phone1 && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {order.customer.phone1}</span>}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleUpdate({ customer_id: null })} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Digite o nome ou CNPJ/CPF do cliente e selecione..." 
                  className="pl-9"
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerResults(true)
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                />
                
                {showCustomerResults && customerSearch.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c: any) => (
                        <div 
                          key={c.id} 
                          className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleUpdate({ customer_id: c.id })
                            setCustomerSearch('')
                            setShowCustomerResults(false)
                          }}
                        >
                          <div className="font-medium text-sm">{c.legal_name || c.fantasy_name}</div>
                          <div className="text-xs text-muted-foreground flex justify-between mt-1">
                            <span>{c.document}</span>
                            <span>{c.city && c.state ? `${c.city}/${c.state}` : ''}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground text-center">Nenhum cliente encontrado</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* BLOCO 2: PRODUTOS */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Produtos</h2>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Digite o código ou o nome do produto para adicionar ao pedido..." 
              className="pl-9 border-primary/30 focus-visible:ring-primary/30"
              value={productSearch}
              onChange={e => {
                setProductSearch(e.target.value)
                setShowProductResults(true)
              }}
              onFocus={() => setShowProductResults(true)}
              onBlur={() => setTimeout(() => setShowProductResults(false), 200)}
            />
            
            {showProductResults && productSearch.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p: any) => (
                    <div 
                      key={p.id} 
                      className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0 flex justify-between items-center"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddProduct(p)
                        setProductSearch('')
                        setShowProductResults(false)
                      }}
                    >
                      <div>
                        <div className="font-medium text-sm">{p.description}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>Cód: {p.code}</span>
                          <span className={p.stock > 0 ? "text-emerald-600" : "text-red-500"}>Estoque: {p.stock || 0}</span>
                        </div>
                      </div>
                      <div className="font-bold text-primary">
                        {formatCurrency(p.price)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">Nenhum produto encontrado</div>
                )}
              </div>
            )}
          </div>

          {order.items && order.items.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden mt-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Produto</th>
                    <th className="px-4 py-3 font-medium text-right w-32">Qtd</th>
                    <th className="px-4 py-3 font-medium text-right w-32">Preço Unit.</th>
                    <th className="px-4 py-3 font-medium text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map(item => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium flex items-center justify-between">
                          <span>{item.product?.description}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 opacity-50 hover:opacity-100" onClick={() => handleDeleteItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Cód: {item.product?.code}</div>
                        <div className="text-[10px] text-muted-foreground">Saldo previsto: {(item.product?.stock || 0) - (item.product?.reserved_stock || 0)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input 
                            type="number" 
                            min="1"
                            className="w-20 h-8 text-right px-2"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              // Validar saldo previsto
                              const saldoPrevisto = (item.product?.stock || 0) - (item.product?.reserved_stock || 0)
                              // Se aumentou a quantidade alem do saldo previsto, bloqueia (saldoPrevisto não inclui a quantidade que JA ESTA neste item se for rascunho. Para simplificar, o saldo previsto do produto já tem essa reserva subtraída)
                              // Para ser perfeitamente correto: o saldo disponível total é `saldoPrevisto + item.quantity` (já que o item atual reservou essa quantity).
                              const saldoDisponivelReal = saldoPrevisto + item.quantity
                              if (val > saldoDisponivelReal) {
                                toast.error(`Quantidade indisponível. Saldo máximo: ${saldoDisponivelReal}`)
                                handleUpdateItem(item.id, saldoDisponivelReal, item.unit_price)
                              } else {
                                handleUpdateItem(item.id, val, item.unit_price)
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/10">
               Nenhum produto adicionado ao pedido ainda.
             </div>
          )}
        </section>

        {/* BLOCO 3: DETALHES DO PEDIDO */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Detalhes do Pedido</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Nº do pedido</label>
              <div className="font-medium">{order.order_number || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Data da emissão</label>
              <div className="font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Vendedor</label>
              <div className="font-medium">{order.sales_rep?.nickname || user?.name || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Cond. de pagamento</label>
              <div className="font-medium">{order.payment_condition?.name || 'A definir'}</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-2 block">Informações Adicionais</label>
            <Textarea 
              placeholder="Digite aqui observações para a nota fiscal ou entrega..." 
              defaultValue={order.notes || ''}
              onBlur={(e) => {
                if (e.target.value !== order.notes) {
                  handleUpdate({ notes: e.target.value })
                }
              }}
              className="resize-none h-20"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
