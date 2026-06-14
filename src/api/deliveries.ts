import { supabase } from '@/lib/supabase'
import type { DeliveryRoute, DeliveryClient, DeliveryItem } from '@/types/database'

export const deliveriesApi = {
  async getDeliveryRoutes() {
        const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users!driver_id ( name ),
        helper:users!helper_id ( name )
      `)
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getDeliveryRoute(id: string) {
        const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users!driver_id ( name ),
        helper:users!helper_id ( name )
      `)
      .eq('id', id)
      
      .single()
    if (error) throw error
    return data
  },

  async getDeliveryRouteByOperationId(operationId: string) {
        const { data, error } = await supabase
      .from('delivery_routes')
      .select('*, driver:users!driver_id ( name ), helper:users!helper_id ( name )')
      .eq('operation_id', operationId)
      
      .maybeSingle()
    if (error) throw error
    return data
  },

  async createDeliveryRoute(operationId: string, driverId?: string | null, helperId?: string | null, scheduledDate?: string) {
        const payload: any = { operation_id: operationId}
    if (driverId) payload.driver_id = driverId
    if (helperId) payload.helper_id = helperId
    if (scheduledDate) payload.scheduled_date = scheduledDate

    const { data, error } = await supabase
      .from('delivery_routes')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return data as DeliveryRoute
  },

  async updateDeliveryRoute(id: string, updates: Partial<DeliveryRoute>) {
        const { data, error } = await supabase
      .from('delivery_routes')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryRoute
  },

  async deleteDeliveryRoute(id: string) {
    const { error } = await supabase
      .from('delivery_routes')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  async getDeliveryClients(routeId: string) {
        const { data, error } = await supabase
      .from('delivery_clients')
      .select('*, delivery_items(*), customer:customers(document, latitude, longitude)')
      .eq('delivery_route_id', routeId)
      
      .order('name')
    if (error) throw error
    return data as (DeliveryClient & { 
      delivery_items: DeliveryItem[], 
      customer?: { document: string | null, latitude?: number | null, longitude?: number | null } 
    })[]
  },

  async getDeliveryClient(clientId: string) {
        const { data, error } = await supabase
      .from('delivery_clients')
      .select('*, customer:customers(document)')
      .eq('id', clientId)
      
      .single()
    if (error) throw error
    return data as DeliveryClient
  },

  async createDeliveryClient(clientData: Partial<DeliveryClient>) {
        const { data, error } = await supabase
      .from('delivery_clients')
      .insert([{ ...clientData}])
      .select()
      .single()
    if (error) throw error
    return data as DeliveryClient
  },

  async updateDeliveryClient(id: string, updates: Partial<DeliveryClient>) {
    const { data, error } = await supabase
      .from('delivery_clients')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error

    if (updates.status && data) {
      await this.recalculateRouteStatus(data.delivery_route_id)
    }

    return data as DeliveryClient
  },

  async recalculateRouteStatus(routeId: string) {
    const { data: clients, error } = await supabase
      .from('delivery_clients')
      .select('status')
      .eq('delivery_route_id', routeId)
    if (error) throw error

    if (!clients || clients.length === 0) return

    const allFinished = clients.every(c => 
      c.status === 'delivered' || 
      c.status === 'delivered_with_divergence' || 
      c.status === 'canceled' || 
      c.status === 'returned'
    )

    const anyFinished = clients.some(c => 
      c.status === 'delivered' || 
      c.status === 'delivered_with_divergence' || 
      c.status === 'canceled' || 
      c.status === 'returned'
    )

    let hasPendingReturns = false
    if (allFinished) {
      const { data: clientsWithItems } = await supabase
        .from('delivery_clients')
        .select('status, delivery_items(quantity_expected, quantity_scanned, returned_to_stock)')
        .eq('delivery_route_id', routeId)
      
      if (clientsWithItems) {
        for (const c of clientsWithItems) {
          const isClientReturned = c.status === 'returned'
          for (const item of c.delivery_items) {
            if (item.returned_to_stock) continue;
            
            let returnQty = 0
            if (isClientReturned) {
              returnQty = item.quantity_expected
            } else {
              returnQty = Math.max(0, item.quantity_expected - item.quantity_scanned)
            }
            if (returnQty > 0) {
              hasPendingReturns = true
              break
            }
          }
          if (hasPendingReturns) break
        }
      }
    }

    let newStatus: 'pending' | 'in_progress' | 'completed' = 'pending'
    if (allFinished && !hasPendingReturns) {
      newStatus = 'completed'
    } else if (anyFinished) {
      newStatus = 'in_progress'
    }

    const { data: routeData } = await supabase
      .from('delivery_routes')
      .select('operation_id')
      .eq('id', routeId)
      .single()

    await supabase
      .from('delivery_routes')
      .update({ status: newStatus })
      .eq('id', routeId)

    if (routeData?.operation_id) {
      await supabase
        .from('operations')
        .update({ status: newStatus === 'completed' ? 'completed' : 'dispatched' })
        .eq('id', routeData.operation_id)
    }
  },

  async confirmRouteReturn(routeId: string, scannedItems: any[], hasDivergence: boolean) {
    
    const { data: route } = await supabase
      .from('delivery_routes')
      .select('operation:operations(load_number)')
      .eq('id', routeId)
      .single()

    // Atualizar estoque e marcar itens como approved
    for (const item of scannedItems) {
      if (item.scannedQty > 0) {
        // Voltar pro estoque
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
          
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.scannedQty })
            .eq('id', item.product_id)
        }
      }

      // Se havia itens faltando na devolução, podemos criar alerta individual
      // para não pedir retorno novamente.
      if (item.items_ids && item.items_ids.length > 0) {
        for (const i_id of item.items_ids) {
          await supabase
            .from('delivery_items')
            .update({ returned_to_stock: true })
            .eq('id', i_id)
        }
      }
    }

    // Criar alerta geral da rota para o gestor informando o retorno
    const r = route as any;
    const alertMsg = hasDivergence 
      ? `Retorno da Rota ${r?.operation?.load_number || routeId} finalizado COM DIVERGÊNCIA na quantidade de itens devolvidos.`
      : `Retorno da Rota ${r?.operation?.load_number || routeId} finalizado com sucesso. Todos os itens esperados voltaram pro estoque.`
      
    await supabase.from('system_notes').insert({
      author_id: 'system',
      author_name: 'Sistema',
      content: alertMsg})

    await this.recalculateRouteStatus(routeId)
    return true
  },

  async returnDeliveryClient(clientId: string, return_reason?: string) {
    const { data: client, error: err1 } = await supabase
      .from('delivery_clients')
      .update({ status: 'returned', return_reason })
      .eq('id', clientId)
      
      .select()
      .single()
    if (err1) throw err1

    if (client) {
      await this.recalculateRouteStatus(client.delivery_route_id)
    }

    return client as DeliveryClient
  },

  async deleteDeliveryClient(id: string) {
    const { error } = await supabase
      .from('delivery_clients')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  async getDeliveryItems(clientId: string) {
        const { data, error } = await supabase
      .from('delivery_items')
      .select('*')
      .eq('delivery_client_id', clientId)
      
      .order('description')
    if (error) throw error
    return data as DeliveryItem[]
  },

  async updateDeliveryItemQuantity(itemId: string, quantity_scanned: number, status: string, return_reason?: string) {
    const updates: any = { quantity_scanned, status, return_reason }
    if (return_reason) {
      updates.approval_status = 'pending'
    }
    const { data, error } = await supabase
      .from('delivery_items')
      .update(updates)
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async updateDeliveryItem(itemId: string, updates: Partial<DeliveryItem>) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update(updates)
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async addDeliveryItem(clientId: string, item: Partial<DeliveryItem>) {
        const { data, error } = await supabase
      .from('delivery_items')
      .insert([{ ...item, delivery_client_id: clientId}])
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async deleteDeliveryItem(id: string) {
    const { error } = await supabase
      .from('delivery_items')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  async importDeliveryClients(routeId: string, clientsData: any[]) {
        for (const c of clientsData) {
      const { data: client, error: clientErr } = await supabase
        .from('delivery_clients')
        .insert([{
          delivery_route_id: routeId,
          customer_id: c.customer_id || null,
          name: c.name,
          address: c.address,
          phone: c.phone,
          notes: c.notes,
          order_number: c.order_number}])
        .select()
        .single()
      
      if (clientErr) throw clientErr

      if (c.items && c.items.length > 0) {
        const itemsToInsert = c.items.map((i: any) => ({
          ...i,
          delivery_client_id: client.id}))
        const { error: itemsErr } = await supabase
          .from('delivery_items')
          .insert(itemsToInsert)
        if (itemsErr) throw itemsErr
      }
    }
    return true
  },

  async requestItemApproval(itemId: string, requestedQty: number) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update({ approval_status: 'pending', requested_qty: requestedQty })
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async resolveItemApproval(itemId: string, status: 'approved' | 'rejected', finalQty?: number) {
    const updates: any = {
      approval_status: status,
      requested_qty: null
    }
    if (status === 'approved' && finalQty !== undefined) {
      updates.quantity_scanned = finalQty
      updates.status = 'divergent' // approved extra items are divergent by definition
    }
    const { data, error } = await supabase
      .from('delivery_items')
      .update(updates)
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async getPendingApprovals() {
        const { data, error } = await supabase
      .from('delivery_items')
      .select(`
        *,
        client:delivery_clients (
          name,
          route:delivery_routes (
            driver:users!driver_id ( name ),
            operation:operations ( load_number )
          )
        )
      `)
      .eq('approval_status', 'pending')
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async searchDeliveryProofs(query: string) {
        const cleanQuery = query?.trim() || ''
    if (cleanQuery.length < 2) return []

    const q = `%${cleanQuery}%`
    
    const selectFields = `
      *,
      delivery_items(*),
      route:delivery_routes (
        created_at,
        driver:users!driver_id ( name ),
        operation:operations ( load_number )
      ),
      customer:customers(document)
    `

    // Realiza buscas paralelas para evitar falhas em cascata se alguma coluna tiver tipo incompatível (ex: order_number numérico x ilike)
    const [resName, resOrderLike, resOrderEq, opsRes] = await Promise.all([
      // 1. Busca por nome do cliente
      supabase.from('delivery_clients')
        .select(selectFields)
        
        .ilike('name', q)
        .order('created_at', { ascending: false })
        .limit(30),
        
      // 2. Busca por número do pedido (parcial, se for texto)
      supabase.from('delivery_clients')
        .select(selectFields)
        
        .ilike('order_number', q)
        .order('created_at', { ascending: false })
        .limit(30),
        
      // 3. Busca por número do pedido (exato, funciona se for texto ou número)
      supabase.from('delivery_clients')
        .select(selectFields)
        
        .eq('order_number', cleanQuery)
        .order('created_at', { ascending: false })
        .limit(30),
        
      // 4. Busca por carga (operações)
      supabase.from('operations')
        .select('id')
        
        .ilike('load_number', q)
        .limit(10)
    ])

    let clientsByRoute: any[] = []
    if (opsRes.data && opsRes.data.length > 0) {
      const opIds = opsRes.data.map((o: any) => o.id)
      const { data: routes } = await supabase
        .from('delivery_routes')
        .select('id')
        .in('operation_id', opIds)

      if (routes && routes.length > 0) {
        const routeIds = routes.map((r: any) => r.id)
        const { data: clients } = await supabase
          .from('delivery_clients')
          .select(selectFields)
          .in('delivery_route_id', routeIds)
          .order('created_at', { ascending: false })
          .limit(30)
          
        clientsByRoute = clients || []
      }
    }

    // Mescla todos os resultados bem sucedidos
    const merged = [
      ...(resName.data || []),
      ...(resOrderLike.data || []),
      ...(resOrderEq.data || []),
      ...clientsByRoute
    ]
    
    // Remove duplicatas pelo ID
    const uniqueClients = Array.from(new Map(merged.map(c => [c.id, c])).values())
    
    // Ordena do mais recente para o mais antigo
    return uniqueClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}
