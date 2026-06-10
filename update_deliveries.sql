ALTER TABLE public.delivery_clients
ADD COLUMN IF NOT EXISTS delivery_sequence INTEGER DEFAULT 0;
