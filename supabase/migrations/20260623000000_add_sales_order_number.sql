-- Migration to add a sequential order_number to sales_orders starting at 50000

-- Create the sequence
CREATE SEQUENCE IF NOT EXISTS sales_order_number_seq START 50000;

-- Add the column with default value from sequence
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS order_number integer DEFAULT nextval('sales_order_number_seq');

-- Create a unique index to ensure no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_order_number_idx ON public.sales_orders(order_number);
