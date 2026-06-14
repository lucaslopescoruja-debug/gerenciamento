-- Add garage_address to companies table to be used for routing optimization
alter table public.companies add column if not exists garage_address text;
