-- Fix RLS Policies for deliveries module

ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- Drop them first just in case
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;

CREATE POLICY "Allow all actions for authenticated users on delivery_routes"
ON public.delivery_routes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on delivery_clients"
ON public.delivery_clients
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on delivery_items"
ON public.delivery_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);
