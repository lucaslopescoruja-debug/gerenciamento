-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver inventários de sua empresa" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar inventários" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem inserir inventários" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem atualizar inventários" ON public.planned_inventories;
DROP POLICY IF EXISTS "Gestores/Admins podem deletar inventários" ON public.planned_inventories;

DROP POLICY IF EXISTS "Usuários podem ver áreas dos inventários de sua empresa" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem gerenciar áreas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem inserir áreas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem atualizar áreas" ON public.planned_inventory_areas;
DROP POLICY IF EXISTS "Gestores/Admins podem deletar áreas" ON public.planned_inventory_areas;

DROP POLICY IF EXISTS "Usuários podem ver coletas dos inventários de sua empresa" ON public.planned_inventory_counts;
DROP POLICY IF EXISTS "Qualquer usuário logado pode inserir coletas" ON public.planned_inventory_counts;
DROP POLICY IF EXISTS "Qualquer usuário logado pode atualizar suas próprias coletas (por area)" ON public.planned_inventory_counts;

-- 2. Recriar políticas no padrão do sistema (permitindo acesso anônimo pela API do frontend)
CREATE POLICY "Allow all actions for all users on planned_inventories" 
    ON public.planned_inventories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for all users on planned_inventory_areas" 
    ON public.planned_inventory_areas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for all users on planned_inventory_counts" 
    ON public.planned_inventory_counts FOR ALL USING (true) WITH CHECK (true);
