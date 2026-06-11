import { supabase } from '@/lib/supabase'
import type { Region } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const regionsApi = {
  async getRegions() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('company_id', currentCompanyId)
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
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('regions')
      .insert([{ ...region, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as Region
  },

  async updateRegion(id: string, updates: Partial<Region>) {
    if (!currentCompanyId) throw new Error('No company context')
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
    if (!currentCompanyId) throw new Error('No company context')
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
