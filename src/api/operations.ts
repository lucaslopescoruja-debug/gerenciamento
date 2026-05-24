import { supabase } from '@/lib/supabase'
import type { Operation, OperationItem } from '@/types/database'

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

  async updateItemQuantity(itemId: string, quantity_scanned: number, status: OperationItem['status']) {
    const { data, error } = await supabase
      .from('operation_items')
      .update({ quantity_scanned, status })
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

  async addOperationItem(operationId: string, item: Omit<OperationItem, 'id' | 'operation_id'>) {
    const { data, error } = await supabase
      .from('operation_items')
      .insert([{ ...item, operation_id: operationId }])
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async createOperation(operation: Omit<Operation, 'id' | 'created_at'>, items: Omit<OperationItem, 'id' | 'operation_id'>[]) {
    // Start a transaction-like flow
    const { data: opData, error: opError } = await supabase
      .from('operations')
      .insert([operation])
      .select()
      .single()
    
    if (opError) throw opError

    const itemsToInsert = items.map(item => ({
      ...item,
      operation_id: opData.id
    }))

    const { error: itemsError } = await supabase
      .from('operation_items')
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    return opData as Operation
  },

  async updateOperationFull(id: string, opData: Partial<Operation>, itemsData: Omit<OperationItem, 'id' | 'operation_id'>[]) {
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
        toInsert.push({ ...newItem, operation_id: id })
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('operation_items').insert(toInsert)
    }

    return true
  },

  async deleteOperation(id: string) {
    // Excluir os itens primeiro para evitar problemas de constraint de chave estrangeira
    await supabase.from('operation_items').delete().eq('operation_id', id)
    
    // Depois exclui a rota
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
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
          
        if (product) {
          const newStock = (product.stock || 0) + item.quantity_scanned
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id)
        }
      }
    }
    
    return true
  }
}
