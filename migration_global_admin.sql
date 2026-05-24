-- Remover a obrigatoriedade de ter uma empresa na tabela de usuários
ALTER TABLE public.users ALTER COLUMN company_id DROP NOT NULL;

-- Desvincular o usuário lucas.soares de qualquer empresa, tornando-o um Admin Global puro
UPDATE public.users SET company_id = NULL WHERE username = 'lucas.soares';
