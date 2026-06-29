DROP POLICY IF EXISTS "Admins and managers can manage order_groups" ON public.order_groups;

CREATE POLICY "Admins and managers can manage order_groups" ON public.order_groups
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor', 'master')
        )
    ) WITH CHECK (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor', 'master')
        )
    );
