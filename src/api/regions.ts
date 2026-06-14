import { supabase } from '@/lib/supabase'
import type { Region } from '@/types/database'

export const regionsApi = {
  async getRegions() {
        const { data, error } = await supabase
      .from('regions')
      .select('*')
      
      .order('name')
    if (error) throw error
    return data as Region[]
  },

  async getRegion(id: string) {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Region
  },

  async createRegion(region: Omit<Region, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
        const { data, error } = await supabase
      .from('regions')
      .insert([{ ...region}])
      .select()
      .single()
    if (error) throw error
    return data as Region
  },

  async updateRegion(id: string, updates: Partial<Region>) {
        const { data, error } = await supabase
      .from('regions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Region
  },

  async deleteRegion(id: string) {
        const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
