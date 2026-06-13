import { supabase } from '@/lib/supabase'
import { Equipment, EquipmentOrder, EquipmentHistory } from '@/types/database'

let currentCompanyId: string | null = null;
export const setEquipmentsCompanyId = (id: string | null) => {
  currentCompanyId = id;
};

export const equipmentsApi = {
  // Equipments
  async getEquipments() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('equipments')
      .select('*, customer:customers(legal_name, fantasy_name)')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Equipment[]
  },

  async getEquipment(id: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('equipments')
      .select('*, customer:customers(legal_name, fantasy_name)')
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .single()
    if (error) throw error
    return data as Equipment
  },

  async createEquipment(equipmentData: Partial<Equipment>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('equipments')
      .insert([{ ...equipmentData, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error

    await this.createHistory(data.id, 'Cadastrado no Sistema', null)

    return data as Equipment
  },

  async updateEquipment(id: string, updates: Partial<Equipment>, historyNote?: string) {
    const { data, error } = await supabase
      .from('equipments')
      .update(updates)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error

    if (historyNote) {
      await this.createHistory(id, historyNote, updates.current_customer_id)
    }

    return data as Equipment
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', id)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  // Orders (OS)
  async getOrders() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, fantasy_name, address, number, neighborhood, city, state), equipment:equipments(patrimony, type, model), driver:users(name)')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async getDriverOrders(driverId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, fantasy_name, address, number, neighborhood, city, state), equipment:equipments(patrimony, type, model)')
      .eq('company_id', currentCompanyId)
      .eq('driver_id', driverId)
      .in('status', ['pendente', 'em_rota'])
      .order('scheduled_date', { ascending: true })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async createOrder(orderData: Partial<EquipmentOrder>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('equipment_orders')
      .insert([{ ...orderData, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as EquipmentOrder
  },

  async updateOrder(id: string, updates: Partial<EquipmentOrder>) {
    const { data, error } = await supabase
      .from('equipment_orders')
      .update(updates)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as EquipmentOrder
  },

  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('equipment_orders')
      .delete()
      .eq('id', id)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  // History
  async createHistory(equipmentId: string, action: string, customerId?: string | null, notes?: string) {
    if (!currentCompanyId) return
    const { error } = await supabase
      .from('equipment_history')
      .insert([{
        company_id: currentCompanyId,
        equipment_id: equipmentId,
        customer_id: customerId || null,
        action,
        notes,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
    if (error) console.error('Failed to create history', error)
  },

  async getEquipmentHistory(equipmentId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('equipment_history')
      .select('*, customer:customers(legal_name, fantasy_name), user:users(name)')
      .eq('equipment_id', equipmentId)
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentHistory[]
  },

  async getCustomerEquipments(customerId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .eq('current_customer_id', customerId)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return data as Equipment[]
  }
}
