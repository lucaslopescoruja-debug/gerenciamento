-- ==============================================================================
-- SL Stock (ESTOQUE FÃ CIL) - SQL CONSOLIDADO DO BANCO DE DADOS
-- ==============================================================================
-- Este script cria todas as tabelas, relacionamentos, chaves estrangeiras,
-- restriÃ§Ãµes e polÃ­ticas de seguranÃ§a (RLS) para o projeto Estoque FÃ¡cil WMS/SaaS.
-- Execute este script no editor SQL do painel do seu novo projeto Supabase.
-- ==============================================================================

-- Habilitar extensÃµes necessÃ¡rias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ==========================================
-- 1. TABELAS DO MÃ“DULO SAAS GLOBAL
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
    logo_url TEXT,
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

-- Tabela de Contatos de Vendas e DemonstraÃ§Ã£o (Leads da Landing Page)
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

-- Tabela de UsuÃ¡rios (Operadores / Motoristas / Admins)
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

-- Tabela de CatÃ¡logo de Produtos Mestre
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

-- Tabela de CÃ³digos de Barras Relacionados (DUN14 / Embalagens)
CREATE TABLE IF NOT EXISTS public.related_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de OperaÃ§Ãµes / Documentos (ExpediÃ§Ãµes e Recebimentos)
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'LOAD' (ExpediÃ§Ã£o), 'RECEIPT' (Recebimento), 'BLIND_RECEIPT' (Ã€s cegas), 'INVENTORY' (InventÃ¡rio)
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

-- Tabela de Itens das OperaÃ§Ãµes
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

-- Tabela de Alertas de DivergÃªncia de Carga (Cortes)
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
-- 3. TABELAS DO MÃ“DULO LAST-MILE (ENTREGAS)
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
-- 4. TABELAS DO MÃ“DULO DE INVENTÃRIOS E CONTAGEIS
-- ==========================================

-- Tabelas de Contagem Avulsa (Auditoria RÃ¡pida de Setores)
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

-- Tabelas de InventÃ¡rio Oficial (ReconciliaÃ§Ã£o e Ajuste de Saldo)
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
-- 5. POLÃTICAS DE SEGURANÃ‡A E RLS
-- ==========================================

-- Por padrÃ£o, o sistema utiliza autenticaÃ§Ã£o customizada no frontend e conexÃµes
-- baseadas na chave anÃ´nima (anon_key). Desativamos RLS ou criamos polÃ­ticas permissivas
-- para as tabelas operacionais para evitar bloqueios indesejados. A seguranÃ§a lÃ³gica 
-- Ã© implementada em todas as consultas filtrando explicitamente por 'company_id'.

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

-- MÃ³dulo de Entregas Last-Mile RLS (Habilitado, com liberaÃ§Ã£o para authenticated)
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
CREATE POLICY "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
CREATE POLICY "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;
CREATE POLICY "Allow all actions for authenticated users on delivery_items" ON public.delivery_items FOR ALL USING (true) WITH CHECK (true);

-- Alertas RLS (Habilitado, com liberaÃ§Ã£o geral)
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for all users on operation_alerts" ON public.operation_alerts FOR ALL USING (true) WITH CHECK (true);

-- Leads da Landing Page RLS (Habilitado, InserÃ§Ã£o livre, visualizaÃ§Ã£o apenas por Super Admins)
ALTER TABLE public.system_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir inserÃ§Ã£o de leads pÃºblica" ON public.system_leads;
DROP POLICY IF EXISTS "Apenas super admins podem visualizar leads" ON public.system_leads;
DROP POLICY IF EXISTS "Apenas super admins podem excluir leads" ON public.system_leads;

DROP POLICY IF EXISTS "Permitir inserÃ§Ã£o de leads pÃºblica" ON public.system_leads;
CREATE POLICY "Permitir inserÃ§Ã£o de leads pÃºblica" ON public.system_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Apenas super admins podem visualizar leads" ON public.system_leads;
CREATE POLICY "Apenas super admins podem visualizar leads" ON public.system_leads FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true));
DROP POLICY IF EXISTS "Apenas super admins podem excluir leads" ON public.system_leads;
CREATE POLICY "Apenas super admins podem excluir leads" ON public.system_leads FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true));


-- ==========================================
-- 6. INSERÃ‡ÃƒO DE DADOS INICIAIS (SEED DATA)
-- ==========================================

-- 1. CriaÃ§Ã£o da Empresa Inquilina PadrÃ£o (Delicius BA)
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

-- 2. CriaÃ§Ã£o do UsuÃ¡rio Administrador Global (Super Admin Master)
-- OBS: A senha padrÃ£o configurada Ã© '123456' (o hash corresponde a SHA-256 no cliente)
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

-- 3. CriaÃ§Ã£o de um Administrador Local da Delicius BA
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
-- ============================================
-- CriaÃ§Ã£o de Tabelas do MÃ³dulo de Entregas
-- ============================================

CREATE TABLE IF NOT EXISTS public.delivery_routes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id uuid REFERENCES public.operations(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES public.users(id),
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_route_id uuid REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    phone text,
    notes text,
    status text NOT NULL DEFAULT 'pending',
    signature_data text,
    receiver_name text,
    receiver_doc text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_client_id uuid REFERENCES public.delivery_clients(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    product_code text NOT NULL,
    description text NOT NULL,
    quantity_expected integer NOT NULL DEFAULT 0,
    quantity_scanned integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar PolÃ­ticas de SeguranÃ§a de NÃ­vel de Linha (RLS)
ALTER TABLE public.delivery_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items DISABLE ROW LEVEL SECURITY;
-- Fix RLS Policies for deliveries module

ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- Drop them first just in case
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
CREATE POLICY "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
CREATE POLICY "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;
CREATE POLICY "Allow all actions for authenticated users on delivery_items" ON public.delivery_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Add approval fields to delivery_items
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS requested_qty integer;

-- Update RLS policies (already permissive for authenticated users from previous fix, but good to be explicit)
-- Actually, the previous fix "Allow all actions on delivery_items" already covers this.
-- Add order_number to delivery_clients
ALTER TABLE public.delivery_clients ADD COLUMN IF NOT EXISTS order_number text;
-- MigraÃ§Ã£o para garantir que o nome de usuÃ¡rio (username) seja Ãºnico no sistema

-- 1. Higienizar usernames existentes (remover espaÃ§os extras e colocar em minÃºsculas)
UPDATE public.users SET username = LOWER(TRIM(username));

-- 2. Adicionar restriÃ§Ã£o de unicidade (Unique Constraint) na tabela public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
-- Adicionar colunas de faturamento na tabela de empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 10;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Atualizar registros existentes para terem valores padrÃ£o consistentes
UPDATE public.companies SET billing_day = 10 WHERE billing_day IS NULL;
UPDATE public.companies SET monthly_fee = 0.00 WHERE monthly_fee IS NULL;
-- Adicionar coluna 'checked' para marcar recados como concluÃ­dos
ALTER TABLE public.system_notes ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;

-- Atualizar recados anteriores para falso
UPDATE public.system_notes SET checked = false WHERE checked IS NULL;
-- ==============================================================================
-- MIGRAÃ‡ÃƒO PARA ADICIONAR CAMPOS DE DIVERGÃŠNCIA FÃSICA E ALERTA DE ESTOQUE
-- ==============================================================================

-- 1. Adicionar novas colunas para controle de divergÃªncias fÃ­sicas
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS system_stock_at_load NUMERIC DEFAULT 0;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_verification TEXT DEFAULT 'pending';
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_divergence_found BOOLEAN DEFAULT false;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS divergence_resolved BOOLEAN DEFAULT false;

-- 2. Retroalimentar itens existentes com o estoque atual dos produtos correspondentes
UPDATE public.operation_items oi
SET system_stock_at_load = COALESCE((
    SELECT p.stock 
    FROM public.products p 
    WHERE p.id = oi.product_id
), 0)
WHERE system_stock_at_load IS NULL OR system_stock_at_load = 0;
-- Create operation_alerts table
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

-- Enable Row Level Security
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for all users (consistent with other tables accessed anonymously)
DROP POLICY IF EXISTS "Allow all actions for authenticated users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for all users on operation_alerts" ON public.operation_alerts
FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS returned_to_stock boolean DEFAULT false;
-- Tabela global de preÃ§os dos planos (SaaS)
CREATE TABLE IF NOT EXISTS saas_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'bronze', 'prata', 'ouro'
  name VARCHAR(100) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_users INTEGER NOT NULL DEFAULT 1,
  extra_user_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir os planos padrÃ£o com os novos IDs
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price)
VALUES 
  ('bronze', 'Bronze', 197.00, 3, 35.00),
  ('prata', 'Prata', 497.00, 7, 50.00),
  ('ouro', 'Ouro', 1290.00, 10, 100.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  base_users = EXCLUDED.base_users,
  extra_user_price = EXCLUDED.extra_user_price;

-- Caso vocÃª jÃ¡ tenha rodado o cÃ³digo antigo que inseria 'basico', 'profissional' e 'enterprise', 
-- podemos remover os antigos (cuidado, se alguma empresa jÃ¡ estava vinculada, precisarÃ­amos dar UPDATE nelas antes)
DELETE FROM saas_plans WHERE id IN ('basico', 'profissional', 'enterprise');
create table if not exists public.customers (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true,
    nickname text,
    document_type text check (document_type in ('CPF', 'CNPJ')),
    document text,
    fantasy_name text,
    legal_name text,
    cep text,
    address text,
    number text,
    complement text,
    neighborhood text,
    po_box text,
    city text,
    state text,
    phone1 text,
    phone2 text,
    phone3 text,
    phone4 text,
    email text,
    credit_limit numeric(15,2) default 0,
    price_table text,
    sales_rep text,
    payment_condition text,
    allow_unit_price_change boolean default false,
    region text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Equipamentos em Comodato
create table if not exists public.customer_equipments (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid not null references public.customers(id) on delete cascade,
    company_id uuid not null references public.companies(id) on delete cascade,
    description text not null,
    serial_number text,
    delivered_at date,
    returned_at date,
    status text default 'active' check (status in ('active', 'returned')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Representantes / Vendedores
create table if not exists public.sales_reps (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true not null,
    nickname varchar(255),
    legal_name varchar(255),
    document varchar(50),
    phone varchar(50),
    city varchar(100),
    state varchar(2),
    regions text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add sales_rep_id to customers
alter table public.customers add column if not exists sales_rep_id uuid references public.sales_reps(id) on delete set null;

-- Trigger to update updated_at
create trigger handle_updated_at before update on public.sales_reps
  for each row execute procedure moddatetime (updated_at);
-- Regions
create table if not exists public.regions (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Price Tables
create table if not exists public.price_tables (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Customers
alter table public.customers drop column if exists region;
alter table public.customers drop column if exists price_table;

alter table public.customers add column if not exists region_id uuid references public.regions(id) on delete set null;
alter table public.customers add column if not exists price_table_id uuid references public.price_tables(id) on delete set null;

-- Update Sales Reps
alter table public.sales_reps drop column if exists regions;

create table if not exists public.sales_rep_regions (
    sales_rep_id uuid references public.sales_reps(id) on delete cascade,
    region_id uuid references public.regions(id) on delete cascade,
    primary key (sales_rep_id, region_id)
);

-- Add triggers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_regions') THEN
        CREATE TRIGGER handle_updated_at_regions BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_tables') THEN
        CREATE TRIGGER handle_updated_at_price_tables BEFORE UPDATE ON public.price_tables FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;
alter table public.sales_reps add column if not exists commission_rate numeric(5,2) default 0.00;
alter table public.price_tables add column if not exists code varchar(50);

create table if not exists public.price_table_items (
    id uuid default gen_random_uuid() primary key,
    price_table_id uuid not null references public.price_tables(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    price numeric(10,2) default 0.00 not null,
    discount_percent numeric(5,2) default 0.00,
    max_discount_percent numeric(5,2) default 0.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(price_table_id, product_id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_table_items') THEN
        CREATE TRIGGER handle_updated_at_price_table_items BEFORE UPDATE ON public.price_table_items FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;

ALTER TABLE public.price_table_items DISABLE ROW LEVEL SECURITY;
alter table public.delivery_clients add column if not exists customer_id uuid references public.customers(id) on delete set null;
-- Create payment_conditions table
CREATE TABLE IF NOT EXISTS public.payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    installments INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for payment_conditions
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_conditions
DROP POLICY IF EXISTS "Users can view payment_conditions of their company" ON public.payment_conditions;
CREATE POLICY "Users can view payment_conditions of their company" ON public.payment_conditions
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins and Gestors can insert payment_conditions" ON public.payment_conditions;
CREATE POLICY "Admins and Gestors can insert payment_conditions" ON public.payment_conditions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

DROP POLICY IF EXISTS "Admins and Gestors can update payment_conditions" ON public.payment_conditions;
CREATE POLICY "Admins and Gestors can update payment_conditions" ON public.payment_conditions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

DROP POLICY IF EXISTS "Admins and Gestors can delete payment_conditions" ON public.payment_conditions;
CREATE POLICY "Admins and Gestors can delete payment_conditions" ON public.payment_conditions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

-- Create customer_payment_conditions table
CREATE TABLE IF NOT EXISTS public.customer_payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    payment_condition_id UUID NOT NULL REFERENCES public.payment_conditions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(customer_id, payment_condition_id)
);

-- Enable RLS for customer_payment_conditions
ALTER TABLE public.customer_payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for customer_payment_conditions
DROP POLICY IF EXISTS "Users can view customer_payment_conditions of their company" ON public.customer_payment_conditions;
CREATE POLICY "Users can view customer_payment_conditions of their company" ON public.customer_payment_conditions
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins and Gestors can manage customer_payment_conditions" ON public.customer_payment_conditions;
CREATE POLICY "Admins and Gestors can manage customer_payment_conditions" ON public.customer_payment_conditions
    FOR ALL USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    );

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_rep_id UUID REFERENCES public.sales_reps(id),
    price_table_id UUID REFERENCES public.price_tables(id),
    payment_condition_id UUID REFERENCES public.payment_conditions(id),
    status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviado', 'Faturado', 'Cancelado')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_discount NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_orders
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

-- Policies for sales_orders
DROP POLICY IF EXISTS "Users can view sales_orders of their company" ON public.sales_orders;
CREATE POLICY "Users can view sales_orders of their company" ON public.sales_orders
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert sales_orders of their company" ON public.sales_orders;
CREATE POLICY "Users can insert sales_orders of their company" ON public.sales_orders
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update sales_orders of their company" ON public.sales_orders;
CREATE POLICY "Users can update sales_orders of their company" ON public.sales_orders
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete sales_orders of their company" ON public.sales_orders;
CREATE POLICY "Users can delete sales_orders of their company" ON public.sales_orders
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    net_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_order_items
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for sales_order_items
DROP POLICY IF EXISTS "Users can view sales_order_items of their company" ON public.sales_order_items;
CREATE POLICY "Users can view sales_order_items of their company" ON public.sales_order_items
    FOR SELECT USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert sales_order_items of their company" ON public.sales_order_items;
CREATE POLICY "Users can insert sales_order_items of their company" ON public.sales_order_items
    FOR INSERT WITH CHECK (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update sales_order_items of their company" ON public.sales_order_items;
CREATE POLICY "Users can update sales_order_items of their company" ON public.sales_order_items
    FOR UPDATE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete sales_order_items of their company" ON public.sales_order_items;
CREATE POLICY "Users can delete sales_order_items of their company" ON public.sales_order_items
    FOR DELETE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_payment_conditions
    BEFORE UPDATE ON public.payment_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sales_orders
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_api_token TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'gestor', 'operator', 'master', 'conferente', 'motorista', 'ajudante', 'vendedor'));
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price) VALUES ('platina', 'Platina', 1990.00, 15, 150.00) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_price = EXCLUDED.base_price, base_users = EXCLUDED.base_users, extra_user_price = EXCLUDED.extra_user_price;
-- Allow authenticated users to update companies table
-- The UI already restricts access to this page to admins/gestores
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON public.companies;
CREATE POLICY "Allow authenticated users to update companies" ON public.companies
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
-- Fix users role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'gestor', 'master', 'conferente', 'motorista', 'ajudante', 'vendedor', 'representante', 'operador', 'mecanico', 'operator'));

-- Equipments
CREATE TABLE public.equipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  patrimony varchar NOT NULL,
  type varchar NOT NULL, -- Freezer, Geladeira, etc
  model varchar NOT NULL,
  size varchar, -- e.g. 400L
  status varchar NOT NULL DEFAULT 'DisponÃ­vel', -- Teste, DisponÃ­vel, Em ManutenÃ§Ã£o, Danificado, No Cliente
  current_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, patrimony)
);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view equipments of their company" ON public.equipments;
CREATE POLICY "Users can view equipments of their company" ON public.equipments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert equipments of their company" ON public.equipments;
CREATE POLICY "Users can insert equipments of their company" ON public.equipments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update equipments of their company" ON public.equipments;
CREATE POLICY "Users can update equipments of their company" ON public.equipments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete equipments of their company" ON public.equipments;
CREATE POLICY "Users can delete equipments of their company" ON public.equipments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment Orders
CREATE TABLE public.equipment_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  type varchar NOT NULL, -- entrega, recolha, troca, manutencao
  status varchar NOT NULL DEFAULT 'pendente', -- pendente, em_rota, concluido, cancelado
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date date,
  completed_at timestamp with time zone,
  signature_data text,
  term_pdf_url text,
  receiver_name varchar,
  receiver_doc varchar,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view equipment_orders of their company" ON public.equipment_orders;
CREATE POLICY "Users can view equipment_orders of their company" ON public.equipment_orders FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert equipment_orders of their company" ON public.equipment_orders;
CREATE POLICY "Users can insert equipment_orders of their company" ON public.equipment_orders FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update equipment_orders of their company" ON public.equipment_orders;
CREATE POLICY "Users can update equipment_orders of their company" ON public.equipment_orders FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete equipment_orders of their company" ON public.equipment_orders;
CREATE POLICY "Users can delete equipment_orders of their company" ON public.equipment_orders FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment History
CREATE TABLE public.equipment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view equipment_history of their company" ON public.equipment_history;
CREATE POLICY "Users can view equipment_history of their company" ON public.equipment_history FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert equipment_history of their company" ON public.equipment_history;
CREATE POLICY "Users can insert equipment_history of their company" ON public.equipment_history FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at_equipments()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipments_updated_at
BEFORE UPDATE ON public.equipments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipments();

CREATE OR REPLACE FUNCTION set_updated_at_equipment_orders()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_orders_updated_at
BEFORE UPDATE ON public.equipment_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipment_orders();
-- Adicionar colunas adicionais para detalhamento tÃ©cnico da OS
ALTER TABLE public.equipment_orders 
ADD COLUMN IF NOT EXISTS defect_description text,
ADD COLUMN IF NOT EXISTS solution_description text,
ADD COLUMN IF NOT EXISTS action_taken text;

-- Insumos e PeÃ§as (Estoque Geral)
CREATE TABLE public.supplies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name varchar NOT NULL,
  unit varchar NOT NULL DEFAULT 'un', -- un, kg, m, etc.
  stock_quantity numeric(15,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplies DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at_supplies()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplies_updated_at
BEFORE UPDATE ON public.supplies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_supplies();

-- SolicitaÃ§Ãµes de PeÃ§as (Feitas pelo MecÃ¢nico para o Gestor)
CREATE TABLE public.supply_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  supply_id uuid REFERENCES public.supplies(id) ON DELETE CASCADE NOT NULL,
  quantity_requested numeric(15,2) NOT NULL,
  status varchar NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supply_requests DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at_supply_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supply_requests_updated_at
BEFORE UPDATE ON public.supply_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_supply_requests();

-- Consumo de PeÃ§as em uma OS
CREATE TABLE public.equipment_order_supplies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.equipment_orders(id) ON DELETE CASCADE NOT NULL,
  supply_id uuid REFERENCES public.supplies(id) ON DELETE CASCADE NOT NULL,
  quantity_consumed numeric(15,2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_order_supplies DISABLE ROW LEVEL SECURITY;
-- ==============================================================================
-- MIGRAÃ‡ÃƒO PARA MULTI-TENANT (VÃRIAS EMPRESAS)
-- ==============================================================================

-- 1. Criar a tabela de empresas (companies)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cnpj TEXT,
    max_users INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inserir a Empresa PadrÃ£o (Delicius BA)
INSERT INTO public.companies (id, slug, name, cnpj, max_users)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'delicius-ba', 
    'Delicius BA', 
    '28.092.101/0001-59', 
    5
) ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar company_id nas tabelas existentes e vincular Ã  Delicius BA

-- Tabela: users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.users SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.users ALTER COLUMN company_id SET NOT NULL;

-- Tabela: products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.products SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
-- Alterar a restriÃ§Ã£o de cÃ³digo Ãºnico global para Ãºnico POR EMPRESA
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_code_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_code_key;
ALTER TABLE public.products ADD CONSTRAINT products_company_code_key UNIQUE (company_id, code);


-- Tabela: operations
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.operations SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.operations ALTER COLUMN company_id SET NOT NULL;

-- Tabela: operation_items
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.operation_items SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.operation_items ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_routes
ALTER TABLE public.delivery_routes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_routes SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_routes ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_clients
ALTER TABLE public.delivery_clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_clients SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_clients ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_items
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_items SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_items ALTER COLUMN company_id SET NOT NULL;

-- ==============================================================================
-- FIM DA MIGRAÃ‡ÃƒO
-- ==============================================================================
-- Adicionar a coluna de super administrador na tabela de usuÃ¡rios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Dar o super poder ao usuÃ¡rio Lucas
UPDATE public.users SET is_super_admin = true WHERE username = 'lucas.soares';
-- Remover a obrigatoriedade de ter uma empresa na tabela de usuÃ¡rios
ALTER TABLE public.users ALTER COLUMN company_id DROP NOT NULL;

-- Desvincular o usuÃ¡rio lucas.soares de qualquer empresa, tornando-o um Admin Global puro
UPDATE public.users SET company_id = NULL WHERE username = 'lucas.soares';
-- Tabela para mural de anotaÃ§Ãµes (Recados do Master)
CREATE TABLE IF NOT EXISTS public.system_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para controle financeiro (Mensalidades das empresas)
CREATE TABLE IF NOT EXISTS public.company_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar polÃ­ticas de seguranÃ§a bÃ¡sicas para as novas tabelas
ALTER TABLE public.system_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payments ENABLE ROW LEVEL SECURITY;

-- No Painel SaaS, as regras de RLS dependem de `is_super_admin` estar logado
-- Permitir acesso total aos Super Admins.
DROP POLICY IF EXISTS "Super admins podem ver notas" ON public.system_notes;
CREATE POLICY "Super admins podem ver notas" ON public.system_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

DROP POLICY IF EXISTS "Super admins podem ver finanÃ§as" ON public.company_payments;
CREATE POLICY "Super admins podem ver finanÃ§as" ON public.company_payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

-- Modificar a tabela de permissÃµes no Frontend Ã© suficiente para adicionar as flags de SaaS no JSON `permissions`.
-- ==============================================================================
-- MIGRAÃ‡ÃƒO PARA GARANTIR NOMES DE USUÃRIO ÃšNICOS
-- ==============================================================================

-- 1. Normalizar usernames jÃ¡ cadastrados para minÃºsculas e sem espaÃ§os nas bordas
UPDATE public.users SET username = LOWER(TRIM(username));

-- 2. Adicionar a restriÃ§Ã£o de Unicidade na coluna username da tabela users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);

-- ==============================================================================
-- FIM DA MIGRAÃ‡ÃƒO
-- ==============================================================================
-- Adicionar colunas de faturamento na tabela de empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 10;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Atualizar registros existentes para terem valores padrÃ£o consistentes
UPDATE public.companies SET billing_day = 10 WHERE billing_day IS NULL;
UPDATE public.companies SET monthly_fee = 0.00 WHERE monthly_fee IS NULL;
-- Adicionar coluna 'checked' para marcar recados como concluÃ­dos
ALTER TABLE public.system_notes ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;

-- Atualizar recados anteriores para falso
UPDATE public.system_notes SET checked = false WHERE checked IS NULL;
-- ==============================================================================
-- MIGRAÃ‡ÃƒO PARA ADICIONAR CAMPOS DE DIVERGÃŠNCIA FÃSICA E ALERTA DE ESTOQUE
-- ==============================================================================

-- 1. Adicionar novas colunas para controle de divergÃªncias fÃ­sicas
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS system_stock_at_load NUMERIC DEFAULT 0;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_verification TEXT DEFAULT 'pending';
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_divergence_found BOOLEAN DEFAULT false;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS divergence_resolved BOOLEAN DEFAULT false;

-- 2. Retroalimentar itens existentes com o estoque atual dos produtos correspondentes
UPDATE public.operation_items oi
SET system_stock_at_load = COALESCE((
    SELECT p.stock 
    FROM public.products p 
    WHERE p.id = oi.product_id
), 0)
WHERE system_stock_at_load IS NULL OR system_stock_at_load = 0;
-- Create operation_alerts table
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

-- Enable Row Level Security
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for all users (consistent with other tables accessed anonymously)
DROP POLICY IF EXISTS "Allow all actions for authenticated users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for all users on operation_alerts" ON public.operation_alerts
FOR ALL USING (true) WITH CHECK (true);

-- Tabela para capturar solicitaÃ§Ãµes de demonstraÃ§Ã£o / contatos da landing page (Leads)
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

-- 1. PolÃ­tica para permitir que qualquer pessoa (pÃºblico anÃ´nimo) insira novos leads
DROP POLICY IF EXISTS "Permitir inserÃ§Ã£o de leads pÃºblica" ON public.system_leads;
CREATE POLICY "Permitir inserÃ§Ã£o de leads pÃºblica" ON public.system_leads
    FOR INSERT
    WITH CHECK (true);

-- 2. PolÃ­tica para permitir que apenas Super Admins visualizem os leads
DROP POLICY IF EXISTS "Apenas super admins podem visualizar leads" ON public.system_leads;
CREATE POLICY "Apenas super admins podem visualizar leads" ON public.system_leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

-- 3. PolÃ­tica para permitir que apenas Super Admins excluam leads
DROP POLICY IF EXISTS "Apenas super admins podem excluir leads" ON public.system_leads;
CREATE POLICY "Apenas super admins podem excluir leads" ON public.system_leads
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );
-- Adiciona a coluna min_stock_alert Ã  tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 0 NOT NULL;
-- Tabela de InventÃ¡rios Planejados
CREATE TABLE public.planned_inventories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'planning' NOT NULL, -- planning, in_progress, completed
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.planned_inventories ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas para planned_inventories
DROP POLICY IF EXISTS "UsuÃ¡rios podem ver inventÃ¡rios de sua empresa" ON public.planned_inventories;
CREATE POLICY "UsuÃ¡rios podem ver inventÃ¡rios de sua empresa" ON public.planned_inventories FOR SELECT 
    USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar inventÃ¡rios" ON public.planned_inventories;
CREATE POLICY "Gestores/Admins podem gerenciar inventÃ¡rios" ON public.planned_inventories FOR ALL 
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

-- Tabela de Ãreas do InventÃ¡rio Planejado
CREATE TABLE public.planned_inventory_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.planned_inventories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.planned_inventory_areas ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas para planned_inventory_areas
DROP POLICY IF EXISTS "UsuÃ¡rios podem ver Ã¡reas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_areas;
CREATE POLICY "UsuÃ¡rios podem ver Ã¡reas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_areas FOR SELECT 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar Ã¡reas" ON public.planned_inventory_areas;
CREATE POLICY "Gestores/Admins podem gerenciar Ã¡reas" ON public.planned_inventory_areas FOR ALL 
    USING (
        inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')))
    );

-- Tabela de Coletas do InventÃ¡rio Planejado
CREATE TABLE public.planned_inventory_counts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.planned_inventories(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.planned_inventory_areas(id) ON DELETE CASCADE,
    product_code VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    user_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.planned_inventory_counts ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas para planned_inventory_counts
DROP POLICY IF EXISTS "UsuÃ¡rios podem ver coletas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_counts;
CREATE POLICY "UsuÃ¡rios podem ver coletas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_counts FOR SELECT 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Qualquer usuÃ¡rio logado pode inserir coletas" ON public.planned_inventory_counts;
CREATE POLICY "Qualquer usuÃ¡rio logado pode inserir coletas" ON public.planned_inventory_counts FOR INSERT 
    WITH CHECK (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Qualquer usuÃ¡rio logado pode atualizar suas prÃ³prias coletas (por area)" ON public.planned_inventory_counts;
CREATE POLICY "Qualquer usuÃ¡rio logado pode atualizar suas prÃ³prias coletas (por area)" ON public.planned_inventory_counts FOR UPDATE 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));
-- 1. Remover polÃ­ticas antigas
DROP POLICY IF EXISTS "UsuÃ¡rios podem ver inventÃ¡rios de sua empresa" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar inventÃ¡rios" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem inserir inventÃ¡rios" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem atualizar inventÃ¡rios" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem deletar inventÃ¡rios" ON public.planned_inventories;

DROP POLICY IF EXISTS "UsuÃ¡rios podem ver Ã¡reas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar Ã¡reas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem inserir Ã¡reas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem atualizar Ã¡reas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem deletar Ã¡reas" ON public.planned_inventory_areas;

DROP POLICY IF EXISTS "UsuÃ¡rios podem ver coletas dos inventÃ¡rios de sua empresa" ON public.planned_inventory_counts;
DROP POLICY IF EXISTS "Qualquer usuÃ¡rio logado pode inserir coletas" ON public.planned_inventory_counts;
DROP POLICY IF EXISTS "Qualquer usuÃ¡rio logado pode atualizar suas prÃ³prias coletas (por area)" ON public.planned_inventory_counts;

-- 2. Recriar polÃ­ticas no padrÃ£o do sistema (permitindo acesso anÃ´nimo pela API do frontend)
DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventories" ON public.planned_inventories;
CREATE POLICY "Allow all actions for all users on planned_inventories" ON public.planned_inventories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventory_areas" ON public.planned_inventory_areas;
CREATE POLICY "Allow all actions for all users on planned_inventory_areas" ON public.planned_inventory_areas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventory_counts" ON public.planned_inventory_counts;
CREATE POLICY "Allow all actions for all users on planned_inventory_counts" ON public.planned_inventory_counts FOR ALL USING (true) WITH CHECK (true);
-- 1. Adicionar colunas de regras na tabela de inventÃ¡rios
ALTER TABLE public.planned_inventories 
  ADD COLUMN IF NOT EXISTS collection_rule VARCHAR(50) DEFAULT 'registered_only' NOT NULL,
  ADD COLUMN IF NOT EXISTS divergence_rule VARCHAR(50) DEFAULT 'ignore_uncollected' NOT NULL;

-- 2. Criar a tabela de Setores
CREATE TABLE IF NOT EXISTS public.planned_inventory_sectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.planned_inventories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.planned_inventory_sectors ENABLE ROW LEVEL SECURITY;

-- 3. Aplicar a mesma polÃ­tica de acesso livre (controle pelo frontend)
DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventory_sectors" ON public.planned_inventory_sectors;
DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventory_sectors" ON public.planned_inventory_sectors;
CREATE POLICY "Allow all actions for all users on planned_inventory_sectors" ON public.planned_inventory_sectors FOR ALL USING (true) WITH CHECK (true);

-- 4. Alterar a tabela de Ãreas para pertencer a um Setor
ALTER TABLE public.planned_inventory_areas
  ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.planned_inventory_sectors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS area_number INTEGER;

-- 5. Limpar as Ã¡reas antigas (soltas) para evitar conflitos de dados jÃ¡ que mudamos a estrutura
DELETE FROM public.planned_inventory_areas WHERE sector_id IS NULL;
ALTER TABLE public.delivery_clients
ADD COLUMN IF NOT EXISTS delivery_sequence INTEGER DEFAULT 0;
-- ========================================================================================
-- AtualizaÃ§Ã£o: Adicionar campo extra_info nas contagens de inventÃ¡rio
-- Execute este script no SQL Editor do Supabase
-- ========================================================================================

-- Adicionar na tabela de contagens de inventÃ¡rios planejados
ALTER TABLE public.planned_inventory_counts 
ADD COLUMN IF NOT EXISTS extra_info text;

-- Adicionar na tabela de contagens livres (adhoc)
ALTER TABLE public.adhoc_count_items 
ADD COLUMN IF NOT EXISTS extra_info text;

-- Fim da atualizaÃ§Ã£o
-- ========================================================================================
-- AtualizaÃ§Ã£o: Adicionar campo status nas Ã¡reas de inventÃ¡rio
-- Execute este script no SQL Editor do Supabase
-- ========================================================================================

-- Adicionar na tabela de Ã¡reas de inventÃ¡rios planejados
ALTER TABLE public.planned_inventory_areas 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Fim da atualizaÃ§Ã£o
-- Desabilitar temporariamente RLS para as tabelas de insumos para investigar e corrigir o bloqueio
alter table public.supplies disable row level security;
alter table public.supply_requests disable row level security;
alter table public.equipment_order_supplies disable row level security;

-- Limpar as politicas antigas (opcional)
drop policy if exists "Enable all for authenticated users" on public.supplies;
drop policy if exists "Enable all for authenticated users" on public.supply_requests;
drop policy if exists "Enable all for authenticated users" on public.equipment_order_supplies;
-- Habilitar RLS novamente
alter table public.supplies enable row level security;
alter table public.supply_requests enable row level security;
alter table public.equipment_order_supplies enable row level security;

-- Limpar politicas antigas que estÃ£o causando o bloqueio
drop policy if exists "Enable all for authenticated users" on public.supplies;
drop policy if exists "Enable all for authenticated users" on public.supply_requests;
drop policy if exists "Enable all for authenticated users" on public.equipment_order_supplies;

drop policy if exists "Enable all for anon users" on public.supplies;
drop policy if exists "Enable all for anon users" on public.supply_requests;
drop policy if exists "Enable all for anon users" on public.equipment_order_supplies;

-- O sistema usa login customizado, entÃ£o o Postgres vÃª as chamadas como 'anon' (anÃ´nimas).
-- Devemos permitir acesso para a role anon.
DROP POLICY IF EXISTS "Enable all for anon users" ON public.supplies;
CREATE POLICY "Enable all for anon users" ON public.supplies
  for all to anon using (true) with check (true);

DROP POLICY IF EXISTS "Enable all for anon users" ON public.supply_requests;
CREATE POLICY "Enable all for anon users" ON public.supply_requests
  for all to anon using (true) with check (true);

DROP POLICY IF EXISTS "Enable all for anon users" ON public.equipment_order_supplies;
CREATE POLICY "Enable all for anon users" ON public.equipment_order_supplies
  for all to anon using (true) with check (true);
-- Add garage_address to companies table to be used for routing optimization
alter table public.companies add column if not exists garage_address text;
-- Add latitude and longitude to delivery_clients
alter table public.delivery_clients add column if not exists latitude numeric;
alter table public.delivery_clients add column if not exists longitude numeric;
-- Add more fields to companies table
alter table public.companies add column if not exists fantasy_name text;
alter table public.companies add column if not exists phone text;
alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists additional_info text;
alter table public.companies add column if not exists garage_lat numeric;
alter table public.companies add column if not exists garage_lng numeric;
-- Add latitude and longitude to customers
alter table public.customers add column if not exists latitude numeric;
alter table public.customers add column if not exists longitude numeric;


