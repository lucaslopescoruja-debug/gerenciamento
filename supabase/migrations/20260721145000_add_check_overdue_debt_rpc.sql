-- supabase/migrations/20260721145000_add_check_overdue_debt_rpc.sql
CREATE OR REPLACE FUNCTION check_overdue_debt(p_company_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_has_debt BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.company_payments 
        WHERE company_id = p_company_id 
          AND status != 'pago' 
          AND due_date <= (CURRENT_DATE - INTERVAL '7 days')
    ) INTO v_has_debt;
    
    RETURN v_has_debt;
END;
$$ LANGUAGE plpgsql;
