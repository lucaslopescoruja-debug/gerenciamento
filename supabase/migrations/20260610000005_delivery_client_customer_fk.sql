alter table public.delivery_clients add column if not exists customer_id uuid references public.customers(id) on delete set null;
