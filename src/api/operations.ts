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
  }
}
