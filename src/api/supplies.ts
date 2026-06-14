import { supabase } from '@/lib/supabase'
import type { Supply, SupplyRequest, EquipmentOrderSupply } from '@/types/database'

export const suppliesApi = {
  // Supplies (Estoque Geral)
  async getSupplies() {
        const { data, error } = await supabase
      .from('supplies')
      .select('*')
      
      .order('name')
    if (error) throw error
    return data as Supply[]
  },

  async createSupply(supply: Omit<Supply, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
        const { data, error } = await supabase
      .from('supplies')
      .insert([{ ...supply}])
      .select()
      .single()
    if (error) throw error
    return data as Supply
  },

  async updateSupply(id: string, updates: Partial<Supply>) {
    const { data, error } = await supabase
      .from('supplies')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error
    return data as Supply
  },

  async deleteSupply(id: string) {
    const { error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  // Supply Requests (Solicitações do Mecânico)
  async getSupplyRequests() {
        const { data, error } = await supabase
      .from('supply_requests')
      .select('*, mechanic:users!mechanic_id(name), supply:supplies(name, unit)')
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as SupplyRequest[]
  },

  async getMechanicSupplyRequests(mechanicId: string) {
        const { data, error } = await supabase
      .from('supply_requests')
      .select('*, supply:supplies(name, unit)')
      
      .eq('mechanic_id', mechanicId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as SupplyRequest[]
  },

  async createSupplyRequest(request: Omit<SupplyRequest, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'status'>) {
        const { data, error } = await supabase
      .from('supply_requests')
      .insert([{ ...request, status: 'pendente' }])
      .select()
      .single()
    if (error) throw error
    return data as SupplyRequest
  },

  async updateSupplyRequestStatus(id: string, status: 'aprovado' | 'rejeitado') {
    // Busca a request primeiro
    const { data: request, error: fetchError } = await supabase
      .from('supply_requests')
      .select('*')
      .eq('id', id)
      
      .single()
    
    if (fetchError) throw fetchError

    // Se for aprovado, abate do estoque principal
    if (status === 'aprovado' && request.status !== 'aprovado') {
      await supabase.rpc('increment_supply_stock', {
        p_supply_id: request.supply_id,
        p_delta: request.quantity_requested
      })
    }

    const { data, error } = await supabase
      .from('supply_requests')
      .update({ status })
      .eq('id', id)
      
      .select()
      .single()
      
    if (error) throw error
    return data as SupplyRequest
  },

  // Consumo em OS
  async getOrderSupplies(orderId: string) {
    const { data, error } = await supabase
      .from('equipment_order_supplies')
      .select('*, supply:supplies(name, unit)')
      .eq('order_id', orderId)
    if (error) throw error
    return data as EquipmentOrderSupply[]
  },

  async consumeSupplyInOrder(orderId: string, supplyId: string, quantity: number) {
    // 1. Abater do estoque principal (assumindo que o mecânico pega do estoque geral na hora)
    const { error: rpcError } = await supabase.rpc('increment_supply_stock', {
      p_supply_id: supplyId,
      p_delta: -quantity
    })
    if (rpcError) throw rpcError

    // 2. Registrar na OS
    const { data, error } = await supabase
      .from('equipment_order_supplies')
      .insert([{ order_id: orderId, supply_id: supplyId, quantity_consumed: quantity }])
      .select()
      .single()
      
    if (error) throw error
    return data as EquipmentOrderSupply
  }
}
