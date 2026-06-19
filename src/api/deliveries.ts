import { supabase } from '@/lib/supabase'
import type { DeliveryRoute, DeliveryClient, DeliveryItem } from '@/types/database'
import db from '@/db/db'

export const deliveriesApi = {
  async getDeliveryRoutes() {
    if (!navigator.onLine) {
      const routes = await db.routes.toArray()
      return routes as any
    }
    
    const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users!driver_id ( name ),
        helper:users!helper_id ( name )
      `)
      .order('created_at', { ascending: false })
      
    if (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return await db.routes.toArray() as any
      }
      throw error
    }
    return data
  },

  async getDeliveryRoute(id: string) {
    if (!navigator.onLine) {
      const localRoute = await db.routes.get(id)
      if (localRoute) {
        return {
          id: localRoute.id,
          status: localRoute.status,
          operation_id: localRoute.operation_id,
          created_at: localRoute.created_at,
          driver_id: localRoute.driver_id,
          operation: { load_number: localRoute.load_number }
        } as any
      }
      throw new Error('Você está offline e esta rota não está baixada no dispositivo.')
    }
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
    const sanitizedUpdates = { ...updates }
    delete sanitizedUpdates.title
    
    const { data, error } = await supabase
      .from('delivery_routes')
      .update(sanitizedUpdates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error
    return data as DeliveryRoute
  },

  async deleteDeliveryRoute(id: string) {
    // 1. Desvincular equipamentos que estavam na rota, voltando para pendente
    const { error: unlinkError } = await supabase
      .from('equipment_orders')
      .update({ delivery_route_id: null, status: 'pendente' })
      .eq('delivery_route_id', id)
      
    if (unlinkError) throw unlinkError

    // 2. Excluir a rota
    const { error } = await supabase
      .from('delivery_routes')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  async getDeliveryClients(routeId: string) {
    if (!navigator.onLine) {
      const localClients = await db.clients.where('route_id').equals(routeId).toArray()
      return Promise.all(localClients.map(async (client) => {
        const items = await db.products.where('client_id').equals(client.id).toArray()
        return {
          id: client.id,
          delivery_route_id: client.route_id,
          customer_id: client.customer_id,
          name: client.customer_name,
          address: client.address,
          status: client.status,
          order_number: client.order_number,
          delivery_sequence: client.sort_order,
          delivery_items: items,
          customer: {
            document: client.document,
            latitude: client.latitude,
            longitude: client.longitude,
            legal_name: client.customer_name
          }
        } as any
      }))
    }
    const { data, error } = await supabase
      .from('delivery_clients')
      .select('*, delivery_items(*), customer:customers(document, latitude, longitude, legal_name, nickname, fantasy_name)')
      .eq('delivery_route_id', routeId)
      
      .order('name')
    if (error) throw error
    return data as (DeliveryClient & { 
      delivery_items: DeliveryItem[], 
      customer?: { document: string | null, latitude?: number | null, longitude?: number | null } 
    })[]
  },

  async getDeliveryClient(clientId: string) {
    const fallbackToLocal = async () => {
      const client = await db.clients.get(clientId)
      if (client) {
        return {
          id: client.id,
          delivery_route_id: client.route_id,
          name: client.customer_name,
          address: client.address,
          status: client.status,
          order_number: client.order_number,
          delivery_sequence: client.sort_order,
          customer: { document: client.document }
        } as any
      }
      throw new Error('Você está offline e este cliente não está baixado no dispositivo.')
    }

    if (!navigator.onLine) {
      return fallbackToLocal()
    }

    try {
      const { data, error } = await supabase
        .from('delivery_clients')
        .select('*, customer:customers(document)')
        .eq('id', clientId)
        .single()
        
      if (error) {
        if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
          return fallbackToLocal()
        }
        throw error
      }
      return data as DeliveryClient
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('fetch') || e.message?.toLowerCase().includes('network')) {
        return fallbackToLocal()
      }
      throw e
    }
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
    const saveOffline = async () => {
      await db.clients.update(id, updates as any)
      await db.sync_queue.add({
        type: 'CONFIRM_DELIVERY',
        payload: { action: 'updateDeliveryClient', id, updates },
        created_at: Date.now(),
        status: 'pending'
      })
      return { id, ...updates } as any
    }

    if (!navigator.onLine) {
      return saveOffline()
    }

    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 6000));
      const request = supabase.from('delivery_clients').update(updates).eq('id', id).select().single();
      const { data, error } = await Promise.race([request, timeout]) as any;
      
      if (error) throw error

      if (updates.status && data) {
        await this.recalculateRouteStatus(data.delivery_route_id)
      }

      return data as DeliveryClient
    } catch (error: any) {
      if (error.message === 'Network timeout' || error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
        return saveOffline()
      }
      throw error
    }
  },

  async recalculateRouteStatus(routeId: string) {
    const { data: clients, error } = await supabase
      .from('delivery_clients')
      .select('status')
      .eq('delivery_route_id', routeId)
    if (error) throw error

    const { data: routeOrders, error: errorOrders } = await supabase
      .from('equipment_orders')
      .select('status')
      .eq('delivery_route_id', routeId)
    if (errorOrders) throw errorOrders

    const allStops = [
      ...(clients || []),
      ...(routeOrders || [])
    ]

    if (allStops.length === 0) return

    const allFinished = allStops.every(c => 
      c.status === 'delivered' || 
      c.status === 'concluido' ||
      c.status === 'delivered_with_divergence' || 
      c.status === 'canceled' || 
      c.status === 'cancelado' || 
      c.status === 'returned'
    )

    const anyFinished = allStops.some(c => 
      c.status === 'delivered' || 
      c.status === 'concluido' ||
      c.status === 'delivered_with_divergence' || 
      c.status === 'canceled' || 
      c.status === 'cancelado' || 
      c.status === 'returned'
    )

    const { data: routeData } = await supabase.from('delivery_routes').select('status').eq('id', routeId).single()
    const currentStatus = routeData?.status

    if (currentStatus === 'returned') return

    let newStatus: string = 'pending'
    if (allFinished) {
      newStatus = 'completed'
    } else if (anyFinished) {
      newStatus = 'in_progress'
    }

    await supabase
      .from('delivery_routes')
      .update({ status: newStatus })
      .eq('id', routeId)

    // A Carga (operation) NÃO é finalizada aqui. Ela permanece em andamento (dispatched)
    // até que seja feito o "Retorno de Rota" no sistema.
  },

  async confirmRouteReturn(routeId: string, scannedItems: any[], hasDivergence: boolean) {
    
    const { data: route } = await supabase
      .from('delivery_routes')
      .select('operation_id, operation:operations(load_number), company_id')
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

    await supabase.from('delivery_routes').update({ status: 'returned' }).eq('id', routeId)

    const returnedItems = scannedItems.filter(i => i.scannedQty > 0)
    if (returnedItems.length > 0) {
      // Adicionar os itens também à carga (operation) para que apareçam na lista de mercadorias carregadas
      if (route?.operation_id) {
        const opItemsToInsert = returnedItems.map(i => ({
          operation_id: route.operation_id,
          product_id: i.product_id,
          product_code: i.product_code,
          description: `🔄 Devolução: ${i.description}`,
          quantity_expected: 0,
          quantity_scanned: i.scannedQty,
          status: 'ok',
          company_id: route?.company_id
        }))
        await supabase.from('operation_items').insert(opItemsToInsert)
      }
    }
    
    // We can call recalculateRouteStatus just to be safe, it will preserve 'returned' now
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
    const fallbackToLocal = async () => {
      return await db.products.where('client_id').equals(clientId).toArray() as any
    }

    if (!navigator.onLine) {
      return fallbackToLocal()
    }

    try {
      const { data, error } = await supabase
        .from('delivery_items')
        .select('*')
        .eq('delivery_client_id', clientId)
        .order('description')
        
      if (error) {
        if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
          return fallbackToLocal()
        }
        throw error
      }
      return data as DeliveryItem[]
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('fetch') || e.message?.toLowerCase().includes('network')) {
        return fallbackToLocal()
      }
      throw e
    }
  },

  async updateDeliveryItemQuantity(itemId: string, quantity_scanned: number, status: string, return_reason?: string, requested_by_name?: string) {
    const updates: any = { quantity_scanned, status, return_reason }
    if (return_reason) {
      updates.approval_status = 'pending'
      if (requested_by_name) updates.requested_by_name = requested_by_name
    }

    const saveOffline = async () => {
      await db.products.update(itemId, updates)
      await db.sync_queue.add({
        type: 'CONFIRM_DELIVERY',
        payload: { action: 'updateDeliveryItemQuantity', itemId, updates },
        created_at: Date.now(),
        status: 'pending'
      })
      return { id: itemId, ...updates } as any
    }

    if (!navigator.onLine) {
      return saveOffline()
    }

    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 6000));
      const request = supabase.from('delivery_items').update(updates).eq('id', itemId).select().single();
      const { data, error } = await Promise.race([request, timeout]) as any;
      
      if (error) throw error
      return data as DeliveryItem
    } catch (error: any) {
      if (error.message === 'Network timeout' || error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
        return saveOffline()
      }
      throw error
    }
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

  async requestItemApproval(itemId: string, requestedQty: number, requested_by_name?: string) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update({ approval_status: 'pending', requested_qty: requestedQty, requested_by_name })
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

  async getPendingApprovals(company_id?: string) {
    let query = supabase
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
      .eq('approval_status', 'pending');
      
    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false })
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
