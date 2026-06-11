import { supabase } from '@/lib/supabase'
import type { SalesRep } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const salesRepsApi = {
  async getSalesReps() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('nickname')
    if (error) throw error
    return data as SalesRep[]
  },

  async getSalesRep(id: string) {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as SalesRep
  },

  async createSalesRep(salesRep: Omit<SalesRep, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('sales_reps')
      .insert([{ ...salesRep, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as SalesRep
  },

  async updateSalesRep(id: string, updates: Partial<SalesRep>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('sales_reps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as SalesRep
  },

  async deleteSalesRep(id: string) {
    if (!currentCompanyId) throw new Error('No company context')
    const { error } = await supabase
      .from('sales_reps')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
