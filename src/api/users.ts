import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'


export const usersApi = {
  // login() foi movido para AuthContext via Supabase Auth
  async login() {
    throw new Error('Use AuthContext.login para autenticação')
  },

  async getUsers(company_id?: string) {
    let query = supabase.from('users').select('*').order('name');
    if (company_id) {
      query = query.eq('company_id', company_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as User[];
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>, forceCompanyId?: string) {
    const response = await fetch('/api/create-company-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, forceCompanyId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao criar usuário. Tente novamente.');
    }
    
    const data = await response.json();
    
    return data as User
  },

  async updateUser(id: string, updates: Partial<User>) {
    const response = await fetch('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao atualizar usuário. Tente novamente.');
    }
    
    const data = await response.json();
    return data as User;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      
    if (error) {
      // 23503 is the PostgreSQL code for foreign_key_violation
      if (error.code === '23503') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ active: false })
          .eq('id', id);
          
        if (updateError) throw updateError;
        throw new Error('Este usuário possui histórico no sistema (entregas, rotas, etc.) e não pode ser excluído permanentemente. Por segurança, ele foi inativado.');
      }
      throw error;
    }
    return true
  }
}
