import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const customersApi = {
  async getCustomers() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('nickname', { ascending: true })
    if (error) throw error
    return data as Customer[]
  },

  async getCustomer(id: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('customers')
      .select('*, equipments:customer_equipments(*)')
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .single()
    if (error) throw error
    return data as Customer
  },

  async createCustomer(customer: Partial<Customer>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { equipments, ...customerData } = customer
    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customerData, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error

    if (equipments && equipments.length > 0) {
      await supabase.from('customer_equipments').insert(
        equipments.map(eq => ({ ...eq, customer_id: data.id, company_id: currentCompanyId }))
      )
    }

    return data as Customer
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { equipments, ...customerData } = updates
    const { data, error } = await supabase
      .from('customers')
      .update({ ...customerData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error

    if (equipments) {
      // Very simple sync: delete all and re-insert
      await supabase.from('customer_equipments').delete().eq('customer_id', id)
      if (equipments.length > 0) {
        await supabase.from('customer_equipments').insert(
          equipments.map(({ id: _id, created_at, updated_at, ...eq }) => ({ 
            ...eq, 
            customer_id: id, 
            company_id: currentCompanyId 
          }))
        )
      }
    }

    return data as Customer
  },

  async deleteCustomer(id: string) {
    if (!currentCompanyId) throw new Error('No company context')
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  }
}
