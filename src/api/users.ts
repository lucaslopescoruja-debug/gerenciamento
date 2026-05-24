import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const usersApi = {
  async login(username: string, password_hash: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password_hash)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    return data as User | null
  },

  async getUsers() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('name')
    if (error) throw error
    return data as User[]
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>, forceCompanyId?: string) {
    const targetCompanyId = forceCompanyId || currentCompanyId;
    if (!targetCompanyId) throw new Error('No company context')

    const normalizedUsername = user.username.trim().toLowerCase();

    // 1. Verificar se o username já existe no sistema
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUser) {
      throw new Error(`O usuário de login '${user.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
    }

    // 2. Verificar limite de usuários da empresa
    const { data: comp } = await supabase.from('companies').select('max_users').eq('id', targetCompanyId).single()
    if (comp) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', targetCompanyId)
      if (count !== null && count >= comp.max_users) {
        throw new Error(`Limite de usuários atingido para esta empresa (${comp.max_users} usuários max).`)
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, username: normalizedUsername, company_id: targetCompanyId }])
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
