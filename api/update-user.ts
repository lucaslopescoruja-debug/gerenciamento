import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { id, updates } = req.body;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Environment Variables in Serverless Function.', { 
        url: !!supabaseUrl, 
        key: !!supabaseKey 
      });
      return res.status(500).json({ error: 'Configuração do servidor ausente (VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no Vercel).' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    if (updates.username) {
      const normalizedUsername = updates.username.trim().toLowerCase();
      updates.username = normalizedUsername;
      
      // Manter a coluna email sincronizada
      updates.email = normalizedUsername;

      // Pegar o auth_user_id
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('auth_user_id')
        .eq('id', id)
        .single();
        
      if (fetchError || !user || !user.auth_user_id) {
        return res.status(400).json({ error: 'Usuário não encontrado para atualização.' });
      }

      // Atualizar E-mail no Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.auth_user_id, {
        email: normalizedUsername,
        email_confirm: true
      });
      
      if (authError) {
        return res.status(400).json({ error: `O e-mail '${normalizedUsername}' já está em uso ou é inválido. (Auth)` });
      }
    }

    if (updates.force_password_reset) {
      const { data: userToReset, error: fetchErr } = await supabaseAdmin
        .from('users')
        .select('auth_user_id')
        .eq('id', id)
        .single();
        
      if (!fetchErr && userToReset && userToReset.auth_user_id) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userToReset.auth_user_id, {
          password: 'Trocar@123'
        });
        if (!authErr) {
          updates.must_change_password = true;
          updates.reset_requested = false;
        }
      }
      delete updates.force_password_reset;
    }

    // Atualiza tabela public.users
    const { data, error: dbError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
         return res.status(400).json({ error: `O e-mail '${updates.username}' já está em uso. (Banco de Dados)` });
      }
      return res.status(400).json({ error: dbError.message });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
