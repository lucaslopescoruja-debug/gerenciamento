-- Regions
create table if not exists public.regions (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Price Tables
create table if not exists public.price_tables (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Customers
alter table public.customers drop column if exists region;
alter table public.customers drop column if exists price_table;

alter table public.customers add column if not exists region_id uuid references public.regions(id) on delete set null;
alter table public.customers add column if not exists price_table_id uuid references public.price_tables(id) on delete set null;

-- Update Sales Reps
alter table public.sales_reps drop column if exists regions;

create table if not exists public.sales_rep_regions (
    sales_rep_id uuid references public.sales_reps(id) on delete cascade,
    region_id uuid references public.regions(id) on delete cascade,
    primary key (sales_rep_id, region_id)
);

-- Add triggers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_regions') THEN
        CREATE TRIGGER handle_updated_at_regions BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_tables') THEN
        CREATE TRIGGER handle_updated_at_price_tables BEFORE UPDATE ON public.price_tables FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;
