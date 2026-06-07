import { supabase } from '@/lib/supabase'
import type { DeliveryRoute, DeliveryClient, DeliveryItem } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const deliveriesApi = {
  async getDeliveryRoutes() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users ( name )
      `)
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getDeliveryRoute(id: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users ( name )
      `)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .single()
    if (error) throw error
    return data
  },

  async getDeliveryRouteByOperationId(operationId: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('delivery_routes')
      .select('*, driver:users ( name )')
      .eq('operation_id', operationId)
      .eq('company_id', currentCompanyId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async createDeliveryRoute(operationId: string, driverId: string) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('delivery_routes')
      .insert([{ operation_id: operationId, driver_id: driverId, company_id: currentCompanyId }])
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
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async getDeliveryClients(routeId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('delivery_clients')
      .select('*, delivery_items(*)')
      .eq('delivery_route_id', routeId)
      .eq('company_id', currentCompanyId)
      .order('name')
    if (error) throw error
    return data as (DeliveryClient & { delivery_items: DeliveryItem[] })[]
  },

  async getDeliveryClient(clientId: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('delivery_clients')
      .select('*')
      .eq('id', clientId)
      .eq('company_id', currentCompanyId)
      .single()
    if (error) throw error
    return data as DeliveryClient
  },

  async createDeliveryClient(clientData: Partial<DeliveryClient>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('delivery_clients')
      .insert([{ ...clientData, company_id: currentCompanyId }])
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
      .eq('company_id', currentCompanyId)
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
    if (!currentCompanyId) throw new Error('No company context')

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
      content: alertMsg,
      company_id: currentCompanyId
    })

    await this.recalculateRouteStatus(routeId)
    return true
  },

  async returnDeliveryClient(clientId: string, return_reason?: string) {
    const { data: client, error: err1 } = await supabase
      .from('delivery_clients')
      .update({ status: 'returned', return_reason })
      .eq('id', clientId)
      .eq('company_id', currentCompanyId)
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
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async getDeliveryItems(clientId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('delivery_items')
      .select('*')
      .eq('delivery_client_id', clientId)
      .eq('company_id', currentCompanyId)
      .order('description')
    if (error) throw error
    return data as DeliveryItem[]
  },

  async updateDeliveryItemQuantity(itemId: string, quantity_scanned: number, status: string, return_reason?: string) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update({ quantity_scanned, status, return_reason })
      .eq('id', itemId)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async addDeliveryItem(clientId: string, item: Partial<DeliveryItem>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('delivery_items')
      .insert([{ ...item, delivery_client_id: clientId, company_id: currentCompanyId }])
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
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async importDeliveryClients(routeId: string, clientsData: any[]) {
    if (!currentCompanyId) throw new Error('No company context')
    for (const c of clientsData) {
      const { data: client, error: clientErr } = await supabase
        .from('delivery_clients')
        .insert([{
          delivery_route_id: routeId,
          name: c.name,
          address: c.address,
          phone: c.phone,
          notes: c.notes,
          order_number: c.order_number,
          company_id: currentCompanyId
        }])
        .select()
        .single()
      
      if (clientErr) throw clientErr

      if (c.items && c.items.length > 0) {
        const itemsToInsert = c.items.map((i: any) => ({
          ...i,
          delivery_client_id: client.id,
          company_id: currentCompanyId
        }))
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
      .eq('company_id', currentCompanyId)
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
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async getPendingApprovals() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('delivery_items')
      .select(`
        *,
        client:delivery_clients (
          name,
          route:delivery_routes (
            driver:users ( name ),
            operation:operations ( load_number )
          )
        )
      `)
      .eq('approval_status', 'pending')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async searchDeliveryProofs(query: string) {
    if (!currentCompanyId) return []
    if (!query || query.trim().length < 2) return []

    const q = `%${query.trim()}%`

    const { data: clientsByName, error: err1 } = await supabase
      .from('delivery_clients')
      .select(`
        *,
        delivery_items(*),
        route:delivery_routes (
          created_at,
          driver:users ( name ),
          operation:operations ( load_number )
        )
      `)
      .eq('company_id', currentCompanyId)
      .or(`name.ilike.${q},order_number.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(30)

    if (err1) throw err1

    const { data: clientsByRoute, error: err2 } = await supabase
      .from('delivery_clients')
      .select(`
        *,
        delivery_items(*),
        route:delivery_routes!inner (
          created_at,
          driver:users ( name ),
          operation:operations!inner ( load_number )
        )
      `)
      .eq('company_id', currentCompanyId)
      .ilike('route.operation.load_number', q)
      .order('created_at', { ascending: false })
      .limit(30)

    if (err2) throw err2

    const merged = [...(clientsByName || []), ...(clientsByRoute || [])]
    const uniqueClients = Array.from(new Map(merged.map(c => [c.id, c])).values())
    
    return uniqueClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}
