-- Migration to make order_number unique per company and calculate it per company

-- 1. Remove the global unique constraint
DROP INDEX IF EXISTS sales_orders_order_number_idx;

-- 2. Create a compound unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_company_order_number_idx ON public.sales_orders(company_id, order_number);

-- 3. Remove the sequence default from the column
ALTER TABLE public.sales_orders ALTER COLUMN order_number DROP DEFAULT;

-- 4. Create a function to auto-generate the order number per company
CREATE OR REPLACE FUNCTION generate_sales_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
BEGIN
  -- Se o número não foi gerado/passado, calculamos o próximo da empresa
  IF NEW.order_number IS NULL THEN
    SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_number
    FROM public.sales_orders
    WHERE company_id = NEW.company_id;

    NEW.order_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS trg_generate_sales_order_number ON public.sales_orders;
CREATE TRIGGER trg_generate_sales_order_number
  BEFORE INSERT ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_sales_order_number();
