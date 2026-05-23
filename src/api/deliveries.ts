import { supabase } from '@/lib/supabase'
import type { DeliveryRoute, DeliveryClient, DeliveryItem } from '@/types/database'

export const deliveriesApi = {
  async getDeliveryRoutes() {
    const { data, error } = await supabase
      .from('delivery_routes')
      .select(`
        *,
        operation:operations ( load_number ),
        driver:users ( name )
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
        driver:users ( name )
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createDeliveryRoute(operationId: string, driverId: string) {
    const { data, error } = await supabase
      .from('delivery_routes')
      .insert([{ operation_id: operationId, driver_id: driverId }])
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
      .select('*, delivery_items(*)')
      .eq('delivery_route_id', routeId)
      .order('name')
    if (error) throw error
    return data as (DeliveryClient & { delivery_items: DeliveryItem[] })[]
  },

  async getDeliveryClient(clientId: string) {
    const { data, error } = await supabase
      .from('delivery_clients')
      .select('*')
      .eq('id', clientId)
      .single()
    if (error) throw error
    return data as DeliveryClient
  },

  async createDeliveryClient(clientData: Partial<DeliveryClient>) {
    const { data, error } = await supabase
      .from('delivery_clients')
      .insert([clientData])
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
    return data as DeliveryClient
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

  async updateDeliveryItemQuantity(itemId: string, quantity_scanned: number, status: string) {
    const { data, error } = await supabase
      .from('delivery_items')
      .update({ quantity_scanned, status })
      .eq('id', itemId)
      .select()
      .single()
    if (error) throw error
    return data as DeliveryItem
  },

  async addDeliveryItem(clientId: string, item: Partial<DeliveryItem>) {
    const { data, error } = await supabase
      .from('delivery_items')
      .insert([{ ...item, delivery_client_id: clientId }])
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
    // clientsData: [{ name, address, phone, notes, items: [{ product_id, product_code, description, quantity_expected }] }]
    for (const c of clientsData) {
      const { data: client, error: clientErr } = await supabase
        .from('delivery_clients')
        .insert([{
          delivery_route_id: routeId,
          name: c.name,
          address: c.address,
          phone: c.phone,
          notes: c.notes
        }])
        .select()
        .single()
      
      if (clientErr) throw clientErr

      if (c.items && c.items.length > 0) {
        const itemsToInsert = c.items.map((i: any) => ({
          ...i,
          delivery_client_id: client.id
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
            driver:users ( name ),
            operation:operations ( load_number )
          )
        )
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}
