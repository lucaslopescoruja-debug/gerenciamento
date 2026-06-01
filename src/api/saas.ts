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
    const normalizedUsername = user.username.trim().toLowerCase();

    // Verificar se o username já existe no sistema
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUser) {
      throw new Error(`O usuário de login '${user.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, username: normalizedUsername, company_id: null, is_super_admin: true }])
      .select()
      .single()
      
    if (error) {
      if (error.code === '23505') {
        throw new Error(`O usuário de login '${user.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      throw error
    }
    return data as User
  },

  async updateSystemUser(id: string, updates: Partial<User>) {
    if (updates.username) {
      const normalizedUsername = updates.username.trim().toLowerCase();

      // Verificar se outro usuário já usa este username
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('id', id)
        .maybeSingle()

      if (existingUser) {
        throw new Error(`O usuário de login '${updates.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      updates.username = normalizedUsername;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) {
      if (error.code === '23505') {
        throw new Error(`O usuário de login '${updates.username || 'informado'}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      throw error
    }
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

  async updateNote(id: string, updates: Partial<SystemNote>) {
    const { data, error } = await supabase
      .from('system_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as SystemNote
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
  },

  async deletePayment(id: string) {
    const { error } = await supabase
      .from('company_payments')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  // --- Leads ---
  async getLeads() {
    let dbLeads: any[] = []
    try {
      const { data, error } = await supabase
        .from('system_leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        dbLeads = data
      }
    } catch (e) {
      console.warn('Supabase system_leads table not available:', e)
    }
    
    let localLeads: any[] = []
    try {
      const stored = localStorage.getItem('estoque_facil_leads')
      localLeads = stored ? JSON.parse(stored) : []
      if (!Array.isArray(localLeads)) localLeads = []
    } catch (e) {
      console.error('Error reading local leads:', e)
    }
    
    // Merge database and local storage leads, deduplicating by ID
    const mergedMap = new Map<string, any>()
    
    // Process database leads first
    dbLeads.forEach(lead => {
      if (lead && lead.id) {
        mergedMap.set(lead.id, lead)
      }
    })
    
    // Process local leads
    localLeads.forEach(lead => {
      if (lead && lead.id) {
        if (!mergedMap.has(lead.id)) {
          mergedMap.set(lead.id, lead)
        }
      }
    })
    
    // Convert back to array and sort by created_at descending
    return Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  },

  async createLead(lead: { name: string; email: string; phone: string; message: string }) {
    const newLead = {
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      viewed: false,
      ...lead
    }

    // Always save to local storage first as a local backup
    try {
      const stored = localStorage.getItem('estoque_facil_leads')
      let list = stored ? JSON.parse(stored) : []
      if (!Array.isArray(list)) list = []
      list.unshift(newLead)
      localStorage.setItem('estoque_facil_leads', JSON.stringify(list))
    } catch (e) {
      console.error('Error saving lead to local storage:', e)
    }

    // Then attempt to write to Supabase
    try {
      const { data, error } = await supabase
        .from('system_leads')
        .insert([newLead])
        .select()
        .single()
      
      if (!error && data) {
        return data as any
      }
    } catch (e) {
      console.warn('Supabase system_leads insert failed:', e)
    }

    return newLead
  },

  async deleteLead(id: string) {
    // 1. Delete from Supabase
    try {
      const { error } = await supabase
        .from('system_leads')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.warn('Supabase system_leads delete error:', error)
      }
    } catch (e) {
      console.warn('Supabase system_leads delete failed:', e)
    }

    // 2. Always delete from localStorage as well
    try {
      const stored = localStorage.getItem('estoque_facil_leads')
      if (stored) {
        let list = JSON.parse(stored)
        if (Array.isArray(list)) {
          list = list.filter((item: any) => item.id !== id)
          localStorage.setItem('estoque_facil_leads', JSON.stringify(list))
        }
      }
    } catch (e) {
      console.error('Error deleting lead from local storage:', e)
    }
  },

  async markAllLeadsAsViewed() {
    // 1. Update in Supabase
    try {
      const { error } = await supabase
        .from('system_leads')
        .update({ viewed: true })
        .eq('viewed', false)
      
      if (error) {
        console.warn('Supabase system_leads update error:', error)
      }
    } catch (e) {
      console.warn('Supabase system_leads update failed:', e)
    }

    // 2. Update in localStorage
    try {
      const stored = localStorage.getItem('estoque_facil_leads')
      if (stored) {
        const list = JSON.parse(stored)
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => ({ ...item, viewed: true }))
          localStorage.setItem('estoque_facil_leads', JSON.stringify(updated))
        }
      }
    } catch (e) {
      console.error('Error updating local leads to viewed:', e)
    }
  }
}
