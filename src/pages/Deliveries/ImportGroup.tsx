import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { deliveriesApi } from '@/api/deliveries'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { Boxes, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import type { OrderGroup, SalesOrder } from '@/types/database'
import { supabase } from '@/lib/supabase'

export default function ImportGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuth()
  
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  
  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups', company?.id],
    queryFn: () => salesApi.getOrderGroups(company?.id),
    enabled: !!company?.id,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  // Apenas pedidos FATURADOS deste grupo
  const groupOrders = orders.filter((o: SalesOrder) => 
    o.order_group_id === selectedGroupId && 
    o.status === 'Faturado'
  )

  const generateRouteMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Company not found')
      const group = orderGroups.find((g: OrderGroup) => g.id === selectedGroupId)
      if (!group) throw new Error('Group not found')
      
      const orderIds = groupOrders.map((o: SalesOrder) => o.id)
      const { data: allItems } = await supabase
        .from('sales_order_items')
        .select('*, product:products(*)')
        .in('sales_order_id', orderIds)

      // 1. Create Route
      const route = await deliveriesApi.createDeliveryRoute(
        null, // No operation_id
        null, // driver
        null, // helper
        undefined, // date
        `Rota: ${group.name}` // title
      )

      // 2. Group orders by customer
      const ordersByCustomer = groupOrders.reduce((acc: any, order: SalesOrder) => {
        const custId = order.customer_id
        if (!custId) return acc
        if (!acc[custId]) {
          acc[custId] = {
            customer: order.customer,
            orders: [],
            items: []
          }
        }
        acc[custId].orders.push(order)
        const orderItems = allItems?.filter(i => i.sales_order_id === order.id) || []
        acc[custId].items.push(...orderItems)
        return acc
      }, {})

      // 3. For each customer, create DeliveryClient and DeliveryItems
      for (const custId of Object.keys(ordersByCustomer)) {
        const { customer, orders: custOrders, items } = ordersByCustomer[custId]
        const orderNumbers = custOrders.map((o: any) => o.order_number).join(', ')
        
        const client = await deliveriesApi.createDeliveryClient({
          company_id: company.id,
          delivery_route_id: route.id,
          customer_id: custId,
          name: customer.fantasy_name || customer.legal_name || 'Desconhecido',
          order_number: orderNumbers,
          address: `${customer.address || ''}, ${customer.number || ''} - ${customer.city || ''}/${customer.state || ''}`,
          phone: customer.phone1,
          latitude: customer.latitude,
          longitude: customer.longitude,
          status: 'pending'
        })

        // 4. Create items
        // Aggregate items by product_id
        const aggregatedItems = items.reduce((acc: any, item: any) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = { ...item }
          } else {
            acc[item.product_id].quantity += item.quantity
          }
          return acc
        }, {})

        for (const prodId of Object.keys(aggregatedItems)) {
          const item = aggregatedItems[prodId]
          await deliveriesApi.createDeliveryItem({
            company_id: company.id,
            delivery_client_id: client.id,
            product_id: item.product_id,
            product_code: item.product?.code || '',
            description: item.product?.description || 'Produto',
            quantity_expected: item.quantity,
            quantity_scanned: 0,
            status: 'pending'
          })
        }
      }

      return route
    },
    onSuccess: (route) => {
      toast.success('Rota de entrega gerada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      navigate(`/entregas/${route.id}`)
    },
    onError: (err: any) => {
      toast.error(`Erro ao gerar rota: ${err.message}`)
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 p-4 md:p-6 slide-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/entregas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Importar Grupo de Pedidos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere uma rota de entrega a partir dos pedidos faturados de um grupo.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Selecione o Grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <select
            className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">-- Selecione um grupo --</option>
            {orderGroups.filter((g: OrderGroup) => g.active).map((group: OrderGroup) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>

          {selectedGroupId && (
            <div className="bg-muted/30 border border-border rounded-xl p-6 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  {groupOrders.length} {groupOrders.length === 1 ? 'pedido faturado encontrado' : 'pedidos faturados encontrados'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas pedidos com status "Faturado" serão incluídos na rota.
                </p>
              </div>

              {groupOrders.length > 0 && (
                <div className="pt-4 border-t border-border mt-4 max-w-xs mx-auto">
                  <Button 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => generateRouteMutation.mutate()}
                    disabled={generateRouteMutation.isPending}
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {generateRouteMutation.isPending ? 'Gerando...' : 'Gerar Rota de Entrega'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
