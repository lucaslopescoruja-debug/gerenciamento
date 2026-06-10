-- ========================================================================================
-- Atualização: Adicionar campo status nas áreas de inventário
-- Execute este script no SQL Editor do Supabase
-- ========================================================================================

-- Adicionar na tabela de áreas de inventários planejados
ALTER TABLE public.planned_inventory_areas 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Fim da atualização
