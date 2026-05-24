import { supabase } from '@/lib/supabase'
import type { SystemNote, CompanyPayment, User } from '@/types/database'

export const saasApi = {
  // --- System Users (Staff) ---
  async getSystemUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_super_admin', true)
      .order('name')
      
    if (error) throw error
    return data as User[]
  },

  async createSystemUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, company_id: null, is_super_admin: true }])
      .select()
      .single()
      
    if (error) throw error
    return data as User
  },

  async updateSystemUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as User
  },

  async deleteSystemUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  // --- Notes ---
  async getNotes() {
    const { data, error } = await supabase
      .from('system_notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as SystemNote[]
  },

  async createNote(author_id: string, author_name: string, content: string) {
    const { data, error } = await supabase
      .from('system_notes')
      .insert([{ author_id, author_name, content }])
      .select()
      .single()
      
    if (error) throw error
    return data as SystemNote
  },

  async deleteNote(id: string) {
    const { error } = await supabase
      .from('system_notes')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  // --- Payments ---
  async getPayments() {
    const { data, error } = await supabase
      .from('company_payments')
      .select('*')
      .order('due_date', { ascending: false })
      
    if (error) throw error
    return data as CompanyPayment[]
  },

  async getPaymentsByCompany(company_id: string) {
    const { data, error } = await supabase
      .from('company_payments')
      .select('*')
      .eq('company_id', company_id)
      .order('due_date', { ascending: false })
      
    if (error) throw error
    return data as CompanyPayment[]
  },

  async createPayment(payment: Omit<CompanyPayment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('company_payments')
      .insert([payment])
      .select()
      .single()
      
    if (error) throw error
    return data as CompanyPayment
  },

  async updatePayment(id: string, updates: Partial<CompanyPayment>) {
    const { data, error } = await supabase
      .from('company_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as CompanyPayment
  }
}
