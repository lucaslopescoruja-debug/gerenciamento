-- Fix users role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'gestor', 'master', 'conferente', 'motorista', 'ajudante', 'vendedor', 'representante', 'operador', 'mecanico', 'operator'));

-- Equipments
CREATE TABLE public.equipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  patrimony varchar NOT NULL,
  type varchar NOT NULL, -- Freezer, Geladeira, etc
  model varchar NOT NULL,
  size varchar, -- e.g. 400L
  status varchar NOT NULL DEFAULT 'Disponível', -- Teste, Disponível, Em Manutenção, Danificado, No Cliente
  current_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, patrimony)
);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipments of their company"
  ON public.equipments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipments of their company"
  ON public.equipments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update equipments of their company"
  ON public.equipments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete equipments of their company"
  ON public.equipments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment Orders
CREATE TABLE public.equipment_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  type varchar NOT NULL, -- entrega, recolha, troca, manutencao
  status varchar NOT NULL DEFAULT 'pendente', -- pendente, em_rota, concluido, cancelado
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date date,
  completed_at timestamp with time zone,
  signature_data text,
  term_pdf_url text,
  receiver_name varchar,
  receiver_doc varchar,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment_orders of their company"
  ON public.equipment_orders FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipment_orders of their company"
  ON public.equipment_orders FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update equipment_orders of their company"
  ON public.equipment_orders FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete equipment_orders of their company"
  ON public.equipment_orders FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment History
CREATE TABLE public.equipment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment_history of their company"
  ON public.equipment_history FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipment_history of their company"
  ON public.equipment_history FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at_equipments()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipments_updated_at
BEFORE UPDATE ON public.equipments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipments();

CREATE OR REPLACE FUNCTION set_updated_at_equipment_orders()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_orders_updated_at
BEFORE UPDATE ON public.equipment_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipment_orders();
