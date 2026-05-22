-- ============================================
-- Criação de Tabelas do Módulo de Entregas
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

-- Habilitar Políticas de Segurança de Nível de Linha (RLS)
ALTER TABLE public.delivery_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items DISABLE ROW LEVEL SECURITY;
