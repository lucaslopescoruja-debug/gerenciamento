import { supabase } from '@/lib/supabase'
import type { PriceTable } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const priceTablesApi = {
  async getPriceTables() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('price_tables')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('name')
    if (error) throw error
    return data as PriceTable[]
  },

  async getPriceTable(id: string) {
    const { data, error } = await supabase
      .from('price_tables')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as PriceTable
  },

  async createPriceTable(priceTable: Omit<PriceTable, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('price_tables')
      .insert([{ ...priceTable, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as PriceTable
  },

  async updatePriceTable(id: string, updates: Partial<PriceTable>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('price_tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as PriceTable
  },

  async deletePriceTable(id: string) {
    if (!currentCompanyId) throw new Error('No company context')
    const { error } = await supabase
      .from('price_tables')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
