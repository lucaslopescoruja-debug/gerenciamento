-- Migration para manter a tabela sales_reps sincronizada com a tabela users

CREATE OR REPLACE FUNCTION public.sync_user_to_sales_rep()
RETURNS trigger AS $$
BEGIN
  -- We only sync users with role 'vendedor' or 'representante'
  IF NEW.role IN ('vendedor', 'representante') THEN
    INSERT INTO public.sales_reps (id, company_id, nickname, legal_name, active)
    VALUES (NEW.id, NEW.company_id, NEW.name, NEW.name, NEW.active)
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      legal_name = EXCLUDED.legal_name,
      active = EXCLUDED.active,
      updated_at = timezone('utc'::text, now());
  ELSE
    -- If the role is NOT one of those (e.g. role changed), disable the sales_rep
    UPDATE public.sales_reps
    SET active = false, updated_at = timezone('utc'::text, now())
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_to_sales_rep_trigger ON public.users;
CREATE TRIGGER sync_user_to_sales_rep_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_sales_rep();

-- Sincronizar usuários existentes imediatamente (Backfill)
INSERT INTO public.sales_reps (id, company_id, nickname, legal_name, active)
SELECT id, company_id, name, name, active
FROM public.users
WHERE role IN ('vendedor', 'representante')
ON CONFLICT (id) DO NOTHING;
