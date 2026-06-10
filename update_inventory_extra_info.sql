-- ========================================================================================
-- Atualização: Adicionar campo extra_info nas contagens de inventário
-- Execute este script no SQL Editor do Supabase
-- ========================================================================================

-- Adicionar na tabela de contagens de inventários planejados
ALTER TABLE public.planned_inventory_counts 
ADD COLUMN IF NOT EXISTS extra_info text;

-- Adicionar na tabela de contagens livres (adhoc)
ALTER TABLE public.adhoc_count_items 
ADD COLUMN IF NOT EXISTS extra_info text;

-- Fim da atualização
