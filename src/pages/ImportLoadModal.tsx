import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Boxes } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { salesApi } from '@/api/sales'
import { operationsApi } from '@/api/operations'
import { deliveriesApi } from '@/api/deliveries'
import { useNavigate } from 'react-router-dom'

interface ImportLoadModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportLoadModal({ isOpen, onOpenChange }: ImportLoadModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups'],
    queryFn: salesApi.getOrderGroups,
  })

  // To get items, we might need to fetch full order details for the faturado ones
  // Or we just get all orders and filter
  const { data: orders = [] } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const handleImport = async () => {
    if (!selectedGroupId) {
      toast.error('Selecione um grupo primeiro')
      return
    }

    setIsImporting(true)
    try {
      const groupOrders = orders.filter(o => o.order_group_id === selectedGroupId && o.status === 'Faturado')
      
      if (groupOrders.length === 0) {
        toast.error('Nenhum pedido faturado encontrado para este grupo')
        setIsImporting(false)
        return
      }

      // We need to fetch items for all these orders
      // For now, let's just aggregate products.
      // We don't have items in getSalesOrders by default (only some fields). We need to fetch them.
      let allItems: any[] = []
      let loadNotes = ''
      let clientsMap = new Map<string, any>()

      for (const order of groupOrders) {
        const orderDetails = await salesApi.getSalesOrder(order.id)
        if (orderDetails.items) {
          allItems = allItems.concat(orderDetails.items)
        }
        
        const customerName = orderDetails.customer?.fantasy_name || orderDetails.customer?.legal_name || 'Desconhecido'
        loadNotes += `Pedido: ${order.order_number || order.id.slice(0,5)} - ${customerName}\n`
      }

      // Aggregate items by product_id
      const itemsMap = new Map<string, any>()
      allItems.forEach(item => {
        if (!itemsMap.has(item.product_id)) {
          itemsMap.set(item.product_id, {
            product_id: item.product_id,
            product_code: item.product?.code || item.product_id,
            description: item.product?.description || 'Desconhecido',
            quantity_expected: 0,
            system_stock_at_load: item.product?.stock || 0
          })
        }
        itemsMap.get(item.product_id).quantity_expected += item.quantity
      })

      const aggregatedItems = Array.from(itemsMap.values())

      const groupName = orderGroups.find(g => g.id === selectedGroupId)?.name || ''

      // Create the Load Operation first
      const newOp: any = {
        company_id: company!.id,
        type: 'LOAD',
        status: 'pending',
        load_number: `Carga - ${groupName}`,
        client_name: groupName,
        notes: loadNotes.trim()
      }

      const op = await operationsApi.createOperation(newOp, aggregatedItems)

      // Automatically generate the Delivery Route and Clients linked to the Load
      const route = await deliveriesApi.createDeliveryRoute(
        op.id, // Linked to the Load operation!
        null,
        null,
        undefined,
        `Rota: ${groupName}`
      )

      // Group orders by customer for the route
      const ordersByCustomer = groupOrders.reduce((acc: any, order: any) => {
        const custId = order.customer_id
        if (!custId) return acc
        if (!acc[custId]) {
          acc[custId] = { customer: order.customer, orders: [], items: [] }
        }
        acc[custId].orders.push(order)
        const orderItems = allItems?.filter(i => i.sales_order_id === order.id) || []
        acc[custId].items.push(...orderItems)
        return acc
      }, {})

      // Create DeliveryClient and DeliveryItems for each customer
      for (const custId of Object.keys(ordersByCustomer)) {
        const { customer, orders: custOrders, items } = ordersByCustomer[custId]
        const orderNumbers = custOrders.map((o: any) => o.order_number).join(', ')
        
        const client = await deliveriesApi.createDeliveryClient({
          company_id: company!.id,
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

        // Aggregate items by product_id for this specific customer
        const clientItemsMap = items.reduce((acc: any, item: any) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = { ...item }
          } else {
            acc[item.product_id].quantity += item.quantity
          }
          return acc
        }, {})

        for (const prodId of Object.keys(clientItemsMap)) {
          const item = clientItemsMap[prodId]
          await deliveriesApi.createDeliveryItem({
            company_id: company!.id,
            delivery_client_id: client.id,
            product_id: item.product_id,
            product_code: item.product?.code || item.product_code || '',
            description: item.product?.description || 'Produto',
            quantity_expected: item.quantity,
            quantity_scanned: 0,
            status: 'pending'
          })
        }
      }

      toast.success('Carga e Rota de Entrega criadas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      onOpenChange(false)
      navigate(`/conferencia/${op.id}`)

    } catch (err: any) {
      toast.error(`Erro ao importar rota: ${err.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Rota</DialogTitle>
          <DialogDescription>
            Cria uma carga automaticamente com todos os produtos dos pedidos faturados do grupo selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Grupo</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
            >
              <option value="">-- Escolha um Grupo --</option>
              {orderGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <Button 
              className="w-full gap-2" 
              onClick={handleImport}
              disabled={isImporting || !selectedGroupId}
            >
              <Boxes className="h-4 w-4" /> 
              {isImporting ? 'Importando...' : 'Gerar Carga'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
