-- Representantes / Vendedores
create table if not exists public.sales_reps (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true not null,
    nickname varchar(255),
    legal_name varchar(255),
    document varchar(50),
    phone varchar(50),
    city varchar(100),
    state varchar(2),
    regions text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add sales_rep_id to customers
alter table public.customers add column if not exists sales_rep_id uuid references public.sales_reps(id) on delete set null;

-- Trigger to update updated_at
create trigger handle_updated_at before update on public.sales_reps
  for each row execute procedure moddatetime (updated_at);
