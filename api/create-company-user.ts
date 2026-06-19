import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user, forceCompanyId, isSuperAdmin } = req.body;
    
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
    let finalCompanyId = null;
    
    if (!isSuperAdmin) {
      finalCompanyId = forceCompanyId;
      // Default to the first created company if no context provided (fallback)
      if (!finalCompanyId) {
        const { data: companies } = await supabaseAdmin.from('companies').select('id').order('created_at').limit(1);
        finalCompanyId = companies?.[0]?.id;
      }

      if (!finalCompanyId) {
        return res.status(400).json({ error: 'Nenhuma empresa encontrada para vincular.' });
      }
    }

    // Default password 'Trocar@123'
    // Now that username is an email, we use it directly.
    const userEmail = user.username;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: 'Trocar@123',
      email_confirm: true,
      user_metadata: {
        role: user.role,
        company_id: finalCompanyId,
        is_super_admin: !!isSuperAdmin
      }
    });

    if (authError) {
      let msg = authError.message;
      if (msg.includes('already been registered') || msg.includes('email address')) {
        msg = 'Já existe um usuário cadastrado com este e-mail no sistema. O e-mail deve ser único.';
      } else if (msg.includes('Password should be')) {
        msg = 'A senha informada é muito fraca ou inválida.';
      }
      return res.status(400).json({ error: msg });
    }

    const authUser = authData.user;

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        ...user,
        email: userEmail,
        password_hash: user.password_hash || 'temp_auth_migration', // Dummy hash for schema constraint
        company_id: finalCompanyId,
        auth_user_id: authUser.id,
        is_super_admin: !!isSuperAdmin,
        active: true
      }])
      .select()
      .single();

    if (insertError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(200).json(newUser);

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
