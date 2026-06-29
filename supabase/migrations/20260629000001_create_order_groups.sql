-- Migration: Grupos de Pedidos e Alteração de Status
-- Criação da tabela order_groups
CREATE TABLE IF NOT EXISTS public.order_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for order_groups
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;

-- Policies for order_groups
CREATE POLICY "Users can view order_groups of their company" ON public.order_groups
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins and managers can manage order_groups" ON public.order_groups
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    ) WITH CHECK (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    );

-- Adicionar coluna order_group_id na tabela sales_orders
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS order_group_id UUID REFERENCES public.order_groups(id) ON DELETE RESTRICT;

-- Atualizar CHECK constraint da coluna status
-- Primeiro, removemos a constraint atual (o nome pode variar conforme como foi criado, mas vamos tentar remover)
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Adicionamos a nova constraint
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('Rascunho', 'Pedido Criado', 'Enviado', 'Faturado', 'Cancelado', 'Retornou', 'Entregue'));

-- Trigger for updated_at in order_groups
CREATE TRIGGER handle_updated_at_order_groups
    BEFORE UPDATE ON public.order_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
