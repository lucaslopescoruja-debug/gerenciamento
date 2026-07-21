-- supabase/migrations/20260721144000_debug_payments_rpc.sql
CREATE OR REPLACE FUNCTION debug_get_all_payments()
RETURNS TABLE (
    id UUID,
    company_id UUID,
    amount DECIMAL,
    status TEXT,
    due_date DATE
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT cp.id, cp.company_id, cp.amount, cp.status, cp.due_date FROM public.company_payments cp;
END;
$$ LANGUAGE plpgsql;
