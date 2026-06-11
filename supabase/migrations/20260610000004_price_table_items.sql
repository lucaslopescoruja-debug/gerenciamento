alter table public.price_tables add column if not exists code varchar(50);

create table if not exists public.price_table_items (
    id uuid default gen_random_uuid() primary key,
    price_table_id uuid not null references public.price_tables(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    price numeric(10,2) default 0.00 not null,
    discount_percent numeric(5,2) default 0.00,
    max_discount_percent numeric(5,2) default 0.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(price_table_id, product_id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_table_items') THEN
        CREATE TRIGGER handle_updated_at_price_table_items BEFORE UPDATE ON public.price_table_items FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;

ALTER TABLE public.price_table_items DISABLE ROW LEVEL SECURITY;
