-- Migration to make os_number unique per company and calculate it per company

-- 1. Remove the global unique constraint if exists
DROP INDEX IF EXISTS equipment_orders_os_number_idx;
DROP INDEX IF EXISTS equipment_orders_os_number_key;

-- 2. Create a compound unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS equipment_orders_company_os_number_idx ON public.equipment_orders(company_id, os_number);

-- 3. Remove the sequence/default from the column
ALTER TABLE public.equipment_orders ALTER COLUMN os_number DROP DEFAULT;
ALTER TABLE public.equipment_orders ALTER COLUMN os_number DROP IDENTITY IF EXISTS;

-- 4. Create a function to auto-generate the OS number per company
CREATE OR REPLACE FUNCTION generate_equipment_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
BEGIN
  -- Se o número não foi gerado/passado, calculamos o próximo da empresa
  IF NEW.os_number IS NULL THEN
    SELECT COALESCE(MAX(os_number), 0) + 1
    INTO next_number
    FROM public.equipment_orders
    WHERE company_id = NEW.company_id;

    NEW.os_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS trg_generate_equipment_order_number ON public.equipment_orders;
CREATE TRIGGER trg_generate_equipment_order_number
  BEFORE INSERT ON public.equipment_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_equipment_order_number();
