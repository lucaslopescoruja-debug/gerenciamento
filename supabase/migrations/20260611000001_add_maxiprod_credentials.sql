ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_api_token TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_last_sync TIMESTAMP WITH TIME ZONE;