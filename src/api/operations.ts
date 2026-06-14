import { supabase } from '@/lib/supabase'
import type { Operation, OperationItem, OperationAlert } from '@/types/database'


export const operationsApi = {
  async getOperations() {
    
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Operation[]
  },

  async getOperation(id: string) {
    
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('id', id)
      
      .single()
    if (error) throw error
    return data as Operation
  },

  async getOperationItems(operationId: string) {
    
    const { data, error } = await supabase
      .from('operation_items')
      .select('*')
      .eq('operation_id', operationId)
      
      .order('description')
    if (error) throw error
    return data as OperationItem[]
  },

  async updateOperationStatus(id: string, status: Operation['status'], completed_at?: string) {
    const updates: Partial<Operation> = { status }
    if (completed_at) updates.completed_at = completed_at

    const { data, error } = await supabase
      .from('operations')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error
    return data as Operation
  },

  async updateItemQuantity(
    itemId: string, 
    quantity_scanned: number, 
    status: OperationItem['status'],
    extraUpdates?: Partial<Pick<OperationItem, 'physical_verification' | 'physical_divergence_found' | 'divergence_resolved'>>
  ) {
    const { data, error } = await supabase
      .from('operation_items')
      .update({ 
        quantity_scanned, 
        status,
        ...extraUpdates
      })
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async updateItemExpectedQty(itemId: string, quantity_expected: number) {
    const { data, error } = await supabase
      .from('operation_items')
      .update({ quantity_expected })
      .eq('id', itemId)
      
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async deleteOperationItem(itemId: string) {
    const { error } = await supabase
      .from('operation_items')
      .delete()
      .eq('id', itemId)
      
    if (error) throw error
    return true
  },

  async addOperationItem(operationId: string, item: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>) {
    const { data, error } = await supabase
      .from('operation_items')
      .insert([{ ...item, operation_id: operationId}])
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async createOperation(operation: Omit<Operation, 'id' | 'created_at' | 'company_id'>, items: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>[]) {
    
    const { data: opData, error: opError } = await supabase
      .from('operations')
      .insert([{ ...operation}])
      .select()
      .single()
    
    if (opError) throw opError

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        operation_id: opData.id}))

      const { error: itemsError } = await supabase
        .from('operation_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    return opData as Operation
  },

  async updateOperationFull(id: string, opData: Partial<Operation>, itemsData: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>[]) {
    const { error: opError } = await supabase
      .from('operations')
      .update(opData)
      .eq('id', id)
      
    if (opError) throw opError

    const { data: existingItems, error: existingError } = await supabase
      .from('operation_items')
      .select('*')
      .eq('operation_id', id)
      
    if (existingError) throw existingError

    const existingMap = new Map(existingItems.map(i => [i.product_code, i]))
    const newMap = new Map(itemsData.map(i => [i.product_code, i]))

    // Items to delete
    const toDelete = existingItems.filter(i => !newMap.has(i.product_code)).map(i => i.id)
    if (toDelete.length > 0) {
      await supabase.from('operation_items').delete().in('id', toDelete)
    }

    // Items to update and insert
    const toInsert = []
    for (const newItem of itemsData) {
      const existing = existingMap.get(newItem.product_code)
      if (existing) {
        // Update expected quantity if changed
        if (existing.quantity_expected !== newItem.quantity_expected) {
          await supabase.from('operation_items').update({ quantity_expected: newItem.quantity_expected }).eq('id', existing.id)
        }
      } else {
        toInsert.push({ ...newItem, operation_id: id})
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('operation_items').insert(toInsert)
    }

    return true
  },

  async deleteOperation(id: string) {
    // 1. Obter a operação para verificar status e tipo
    const { data: op } = await supabase
      .from('operations')
      .select('*')
      .eq('id', id)
      .single()

    if (op && op.type === 'LOAD' && (op.status === 'dispatched' || op.status === 'completed')) {
      // 2. Obter os itens da rota
      const { data: items } = await supabase
        .from('operation_items')
        .select('*')
        .eq('operation_id', id)

      if (items) {
        // 3. Devolver os itens despachados ao estoque
        for (const item of items) {
          if (item.quantity_scanned > 0 && item.product_id) {
            await supabase.rpc('increment_stock', { 
              p_product_id: item.product_id, 
              p_delta: item.quantity_scanned 
            });
          }
        }
      }
    }

    // 4. Excluir os itens primeiro para evitar problemas de constraint de chave estrangeira
    await supabase.from('operation_items').delete().eq('operation_id', id)
    
    // 5. Depois exclui a rota
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async finalizeReceiptAndUpdateStock(operationId: string) {
    // 1. Mark as completed
    const now = new Date().toISOString()
    await this.updateOperationStatus(operationId, 'completed', now)

    // 2. Get all items in the operation
    const items = await this.getOperationItems(operationId)
    
    // 3. For each item with quantity_scanned > 0, update product stock
    for (const item of items) {
      if (item.quantity_scanned > 0 && item.product_id) {
        await supabase.rpc('increment_stock', { 
          p_product_id: item.product_id, 
          p_delta: item.quantity_scanned 
        });
      }
    }
    
    return true
  },

  async getPendingStockAdjustments() {
    
    const { data, error } = await supabase
      .from('operation_items')
      .select(`
        *,
        operation:operations (
          load_number,
          driver_name,
          status
        )
      `)
      .eq('physical_divergence_found', true)
      .eq('divergence_resolved', false)
      
      .order('description')
    if (error) throw error
    return data
  },

  async createOperationAlerts(alerts: Omit<OperationAlert, 'id' | 'created_at' | 'resolved' | 'company_id'>[]) {
    
    const alertsToInsert = alerts.map(a => ({
      ...a,
      resolved: false
    }))
    const { data, error } = await supabase
      .from('operation_alerts')
      .insert(alertsToInsert)
      .select()
    if (error) throw error
    return data
  },

  async getPendingOperationAlerts() {
    
    const { data, error } = await supabase
      .from('operation_alerts')
      .select(`
        *,
        operation:operations (
          load_number,
          driver_name
        )
      `)
      .eq('resolved', false)
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async resolveOperationAlert(alertId: string) {
    
    const { data, error } = await supabase
      .from('operation_alerts')
      .update({ resolved: true })
      .eq('id', alertId)
      
      .select()
      .single()
    if (error) throw error
    return data
  },

  async resolveAllOperationAlerts() {
    
    const { data, error } = await supabase
      .from('operation_alerts')
      .update({ resolved: true })
      .eq('resolved', false)
      
      .select()
    if (error) throw error
    return data
  },

  async createReturnOperationFromRoute(routeId: string) {
    
    
    // 1. Fetch route details
    const { data: route, error: routeError } = await supabase
      .from('delivery_routes')
      .select('*, driver:users(name), operation:operations(load_number)')
      .eq('id', routeId)
      
      .single()
    if (routeError) throw routeError

    // 2. Fetch clients and items
    const { data: clients, error: clientsError } = await supabase
      .from('delivery_clients')
      .select('*, delivery_items(*)')
      .eq('delivery_route_id', routeId)
      
    if (clientsError) throw clientsError

    // 3. Calculate returns
    const itemsMap = new Map<string, { product_id: string | null, product_code: string, description: string, quantity_expected: number }>()

    for (const client of clients) {
      const isClientReturned = client.status === 'returned'
      for (const item of client.delivery_items) {
        let returnQty = 0
        if (isClientReturned) {
          returnQty = item.quantity_expected // order entirely returned
        } else {
          returnQty = Math.max(0, item.quantity_expected - item.quantity_scanned) // missing items
        }
        
        if (returnQty > 0) {
          const existing = itemsMap.get(item.product_code)
          if (existing) {
            existing.quantity_expected += returnQty
          } else {
            itemsMap.set(item.product_code, {
              product_id: item.product_id,
              product_code: item.product_code,
              description: item.description,
              quantity_expected: returnQty
            })
          }
        }
      }
    }

    const returnItems = Array.from(itemsMap.values())

    if (returnItems.length === 0) {
      throw new Error('Não há itens para retornar nesta rota.')
    }

    // 4. Create new operation
    const opData: Omit<Operation, 'id' | 'created_at' | 'company_id'> = {
      type: 'RETURN',
      status: 'pending',
      load_number: `RET-${route.operation?.load_number || routeId.substring(0, 5)}`,
      driver_name: route.driver?.name || 'Desconhecido',
      notes: `Retorno gerado automaticamente da Rota: ${route.operation?.load_number || routeId}`}

    const { data: opCreated, error: opError } = await supabase
      .from('operations')
      .insert([{ ...opData}])
      .select()
      .single()
    if (opError) throw opError

    // 5. Create operation items
    const itemsToInsert = returnItems.map(item => ({
      ...item,
      quantity_scanned: 0,
      status: 'pending',
      operation_id: opCreated.id,
      system_stock_at_load: 0,
      physical_verification: 'pending',
      physical_divergence_found: false,
      divergence_resolved: false
    }))

    const { error: itemsError } = await supabase
      .from('operation_items')
      .insert(itemsToInsert)
    if (itemsError) throw itemsError

    return opCreated as Operation
  }
}
