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

      // Tenta enviar para o ERP em background
      maxiprodApi.sendSalesOrder(createdOrder.id).catch(err => {
        console.error('Falha ao enviar para o ERP:', err)
        // Poderiamos disparar um toast aqui se o mutate() retornar o erro, 
        // mas a regra é salvar localmente de qualquer forma.
      })

      return createdOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      clearCart()
      toast.success('Pedido enviado com sucesso!')
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
    <div className="flex flex-col h-screen bg-gray-50 pb-[100px]">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="font-bold text-lg text-gray-900">Revisar Pedido</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        
        {/* Cliente Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Cliente</h3>
          <p className="font-bold text-gray-900">{customer?.fantasy_name || customer?.legal_name || 'Carregando...'}</p>
          <p className="text-sm text-gray-500">{customer?.document}</p>
        </div>

        {/* Resumo dos Itens */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Itens do Pedido ({items.length})</h3>
            <Button variant="link" className="h-auto p-0 text-primary text-xs" onClick={() => navigate('/vendas/novo-pedido/produtos')}>Editar</Button>
          </div>
          <div className="space-y-3 divide-y divide-gray-50">
            {items.map((item: any) => (
              <div key={item.product_id} className="pt-3 first:pt-0 flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity}x {formatCurrency(item.price)}</p>
                </div>
                <div className="font-bold text-sm text-gray-900 shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condição de Pagamento */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 bg-emerald-50/30">
          <h3 className="text-xs font-bold text-emerald-600 uppercase mb-2">Condição de Pagamento *</h3>
          {allowedPaymentConditions.length === 0 ? (
            <p className="text-sm text-red-500 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Este cliente não possui condições de pagamento liberadas.
            </p>
          ) : (
            <div className="space-y-2">
              {allowedPaymentConditions.map(pc => (
                <label key={pc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${payment_condition_id === pc.id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="payment_condition"
                    checked={payment_condition_id === pc.id}
                    onChange={() => setPaymentCondition(pc.id)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-sm flex-1">{pc.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Descontos e Observações */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Desconto (%)</h3>
            <Input 
              type="number"
              min="0"
              max="100"
              value={discountPerc || ''}
              onChange={e => setDiscountPerc(parseFloat(e.target.value) || 0)}
              className="h-12 bg-gray-50 font-bold text-lg"
              placeholder="0%"
            />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Observações</h3>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
              placeholder="Ex: Entregar na doca 2..."
            />
          </div>
        </div>

      </div>

      {/* Floating Finalize Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500 font-medium">
              <span>Desconto ({discountPerc}%)</span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="text-emerald-600">{formatCurrency(total)}</span>
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
