-- Adicionar colunas de faturamento na tabela de empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 10;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Atualizar registros existentes para terem valores padrão consistentes
UPDATE public.companies SET billing_day = 10 WHERE billing_day IS NULL;
UPDATE public.companies SET monthly_fee = 0.00 WHERE monthly_fee IS NULL;
