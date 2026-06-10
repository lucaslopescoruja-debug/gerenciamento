create table if not exists public.customers (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true,
    nickname text,
    document_type text check (document_type in ('CPF', 'CNPJ')),
    document text,
    fantasy_name text,
    legal_name text,
    cep text,
    address text,
    number text,
    complement text,
    neighborhood text,
    po_box text,
    city text,
    state text,
    phone1 text,
    phone2 text,
    phone3 text,
    phone4 text,
    email text,
    credit_limit numeric(15,2) default 0,
    price_table text,
    sales_rep text,
    payment_condition text,
    allow_unit_price_change boolean default false,
    region text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.customers enable row level security;

create policy "Users can view customers of their company" on public.customers
    for select using (company_id = (select company_id from public.users where id = auth.uid()));

create policy "Admins/Gestors can insert customers" on public.customers
    for insert with check (
        company_id = (select company_id from public.users where id = auth.uid()) and
        exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'gestor'))
    );

create policy "Admins/Gestors can update customers" on public.customers
    for update using (
        company_id = (select company_id from public.users where id = auth.uid()) and
        exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'gestor'))
    );

create policy "Admins/Gestors can delete customers" on public.customers
    for delete using (
        company_id = (select company_id from public.users where id = auth.uid()) and
        exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'gestor'))
    );
