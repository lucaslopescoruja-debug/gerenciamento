import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { customersApi } from '@/api/customers'
import { maxiprodApi } from '@/api/maxiprod'
import { useSalesCart } from '@/stores/salesCart'
import { ArrowLeft, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'

export default function CartReview() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { customer_id, payment_condition_id, items, notes, setPaymentCondition, setNotes, getTotal, clearCart } = useSalesCart()
  const [discountPerc, setDiscountPerc] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if empty
  if (!customer_id || items.length === 0) {
    navigate('/vendas/pedidos')
    return null
  }

  const { data: customer } = useQuery({
    queryKey: ['customer', customer_id],
    queryFn: () => customersApi.getCustomer(customer_id),
  })

  const { data: customerPaymentConditions = [] } = useQuery({
    queryKey: ['customer_payment_conditions', customer_id],
    queryFn: () => salesApi.getCustomerPaymentConditions(customer_id),
  })

  const { data: allPaymentConditions = [] } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: salesApi.getPaymentConditions,
  })

  // Filter allowed payment conditions for this customer
  const allowedPaymentConditions = allPaymentConditions.filter(pc => 
    customerPaymentConditions.some(cpc => cpc.payment_condition_id === pc.id) && pc.active
  )

  const subtotal = getTotal()
  const discountAmount = subtotal * (discountPerc / 100)
  const total = subtotal - discountAmount

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      if (!payment_condition_id) throw new Error('Selecione uma condição de pagamento')
      if (allowedPaymentConditions.length > 0 && !allowedPaymentConditions.find(pc => pc.id === payment_condition_id)) {
        throw new Error('Condição de pagamento inválida para este cliente')
      }

      const orderPayload = {
        customer_id: customer_id as string,
        sales_rep_id: customer?.sales_rep_id || null, 
        payment_condition_id: payment_condition_id as string,
        price_table_id: customer?.price_table_id || null,
        status: 'Enviado' as const, 
        total_amount: subtotal,
        total_discount: discountAmount,
        net_amount: total,
        delivery_date: null,
        notes: notes || null
      }

      const orderItemsPayload = items.map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.price,
        discount_percent: discountPerc,
        net_price: i.price * (1 - (discountPerc / 100)),
        total_price: (i.price * i.quantity) * (1 - (discountPerc / 100))
      }))

      const createdOrder = await salesApi.createSalesOrder(orderPayload)
      
      const orderItemsToInsert = orderItemsPayload.map(item => ({
        ...item,
        sales_order_id: createdOrder.id
      }))
      
      await salesApi.addSalesOrderItems(orderItemsToInsert)

      // Tenta enviar para o ERP aguardando a resposta
      try {
        await maxiprodApi.sendSalesOrder(createdOrder.id)
      } catch (err: any) {
        console.error('Falha ao enviar para o ERP:', err)
        return { createdOrder, maxiprodError: err.message }
      }

      return { createdOrder, maxiprodError: null }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      clearCart()
      if (data.maxiprodError) {
        toast.warning(`Salvo no app, mas falhou na Maxiprod: ${data.maxiprodError}`)
      } else {
        toast.success('Pedido enviado para a Maxiprod com sucesso!')
      }
      navigate('/vendas/pedidos')
    },
    onError: (e: any) => {
      toast.error(`Erro ao enviar pedido: ${e.message}`)
      setIsSubmitting(false)
    }
  })

  const handleFinalize = () => {
    if (!payment_condition_id) {
      toast.error('É obrigatório selecionar a condição de pagamento')
      return
    }
    setIsSubmitting(true)
    submitOrderMutation.mutate()
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-60">
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Revisar Pedido</h1>
          <p className="text-sm text-muted-foreground">Confira os itens e finalize o pedido</p>
        </div>
      </div>

      <div className="space-y-4 px-2">
        
        {/* Cliente Info */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Cliente</h3>
          <p className="font-bold text-foreground">{customer?.legal_name || customer?.fantasy_name || 'Carregando...'}</p>
          <p className="text-sm text-muted-foreground">{customer?.document}</p>
        </div>

        {/* Resumo dos Itens */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Itens do Pedido ({items.length})</h3>
            <Button variant="link" className="h-auto p-0 text-primary text-xs" onClick={() => navigate('/vendas/novo-pedido/produtos')}>Editar</Button>
          </div>
          <div className="space-y-3 divide-y divide-border">
            {items.map((item: any) => (
              <div key={item.product_id} className="pt-3 first:pt-0 flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity}x {formatCurrency(item.price)}</p>
                </div>
                <div className="font-bold text-sm text-foreground shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condição de Pagamento */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-emerald-100 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-900">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-2">Condição de Pagamento *</h3>
          {allowedPaymentConditions.length === 0 ? (
            <p className="text-sm text-red-500 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Este cliente não possui condições de pagamento liberadas.
            </p>
          ) : (
            <div className="space-y-2">
              {allowedPaymentConditions.map(pc => (
                <label key={pc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${payment_condition_id === pc.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-300' : 'border-border bg-background hover:bg-muted'}`}>
                  <input 
                    type="radio" 
                    name="payment_condition"
                    checked={payment_condition_id === pc.id}
                    onChange={() => setPaymentCondition(pc.id)}
                    className="w-4 h-4 text-emerald-600 border-border focus:ring-emerald-500"
                  />
                  <span className="font-medium text-sm flex-1">{pc.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Descontos e Observações */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-4">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Desconto (%)</h3>
            <Input 
              type="number"
              min="0"
              max="100"
              value={discountPerc || ''}
              onChange={e => setDiscountPerc(parseFloat(e.target.value) || 0)}
              className="h-12 bg-muted font-bold text-lg"
              placeholder="0%"
            />
          </div>
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Observações</h3>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
              placeholder="Ex: Entregar na doca 2..."
            />
          </div>
        </div>

      </div>

      {/* Floating Finalize Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500 font-medium">
              <span>Desconto ({discountPerc}%)</span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t border-border">
            <span>Total</span>
            <span className="text-emerald-600 dark:text-emerald-500">{formatCurrency(total)}</span>
          </div>
        </div>
        <Button 
          className="w-full h-12 text-base font-bold rounded-xl"
          disabled={!payment_condition_id || isSubmitting}
          onClick={handleFinalize}
        >
          {isSubmitting ? 'Enviando...' : 'Finalizar Pedido'}
          {!isSubmitting && <CheckCircle2 className="h-5 w-5 ml-2" />}
        </Button>
      </div>
      
      <style>{`
        .pb-safe { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
      `}</style>
    </div>
  )
}
