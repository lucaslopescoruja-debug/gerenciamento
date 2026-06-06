-- ==============================================================================
-- COLETOR IA (ESTOQUE FÁCIL) - SQL CONSOLIDADO DO BANCO DE DADOS
-- ==============================================================================
-- Este script cria todas as tabelas, relacionamentos, chaves estrangeiras,
-- restrições e políticas de segurança (RLS) para o projeto Estoque Fácil WMS/SaaS.
-- Execute este script no editor SQL do painel do seu novo projeto Supabase.
-- ==============================================================================

-- Habilitar extensões necessárias para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. TABELAS DO MÓDULO SAAS GLOBAL
-- ==========================================

-- Tabela de Empresas Inquilinas (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cnpj TEXT,
    max_users INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    billing_day INTEGER DEFAULT 10,
    monthly_fee DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Controle Financeiro (Mensalidades SaaS)
CREATE TABLE IF NOT EXISTS public.company_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Contatos de Vendas e Demonstração (Leads da Landing Page)
CREATE TABLE IF NOT EXISTS public.system_leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    viewed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABELAS OPERACIONAIS DOS INQUILINOS (TENANTS)
-- ==========================================

-- Tabela de Usuários (Operadores / Motoristas / Admins)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- NULL para administradores globais master
    is_super_admin BOOLEAN DEFAULT false,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'conferente', -- 'admin', 'gestor', 'conferente', 'motorista'
    active BOOLEAN DEFAULT true,
    reset_requested BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela do Mural de Avisos do Painel Master
CREATE TABLE IF NOT EXISTS public.system_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Catálogo de Produtos Mestre
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    external_code TEXT,
    description TEXT NOT NULL,
    group_name TEXT,
    stock NUMERIC NOT NULL DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 0 NOT NULL,
    batch TEXT,
    unit_weight NUMERIC,
    box_quantity NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT products_company_code_key UNIQUE (company_id, code)
);

-- Tabela de Códigos de Barras Relacionados (DUN14 / Embalagens)
CREATE TABLE IF NOT EXISTS public.related_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Operações / Documentos (Expedições e Recebimentos)
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'LOAD' (Expedição), 'RECEIPT' (Recebimento), 'BLIND_RECEIPT' (Às cegas), 'INVENTORY' (Inventário)
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'dispatched', 'completed', 'cancelled'
    load_number TEXT,
    client_name TEXT,
    clients TEXT[],
    driver_name TEXT,
    vehicle_plate TEXT,
    notes TEXT,
    created_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens das Operações
CREATE TABLE IF NOT EXISTS public.operation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity_expected NUMERIC NOT NULL DEFAULT 0,
    quantity_scanned NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'ok', 'divergent'
    system_stock_at_load NUMERIC DEFAULT 0,
    physical_verification TEXT DEFAULT 'pending', -- 'pending', 'really_zero', 'found'
    physical_divergence_found BOOLEAN DEFAULT false,
    divergence_resolved BOOLEAN DEFAULT false
);

-- Tabela de Alertas de Divergência de Carga (Cortes)
CREATE TABLE IF NOT EXISTS public.operation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity_expected NUMERIC NOT NULL DEFAULT 0,
    quantity_scanned NUMERIC NOT NULL DEFAULT 0,
    quantity_missing NUMERIC NOT NULL DEFAULT 0,
    resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TABELAS DO MÓDULO LAST-MILE (ENTREGAS)
-- ==========================================

-- Tabela de Rotas de Entrega dos Motoristas
CREATE TABLE IF NOT EXISTS public.delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Paradas / Clientes da Rota
CREATE TABLE IF NOT EXISTS public.delivery_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    delivery_route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_number TEXT,
    address TEXT,
    phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'waiting', 'delivered', 'delivered_with_divergence', 'canceled', 'returned'
    signature_data TEXT, -- Base64 da assinatura
    receiver_name TEXT,
    receiver_doc TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens de Entrega por Cliente
CREATE TABLE IF NOT EXISTS public.delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    delivery_client_id UUID NOT NULL REFERENCES public.delivery_clients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity_expected INTEGER NOT NULL DEFAULT 0,
    quantity_scanned INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'ok', 'divergent'
    approval_status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    requested_qty INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. TABELAS DO MÓDULO DE INVENTÁRIOS E CONTAGEIS
-- ==========================================

-- Tabelas de Contagem Avulsa (Auditoria Rápida de Setores)
CREATE TABLE IF NOT EXISTS public.adhoc_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_number TEXT NOT NULL,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.adhoc_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_id UUID NOT NULL REFERENCES public.adhoc_counts(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    group_category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelas de Inventário Oficial (Reconciliação e Ajuste de Saldo)
CREATE TABLE IF NOT EXISTS public.inventory_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_number TEXT NOT NULL,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'adjusted'
    authorized_by TEXT,
    authorized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    group_category TEXT,
    quantity_counted INTEGER NOT NULL DEFAULT 0,
    quantity_system INTEGER NOT NULL DEFAULT 0,
    status TEXT, -- 'ok', 'divergent', 'missing', 'excess'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. POLÍTICAS DE SEGURANÇA E RLS
-- ==========================================

-- Por padrão, o sistema utiliza autenticação customizada no frontend e conexões
-- baseadas na chave anônima (anon_key). Desativamos RLS ou criamos políticas permissivas
-- para as tabelas operacionais para evitar bloqueios indesejados. A segurança lógica 
-- é implementada em todas as consultas filtrando explicitamente por 'company_id'.

ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.adhoc_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.adhoc_count_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items DISABLE ROW LEVEL SECURITY;

-- Módulo de Entregas Last-Mile RLS (Habilitado, com liberação para authenticated)
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;

CREATE POLICY "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for authenticated users on delivery_items" ON public.delivery_items FOR ALL USING (true) WITH CHECK (true);

-- Alertas RLS (Habilitado, com liberação geral)
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for all users on operation_alerts" ON public.operation_alerts FOR ALL USING (true) WITH CHECK (true);

-- Leads da Landing Page RLS (Habilitado, Inserção livre, visualização apenas por Super Admins)
ALTER TABLE public.system_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir inserção de leads pública" ON public.system_leads;
DROP POLICY IF EXISTS "Apenas super admins podem visualizar leads" ON public.system_leads;
DROP POLICY IF EXISTS "Apenas super admins podem excluir leads" ON public.system_leads;

CREATE POLICY "Permitir inserção de leads pública" ON public.system_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas super admins podem visualizar leads" ON public.system_leads FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true));
CREATE POLICY "Apenas super admins podem excluir leads" ON public.system_leads FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true));


-- ==========================================
-- 6. INSERÇÃO DE DADOS INICIAIS (SEED DATA)
-- ==========================================

-- 1. Criação da Empresa Inquilina Padrão (Delicius BA)
INSERT INTO public.companies (id, slug, name, cnpj, max_users, active, billing_day, monthly_fee)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'delicius-ba', 
    'Delicius BA', 
    '28.092.101/0001-59', 
    5,
    true,
    10,
    290.00
) ON CONFLICT (id) DO NOTHING;

-- 2. Criação do Usuário Administrador Global (Super Admin Master)
-- OBS: A senha padrão configurada é '123456' (o hash corresponde a SHA-256 no cliente)
INSERT INTO public.users (id, company_id, is_super_admin, name, username, password_hash, role, active, reset_requested, permissions)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    NULL, -- Sem empresa associada por ser Super Admin Global
    true,
    'Lucas Soares',
    'lucas.soares',
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- Hash de '123456'
    'admin',
    true,
    false,
    '{"can_view_dashboard": true, "can_manage_loads": true, "can_do_conference": true, "can_manage_products": true, "can_manage_users": true, "can_do_delivery": true, "can_manage_saas_finance": true, "can_manage_saas_clients": true, "can_manage_saas_staff": true}'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- 3. Criação de um Administrador Local da Delicius BA
INSERT INTO public.users (id, company_id, is_super_admin, name, username, password_hash, role, active, reset_requested, permissions)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    false,
    'Administrador Delicius',
    'admin.delicius',
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- Hash de '123456'
    'admin',
    true,
    false,
    '{"can_view_dashboard": true, "can_manage_loads": true, "can_do_conference": true, "can_manage_products": true, "can_manage_users": true, "can_do_delivery": true}'::jsonb
) ON CONFLICT (username) DO NOTHING;
