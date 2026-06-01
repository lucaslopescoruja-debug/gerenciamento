-- Tabela para capturar solicitações de demonstração / contatos da landing page (Leads)
CREATE TABLE IF NOT EXISTS public.system_leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    viewed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.system_leads ENABLE ROW LEVEL SECURITY;

-- 1. Política para permitir que qualquer pessoa (público anônimo) insira novos leads
CREATE POLICY "Permitir inserção de leads pública" ON public.system_leads
    FOR INSERT
    WITH CHECK (true);

-- 2. Política para permitir que apenas Super Admins visualizem os leads
CREATE POLICY "Apenas super admins podem visualizar leads" ON public.system_leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

-- 3. Política para permitir que apenas Super Admins excluam leads
CREATE POLICY "Apenas super admins podem excluir leads" ON public.system_leads
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );
