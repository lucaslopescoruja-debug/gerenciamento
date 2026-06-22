-- Add factory_code to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS factory_code text;
