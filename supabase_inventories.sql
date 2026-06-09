-- Tabela de Inventários Planejados
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

-- Políticas para planned_inventories
CREATE POLICY "Usuários podem ver inventários de sua empresa" 
    ON public.planned_inventories FOR SELECT 
    USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Gestores/Admins podem gerenciar inventários" 
    ON public.planned_inventories FOR ALL 
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

-- Tabela de Áreas do Inventário Planejado
CREATE TABLE public.planned_inventory_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.planned_inventories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.planned_inventory_areas ENABLE ROW LEVEL SECURITY;

-- Políticas para planned_inventory_areas
CREATE POLICY "Usuários podem ver áreas dos inventários de sua empresa" 
    ON public.planned_inventory_areas FOR SELECT 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Gestores/Admins podem gerenciar áreas" 
    ON public.planned_inventory_areas FOR ALL 
    USING (
        inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')))
    );

-- Tabela de Coletas do Inventário Planejado
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

-- Políticas para planned_inventory_counts
CREATE POLICY "Usuários podem ver coletas dos inventários de sua empresa" 
    ON public.planned_inventory_counts FOR SELECT 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Qualquer usuário logado pode inserir coletas" 
    ON public.planned_inventory_counts FOR INSERT 
    WITH CHECK (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Qualquer usuário logado pode atualizar suas próprias coletas (por area)" 
    ON public.planned_inventory_counts FOR UPDATE 
    USING (inventory_id IN (SELECT id FROM public.planned_inventories WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())));
