import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'


export const usersApi = {
  // login() foi movido para AuthContext via Supabase Auth
  async login() {
    throw new Error('Use AuthContext.login para autenticação')
  },

  async getUsers() {
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      
      .order('name')
    if (error) throw error
    return data as User[]
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>, forceCompanyId?: string) {
    const { data, error } = await supabase.functions.invoke('create-company-user', { 
      body: { user, forceCompanyId } 
    })
    
    if (error) {
      // O error.context ou body pode conter a mensagem original
      throw new Error(error.message || 'Erro ao criar usuário. Tente novamente.')
    }
    
    return data as User
  },

  async updateUser(id: string, updates: Partial<User>) {
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

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
