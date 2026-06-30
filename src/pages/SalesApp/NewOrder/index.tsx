import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { FileText, Save, Send, Eye, X, Search, Phone, Building2, ChevronLeft, Plus, Trash2, ShoppingCart, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ProductSearchInline } from './ProductSearchInline'
import { OrderDetailsModal } from '@/components/Sales/OrderDetailsModal'
import { InvoicePrintTemplate } from '@/components/Sales/InvoicePrintTemplate'
import { ChevronDown, Copy, Mail, Ban, CreditCard } from 'lucide-react'
import jsPDF from 'jspdf'
import { toPng } from 'html-to-image'
import { Share } from '@capacitor/share'

export default function NewOrder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  
  const orderId = searchParams.get('id')
  const returnTo = searchParams.get('returnTo') || '/vendas/pedidos'
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

  const { data: paymentConditions = [] } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: async () => {
      const { salesApi } = await import('@/api/sales')
      return salesApi.getPaymentConditions()
    }
  })

  const { data: salesReps = [] } = useQuery({
    queryKey: ['sales_reps'],
    queryFn: async () => {
      const { data } = await supabase.from('sales_reps').select('id, nickname, legal_name').eq('active', true).order('nickname')
      return data || []
    }
  })

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups'],
    queryFn: async () => {
      const { salesApi } = await import('@/api/sales')
      return salesApi.getOrderGroups()
    }
  })

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [showOptionsTop, setShowOptionsTop] = useState(false)
  const [showOptionsBottom, setShowOptionsBottom] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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
    queryFn: async () => {
      const { salesApi } = await import('@/api/sales')
      return salesApi.getSalesOrder(orderId!)
    },
    enabled: !!orderId
  })

  useEffect(() => {
    if (order && order.items) {
      const subtotal = order.items.reduce((acc: any, item: any) => acc + (item.quantity * item.unit_price), 0)
      const totalItemsDiscount = order.items.reduce((acc: any, item: any) => acc + (item.quantity * item.unit_price - item.total_price), 0)
      const amountAfterItemsDiscount = subtotal - totalItemsDiscount
      
      if (amountAfterItemsDiscount > 0 && order.total_discount > 0) {
        setDiscountPercent(((order.total_discount / amountAfterItemsDiscount) * 100).toFixed(2))
      } else if (order.total_discount === 0) {
        setDiscountPercent('')
      }
    }
  }, [order?.total_discount, order?.items])

  const hasAutoAdvancedRef = useRef(false)
  useEffect(() => {
    if (order?.customer_id && currentStep === 1 && !hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true
      setCurrentStep(2)
    }
  }, [order?.customer_id, currentStep])

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
        order_group_id: null,
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
      navigate(returnTo)
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

  const handleUpdateQuantityFromSearch = async (productId: string, quantity: number, price: number) => {
    try {
      const { salesApi } = await import('@/api/sales')
      const existing = order.items?.find((i: any) => i.product_id === productId)
      
      if (quantity === 0) {
        if (existing) {
          await salesApi.deleteSalesOrderItem(existing.id)
        }
      } else if (existing) {
        if (existing.quantity !== quantity) {
          await salesApi.updateSalesOrderItem(existing.id, {
            quantity,
            total_price: quantity * price
          })
        }
      } else {
        await salesApi.addSalesOrderItems([{
          sales_order_id: orderId!,
          product_id: productId,
          quantity,
          unit_price: price,
          discount_percent: 0,
          net_price: price,
          total_price: quantity * price
        }])
      }
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
    } catch (e: any) {
      toast.error('Erro ao atualizar produto: ' + e.message)
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

  const handleDeleteOrder = async () => {
    if (confirm('Tem certeza que deseja apagar este pedido permanentemente?')) {
      try {
        const { salesApi } = await import('@/api/sales')
        await salesApi.deleteSalesOrder(orderId!)
        toast.success('Pedido apagado com sucesso!')
        navigate(returnTo)
      } catch (e: any) {
        toast.error('Erro ao apagar pedido: ' + e.message)
      }
    }
  }

  const handleDuplicateOrder = async () => {
    if (!order) return
    try {
      const { salesApi } = await import('@/api/sales')
      const newOrder = await salesApi.createSalesOrder({
        company_id: order.company_id,
        customer_id: order.customer_id,
        sales_rep_id: order.sales_rep_id,
        price_table_id: order.price_table_id,
        payment_condition_id: order.payment_condition_id,
        order_group_id: null,
        status: 'Rascunho',
        total_amount: order.total_amount,
        total_discount: order.total_discount,
        net_amount: order.net_amount,
        notes: order.notes,
        delivery_date: order.delivery_date
      })
      
      if (order.items && order.items.length > 0) {
        const newItems = order.items.map((item: any) => ({
          sales_order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_percent: item.discount_percent,
          net_price: item.net_price || item.total_price
        }))
        await salesApi.addSalesOrderItems(newItems)
      }
      
      toast.success('Pedido duplicado com sucesso!')
      setShowOptionsTop(false)
      setSearchParams({ id: newOrder.id })
    } catch (e: any) {
      toast.error('Erro ao duplicar pedido: ' + e.message)
    }
  }

  const generatePdfFile = async () => {
    if (!printRef.current) throw new Error("Elemento PDF não encontrado");
    setIsGeneratingPdf(true);
    try {
      const imgData = await toPng(printRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      return pdf;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePdfFile();
      pdf.save(`pedido_${order?.order_number || 'novo'}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (e: any) {
      toast.error('Erro ao gerar PDF: ' + e.message);
    }
  };

  const handleShareWhatsapp = async () => {
    try {
      const pdf = await generatePdfFile();
      // Generate blob for capacitor share
      const pdfBlob = pdf.output('blob');
      
      try {
        const file = new File([pdfBlob], `pedido_${order?.order_number || 'novo'}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Pedido ${order?.order_number || ''}`,
            text: `Segue o pedido gerado via Força de Vendas.`,
            files: [file]
          });
          toast.success('Compartilhado com sucesso!');
        } else {
          // Fallback if system share not supported (like on some desktop browsers)
          toast.error("O compartilhamento de arquivo não é suportado pelo seu navegador.");
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error("Erro ao compartilhar: " + err.message);
        }
      }
    } catch (e: any) {
      toast.error('Erro ao gerar PDF para WhatsApp: ' + e.message);
    }
  };

  const handleGenerateOrder = async () => {
    if (!order.customer_id) {
      toast.error('Selecione um cliente para gerar o pedido')
      return
    }
    if (!order.items || order.items.length === 0) {
      toast.error('Adicione pelo menos um produto')
      return
    }
    
    if (!order.order_group_id) {
      toast.error('Selecione um Grupo de Pedidos')
      return
    }

    try {
      const calcSubtotal = order.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0;
      const calcNet = calcSubtotal - (order.total_discount || 0);

      await salesApi.updateSalesOrder(orderId, { 
        status: 'Pedido Criado',
        total_amount: calcSubtotal,
        net_amount: calcNet
      })
      toast.success('Orçamento salvo com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      navigate(returnTo)
    } catch (e: any) {
      toast.error('Erro ao gerar pedido: ' + e.message)
    }
  }

  const handleFinishOrder = async () => {
    if (!order.customer_id) {
      toast.error('Selecione um cliente para concluir o pedido')
      return
    }
    if (!order.items || order.items.length === 0) {
      toast.error('Adicione pelo menos um produto')
      return
    }
    
    try {
      const calcSubtotal = order.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0;
      const calcNet = calcSubtotal - (order.total_discount || 0);

      await salesApi.updateSalesOrder(orderId, { 
        status: 'Enviado',
        total_amount: calcSubtotal,
        net_amount: calcNet
      })
      toast.success('Pedido enviado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      navigate(returnTo)
    } catch (e: any) {
      toast.error('Erro ao concluir pedido: ' + e.message)
    }
  }



  const totalItems = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0
  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0
  const finalTotal = subtotal - (order.total_discount || 0)

  return (
    <>
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
        <>
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
            <Save className="h-4 w-4 mr-2" /> Salvar Pedido
          </Button>
          <Button variant="outline" className="h-9 font-medium border-border" onClick={() => setIsDetailsModalOpen(true)}>
            <Eye className="h-4 w-4 mr-2" /> Visualizar
          </Button>
          
          <div className="relative">
            <Button variant="outline" className="h-9 font-medium border-border" onClick={() => setShowOptionsTop(!showOptionsTop)}>
              Mais opções <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {showOptionsTop && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptionsTop(false)} />
                <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border shadow-lg rounded-md flex flex-col z-50 py-1">
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2" onClick={handleDuplicateOrder}>
                    <Copy className="h-4 w-4" /> Duplicar
                  </button>
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2" onClick={() => { setShowOptionsTop(false); toast.info('Em breve!') }}>
                    <Mail className="h-4 w-4" /> Enviar por e-mail
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted text-red-500 flex items-center gap-2" onClick={() => { setShowOptionsTop(false); handleDeleteOrder() }}>
                    <Ban className="h-4 w-4" /> Cancelar pedido
                  </button>
                </div>
              </>
            )}
          </div>
          
          <Button variant="ghost" onClick={() => navigate(returnTo)} className="h-9 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-2" /> Fechar
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-6">
        {/* BLOCO 1: CLIENTE (Step 2) */}
        <section className={`bg-card border border-border rounded-xl p-5 shadow-sm order-2 md:order-none ${currentStep === 2 ? 'block' : 'hidden md:block'}`}>
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
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

        {/* BLOCO 2: BUSCA DE PRODUTOS INLINE (Step 3) */}
        <section className={`order-3 md:order-none ${currentStep === 3 ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-2 text-muted-foreground mb-4 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider">Adicionar Produtos</h2>
          </div>
          <ProductSearchInline 
            currentItems={order.items?.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity })) || []}
            priceTableId={order.customer?.price_table_id}
            onUpdateQuantity={handleUpdateQuantityFromSearch}
          />
        </section>

        {/* BLOCO 3 E 4: RESUMO E PAGAMENTO (Step 4) */}
        <div className={`order-4 md:order-none ${currentStep === 4 ? 'flex flex-col gap-8' : 'hidden md:flex md:flex-col md:gap-8'}`}>
          <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Resumo do Pedido</h2>
            </div>
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
                        <div className="font-medium">
                          <span>{item.product?.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Cód: {item.product?.code}</div>
                        <div className="text-[10px] text-muted-foreground">Saldo previsto: {(item.product?.stock || 0) - (item.product?.reserved_stock || 0)}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.quantity} un
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

        {/* BLOCO 5: DETALHES DO PEDIDO (Step 1) */}
        <section className={`bg-card border border-border rounded-xl p-5 shadow-sm order-1 md:order-none ${currentStep === 1 ? 'block' : 'hidden md:block'}`}>
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
              <select 
                className="w-full border border-border bg-background rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={order.sales_rep_id || ''}
                onChange={(e) => handleUpdate({ sales_rep_id: e.target.value || null })}
              >
                <option value="">Selecione...</option>
                {salesReps.map((rep: any) => (
                  <option key={rep.id} value={rep.id}>{rep.nickname || rep.legal_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Cond. de pagamento</label>
              <div className="font-medium">{order.payment_condition?.name || 'A definir'}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">* Grupo de Pedidos</label>
              <select 
                className="w-full border border-border bg-background rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border-emerald-500/50"
                value={order.order_group_id || ''}
                onChange={(e) => handleUpdate({ order_group_id: e.target.value || null })}
              >
                <option value="">Selecione um grupo...</option>
                {orderGroups.filter((g: any) => g.active || g.id === order.order_group_id).map((group: any) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
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

        {/* BLOCO 6: PAGAMENTO (Step 4 - continues) */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Pagamento</h2>
          </div>

          <div className="flex gap-4 max-w-md mt-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">* Condição de pagamento</label>
              <select 
                className="w-full border border-border bg-background rounded-md h-12 px-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-base"
                value={order.payment_condition_id || ''}
                onChange={(e) => handleUpdate({ payment_condition_id: e.target.value || null })}
              >
                <option value="">---------</option>
                {paymentConditions.map((pc: any) => (
                  <option key={pc.id} value={pc.id}>{pc.name}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Desconto (%)</label>
              <Input 
                type="number"
                min="0"
                max="100"
                className="h-9"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value)
                }}
                onBlur={(e) => {
                  const perc = parseFloat(e.target.value) || 0
                  const subtotal = order.items?.reduce((acc: any, item: any) => acc + (item.quantity * item.unit_price), 0) || 0
                  const totalItemsDiscount = order.items?.reduce((acc: any, item: any) => acc + (item.quantity * item.unit_price - item.total_price), 0) || 0
                  const amountAfterItemsDiscount = subtotal - totalItemsDiscount
                  const newDiscount = amountAfterItemsDiscount * (perc / 100)
                  handleUpdate({ total_discount: newDiscount })
                }}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground font-semibold mb-1.5 block">* Grupo de Pedidos</label>
            <select 
              className="w-full border border-border bg-background rounded-md h-12 px-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-base border-emerald-500/50"
              value={order.order_group_id || ''}
              onChange={(e) => handleUpdate({ order_group_id: e.target.value || null })}
            >
              <option value="">Selecione um grupo...</option>
              {orderGroups.filter((g: any) => g.active || g.id === order.order_group_id).map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        </section>
        </div>

        {/* CONTROLES DO WIZARD MOBILE */}
        <div className="md:hidden flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm sticky bottom-4 z-40 order-last mt-4">
          <Button 
            variant="outline" 
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          >
            Voltar
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            Passo {currentStep} de 4
          </div>
          {currentStep < 4 ? (
            <Button 
              className="bg-primary text-primary-foreground"
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
            >
              Avançar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleGenerateOrder} variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold">
                <Save className="h-4 w-4 mr-2" /> Salvar Orçamento
              </Button>
              <Button onClick={handleFinishOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Send className="h-4 w-4 mr-2" /> Concluir
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* AÇÕES RODAPÉ */}
      <div className="bg-card border-t border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row gap-4 items-center justify-end mt-8 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerateOrder} variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold h-9">
            <Save className="h-4 w-4 mr-2" /> Salvar Orçamento
          </Button>
          <Button onClick={handleFinishOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
            <Send className="h-4 w-4 mr-2" /> Concluir Pedido
          </Button>
          <Button variant="outline" className="h-9 font-medium border-border" onClick={() => setIsDetailsModalOpen(true)}>
            <Eye className="h-4 w-4 mr-2" /> Visualizar
          </Button>
          
          <div className="relative">
            <Button variant="outline" className="h-9 font-medium border-border" onClick={() => setShowOptionsBottom(!showOptionsBottom)}>
              Mais opções <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {showOptionsBottom && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptionsBottom(false)} />
                <div className="absolute bottom-full right-0 mb-1 w-48 bg-card border border-border shadow-lg rounded-md flex flex-col z-50 py-1">
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2" onClick={handleDuplicateOrder}>
                    <Copy className="h-4 w-4" /> Duplicar
                  </button>
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2" onClick={() => { setShowOptionsBottom(false); toast.info('Em breve!') }}>
                    <Mail className="h-4 w-4" /> Enviar por e-mail
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button className="px-4 py-2 text-sm text-left hover:bg-muted text-red-500 flex items-center gap-2" onClick={() => { setShowOptionsBottom(false); handleDeleteOrder() }}>
                    <Ban className="h-4 w-4" /> Cancelar (Apagar)
                  </button>
                </div>
              </>
            )}
          </div>
          
          <Button variant="ghost" onClick={() => navigate(returnTo)} className="h-9 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-2" /> Fechar
          </Button>
        </div>
      </div>
      
      <OrderDetailsModal 
        orderId={orderId}
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
    </>
  )
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="block md:hidden">
        <div className="max-w-6xl mx-auto pb-24 space-y-6 slide-in bg-background min-h-screen">
      
      {/* HEADER PRINCIPAL (Mobile App Style) */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => {
            if (currentStep > 1 && currentStep !== 2) setCurrentStep(2)
            else navigate(returnTo)
          }} className="h-8 w-8 -ml-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-bold text-lg">
            {currentStep === 1 ? 'Selecionar Cliente' : 
             currentStep === 2 ? 'Pedido' : 
             currentStep === 3 ? 'Adicionar Produtos' : 'Orçamento / Finalizar'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button size="sm" onClick={handleGenerateOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 rounded-full text-xs">
              Salvar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-4 px-4 md:px-0">
        
        {/* TELA 1: CLIENTES */}
        <section className={`${currentStep === 1 ? 'block' : 'hidden md:block'} md:order-1`}>
          <div className="hidden md:flex items-center gap-2 mb-4 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Cliente</h2>
          </div>
          
          <div className="relative max-w-2xl mx-auto w-full">
            {order.customer && currentStep !== 1 ? (
              <div className="flex justify-between items-center p-4 bg-card border border-border shadow-sm rounded-xl">
                <div>
                  <p className="font-bold text-foreground">{order.customer.legal_name || order.customer.fantasy_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.customer.document}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-primary hover:bg-primary/10">
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="bg-card border border-border shadow-sm rounded-xl p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar cliente por nome ou CNPJ..." 
                    className="pl-10 h-12 text-base bg-background"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerResults(true)
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c: any) => (
                      <div 
                        key={c.id} 
                        className="p-4 hover:bg-muted cursor-pointer border border-border rounded-lg bg-background transition-colors"
                        onClick={() => {
                          handleUpdate({ customer_id: c.id })
                          setCustomerSearch('')
                          setShowCustomerResults(false)
                          setCurrentStep(2)
                        }}
                      >
                        <div className="font-bold text-sm text-foreground">{c.legal_name || c.fantasy_name}</div>
                        <div className="text-xs text-muted-foreground flex justify-between mt-1.5">
                          <span>{c.document}</span>
                          <span>{c.city && c.state ? `${c.city}/${c.state}` : ''}</span>
                        </div>
                      </div>
                    ))
                  ) : customerSearch.length > 1 ? (
                    <div className="p-8 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg">Nenhum cliente encontrado com esse nome.</div>
                  ) : (
                    <div className="p-8 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg">Digite o nome do cliente para buscar.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TELA 2: RESUMO DO PEDIDO */}
        <section className={`${currentStep === 2 ? 'block' : 'hidden md:block'} md:order-2 max-w-2xl mx-auto w-full`}>
          
          {order.customer_id && (
            <div className="md:hidden bg-card border border-border shadow-sm rounded-xl p-3 mb-4 flex justify-between items-center">
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Cliente Selecionado</span>
                <span className="text-sm font-bold text-foreground truncate">
                  {customers.find((c: any) => c.id === order.customer_id)?.fantasy_name || customers.find((c: any) => c.id === order.customer_id)?.legal_name || order.customer?.fantasy_name || order.customer?.legal_name || 'Desconhecido'}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentStep(1)}
                className="h-7 text-[10px] px-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold shrink-0 ml-2"
              >
                Trocar
              </Button>
            </div>
          )}

          <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden mb-6">
            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Resumo Total</p>
                <div className="font-black text-2xl text-primary">{formatCurrency(finalTotal)}</div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Em Orçamento</Badge>
            </div>
            
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Itens no pedido</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Quantidade total</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Subtotal em produtos</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {order.total_discount > 0 && (
                <div className="flex justify-between border-b border-border/50 pb-2 text-red-500">
                  <span>Descontos</span>
                  <span>- {formatCurrency(order.total_discount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">Itens Adicionados</h3>
            <Button onClick={() => setCurrentStep(3)} size="sm" className="bg-primary text-white rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Produtos
            </Button>
          </div>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
                  <div className="pr-8">
                    <div className="font-bold text-sm text-foreground mb-1 leading-tight">{item.product?.description}</div>
                    <div className="text-[11px] text-muted-foreground mb-3">Cód: {item.product?.code}</div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Valor Unit.</div>
                        <div className="font-medium text-sm">{formatCurrency(item.unit_price)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Qtde</div>
                        <div className="font-bold text-sm bg-muted px-3 py-1 rounded-md">{item.quantity} un</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Subtotal</div>
                        <div className="font-bold text-primary">{formatCurrency(item.total_price)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => handleDeleteItem(item.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors p-1">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <Button onClick={() => setCurrentStep(3)} variant="outline" className="w-full py-6 mt-4 border-dashed border-2 rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5">
                <Plus className="h-5 w-5 mr-2" /> Tocar aqui para adicionar mais produtos
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-xl bg-muted/10 flex flex-col items-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Seu pedido ainda está vazio.</p>
              <Button onClick={() => setCurrentStep(3)} className="bg-primary rounded-full px-6 shadow-md">
                <Plus className="h-4 w-4 mr-2" /> Ver Catálogo de Produtos
              </Button>
            </div>
          )}

          {/* Opções extras na tela de Pedido */}
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="outline" className="w-full justify-between h-12 rounded-xl bg-card border-primary text-primary hover:bg-primary/5" onClick={() => setCurrentStep(4)}>
              <span className="font-bold">Pagamento e Observações (obrigatório)</span>
              <ChevronDown className="h-5 w-5" />
            </Button>

            <Button onClick={handleGenerateOrder} className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2">
              <Save className="h-5 w-5 mr-2" /> Salvar Pedido
            </Button>

            <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf} variant="outline" className="w-full h-12 text-base border-border font-bold rounded-xl">
              <Download className="h-5 w-5 mr-2 text-primary" /> {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </Button>

            <Button onClick={handleShareWhatsapp} disabled={isGeneratingPdf} variant="outline" className="w-full h-12 text-base border-border font-bold rounded-xl">
              <Share2 className="h-5 w-5 mr-2 text-green-500" /> Compartilhar no WhatsApp
            </Button>

            <Button variant="outline" className="w-full justify-between h-12 rounded-xl bg-card border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 mt-2" onClick={handleDeleteOrder}>
              <span className="font-bold w-full text-center">Cancelar Orçamento</span>
            </Button>
          </div>
        </section>

        {/* TELA 3: PRODUTOS */}
        <section className={`${currentStep === 3 ? 'block' : 'hidden md:block'} md:order-3 max-w-2xl mx-auto w-full`}>
          <ProductSearchInline 
            currentItems={order.items?.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity })) || []}
            priceTableId={order.customer?.price_table_id}
            onUpdateQuantity={handleUpdateQuantityFromSearch}
          />
        </section>

        {/* TELA 4: FINALIZACAO E PAGAMENTO */}
        <section className={`${currentStep === 4 ? 'block' : 'hidden md:block'} md:order-4 max-w-2xl mx-auto w-full`}>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-6">
            
            <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
              <FileText className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Detalhes Finais</h2>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Vendedor</label>
              <select 
                className="w-full border border-input bg-background rounded-lg h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={order.sales_rep_id || ''}
                onChange={(e) => handleUpdate({ sales_rep_id: e.target.value || null })}
              >
                <option value="">Selecione...</option>
                {salesReps.map((rep: any) => (
                  <option key={rep.id} value={rep.id}>{rep.nickname || rep.legal_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Condição de Pagamento</label>
                <select 
                  className="w-full border border-input bg-background rounded-lg h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={order.payment_condition_id || ''}
                  onChange={(e) => handleUpdate({ payment_condition_id: e.target.value || null })}
                >
                  <option value="">Selecione...</option>
                  {paymentConditions.map((pc: any) => (
                    <option key={pc.id} value={pc.id}>{pc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Desconto Geral (%)</label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  className="h-11 rounded-lg"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  onBlur={(e) => {
                    const perc = parseFloat(e.target.value) || 0
                    const amountAfterItemsDiscount = subtotal
                    const newDiscount = amountAfterItemsDiscount * (perc / 100)
                    handleUpdate({ total_discount: newDiscount })
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Informações Adicionais</label>
              <Textarea 
                placeholder="Observações para a nota fiscal, endereço de entrega especial, etc..." 
                defaultValue={order.notes || ''}
                onBlur={(e) => {
                  if (e.target.value !== order.notes) {
                    handleUpdate({ notes: e.target.value })
                  }
                }}
                className="resize-none h-24 rounded-lg"
              />
            </div>
          </div>
        </section>

      </div>

      {/* FLOAT BOTTOM BAR FOR PRODUCTS PAGE (Mobile Only) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_15px_rgba(0,0,0,0.05)] p-4 z-50 transition-transform ${currentStep === 3 ? 'translate-y-0' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{totalItems} itens adicionados</span>
            <span className="font-bold text-lg text-primary">Total: {formatCurrency(finalTotal)}</span>
          </div>
          <Button onClick={() => setCurrentStep(2)} className="bg-primary text-primary-foreground font-bold px-6 rounded-full shadow-md">
            Ver Pedido
          </Button>
        </div>
      </div>
      
      {/* Hidden Invoice Template for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
        <InvoicePrintTemplate ref={printRef} company={company} details={{
          ...order,
          customer: customers.find((c: any) => c.id === order.customer_id) || order.customer,
          payment_condition: paymentConditions.find((pc: any) => pc.id === order.payment_condition_id) || order.payment_condition,
          sales_rep: salesReps.find((sr: any) => sr.id === order.sales_rep_id) || order.sales_rep
        }} />
      </div>

    </div>
  )
      </div>
    </>
  )
}
