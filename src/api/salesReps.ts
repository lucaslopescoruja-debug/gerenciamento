import { supabase } from '@/lib/supabase'
import type { SalesRep } from '@/types/database'

export const salesRepsApi = {
  async getSalesReps() {
        const { data, error } = await supabase
      .from('sales_reps')
      .select('*, sales_rep_regions(regions(*))')
      
      .order('nickname')
    if (error) throw error
    return data as any[]
  },

  async getSalesRep(id: string) {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*, sales_rep_regions(regions(*))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as any
  },

  async createSalesRep(salesRep: Omit<SalesRep, 'id' | 'created_at' | 'updated_at' | 'company_id'>, regionIds: string[] = []) {
        const { data, error } = await supabase
      .from('sales_reps')
      .insert([{ ...salesRep}])
      .select()
      .single()
    if (error) throw error
    
    if (regionIds.length > 0) {
      await supabase.from('sales_rep_regions').insert(
        regionIds.map(rid => ({ sales_rep_id: data.id, region_id: rid }))
      )
    }
    return data
  },

  async updateSalesRep(id: string, updates: Partial<SalesRep>, regionIds: string[] = []) {
        const { data, error } = await supabase
      .from('sales_reps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    
    // Replace regions
    await supabase.from('sales_rep_regions').delete().eq('sales_rep_id', id)
    if (regionIds.length > 0) {
      await supabase.from('sales_rep_regions').insert(
        regionIds.map(rid => ({ sales_rep_id: id, region_id: rid }))
      )
    }
    return data
  },

  async deleteSalesRep(id: string) {
        const { error } = await supabase
      .from('sales_reps')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
