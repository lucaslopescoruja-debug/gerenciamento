-- Add approval fields to delivery_items
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS requested_qty integer;

-- Update RLS policies (already permissive for authenticated users from previous fix, but good to be explicit)
-- Actually, the previous fix "Allow all actions on delivery_items" already covers this.
