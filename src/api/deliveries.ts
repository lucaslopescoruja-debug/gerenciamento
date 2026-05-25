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

    let newStatus: 'pending' | 'in_progress' | 'completed' = 'pending'
    if (allFinished) {
      newStatus = 'completed'
    } else if (anyFinished) {
      newStatus = 'in_progress'
    }

    await supabase
      .from('delivery_routes')
      .update({ status: newStatus })
      .eq('id', routeId)
  },

  async returnDeliveryClient(clientId: string) {
    const { data: client, error: err1 } = await supabase
      .from('delivery_clients')
      .update({ status: 'returned' })
      .eq('id', clientId)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (err1) throw err1

    const { data: items, error: err2 } = await supabase
      .from('delivery_items')
      .select('*')
      .eq('delivery_client_id', clientId)
      .eq('company_id', currentCompanyId)
    if (err2) throw err2

    if (items) {
      for (const item of items) {
        if (item.quantity_expected > 0 && item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (product) {
            const newStock = (product.stock || 0) + item.quantity_expected
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id)
          }
        }
      }
    }

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

  async updateDeliveryItemQuantity(itemId: string, quantity_scanned: number, status: string) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update({ quantity_scanned, status })
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
