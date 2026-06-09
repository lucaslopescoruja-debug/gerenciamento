-- 1. Adicionar colunas de regras na tabela de inventários
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

-- 3. Aplicar a mesma política de acesso livre (controle pelo frontend)
DROP POLICY IF EXISTS "Allow all actions for all users on planned_inventory_sectors" ON public.planned_inventory_sectors;
CREATE POLICY "Allow all actions for all users on planned_inventory_sectors" 
    ON public.planned_inventory_sectors FOR ALL USING (true) WITH CHECK (true);

-- 4. Alterar a tabela de Áreas para pertencer a um Setor
ALTER TABLE public.planned_inventory_areas
  ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.planned_inventory_sectors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS area_number INTEGER;

-- 5. Limpar as áreas antigas (soltas) para evitar conflitos de dados já que mudamos a estrutura
DELETE FROM public.planned_inventory_areas WHERE sector_id IS NULL;
