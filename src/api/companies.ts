import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

export const companiesApi = {
  async getCompany(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Company
  },

  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')
    if (error) throw error
    return data as Company[]
  },

  async createCompany(company: Omit<Company, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single()
    if (error) throw error
    return data as Company
  },

  async updateCompany(id: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Company
  },

  async verifyCompanyFinancialStatus(id: string) {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const limitDateStr = fiveDaysAgo.toISOString().split('T')[0];

    const { data } = await supabase
      .from('company_payments')
      .select('id')
      .eq('company_id', id)
      .neq('status', 'pago')
      .lt('due_date', limitDateStr);

    if (data && data.length > 0) {
      // Tem pendência a mais de 5 dias
      await supabase.from('companies').update({ active: false }).eq('id', id);
      return false; // Inativada
    }
    return true; // OK
  },

  async deleteCompany(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
