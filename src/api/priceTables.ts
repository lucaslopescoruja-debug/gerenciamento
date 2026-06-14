import { supabase } from '@/lib/supabase'
import type { PriceTable } from '@/types/database'

export const priceTablesApi = {
  async getPriceTables() {
        const { data, error } = await supabase
      .from('price_tables')
      .select('*')
      
      .order('name')
    if (error) throw error
    return data as PriceTable[]
  },

  async getPriceTable(id: string) {
    const { data, error } = await supabase
      .from('price_tables')
      .select('*, price_table_items(*, product:products(*))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as any
  },

  async createPriceTable(priceTable: Omit<PriceTable, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
        const { data, error } = await supabase
      .from('price_tables')
      .insert([{ ...priceTable}])
      .select()
      .single()
    if (error) throw error
    return data as PriceTable
  },

  async updatePriceTable(id: string, updates: Partial<PriceTable>) {
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
        const { error } = await supabase
      .from('price_tables')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  async addPriceTableItem(item: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('price_table_items')
      .insert([item])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async bulkAddPriceTableItems(items: Omit<any, 'id' | 'created_at' | 'updated_at'>[]) {
    if (items.length === 0) return []
    const { data, error } = await supabase
      .from('price_table_items')
      .upsert(items, { onConflict: 'price_table_id, product_id' })
      .select()
    if (error) throw error
    return data
  },

  async updatePriceTableItem(id: string, updates: any) {
    const { data, error } = await supabase
      .from('price_table_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletePriceTableItem(id: string) {
    const { error } = await supabase
      .from('price_table_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
