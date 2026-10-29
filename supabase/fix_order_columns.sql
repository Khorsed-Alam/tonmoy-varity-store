-- ====================================================================================
-- TONMOY VARIETY STORE - ORDER COLUMNS COMPATIBILITY PATCH
-- Fixes: Could not find the 'alternate_phone' column of 'orders' in the schema cache
-- ====================================================================================

-- 1. ADD MISSING COLUMNS TO ORDERS TABLE
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- 2. ADD MISSING COLUMNS TO ORDER_ITEMS TABLE
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;

-- 3. SYNC TRIGGER (KEEPS BOTH NAMING CONVENTIONS SYNCHRONIZED)
CREATE OR REPLACE FUNCTION public.sync_order_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync full_name <-> customer_name
  IF NEW.full_name IS NOT NULL AND NEW.customer_name IS NULL THEN
    NEW.customer_name := NEW.full_name;
  ELSIF NEW.customer_name IS NOT NULL AND NEW.full_name IS NULL THEN
    NEW.full_name := NEW.customer_name;
  END IF;

  -- Sync phone <-> customer_phone
  IF NEW.phone IS NOT NULL AND NEW.customer_phone IS NULL THEN
    NEW.customer_phone := NEW.phone;
  ELSIF NEW.customer_phone IS NOT NULL AND NEW.phone IS NULL THEN
    NEW.phone := NEW.customer_phone;
  END IF;

  -- Sync addresses
  IF NEW.shipping_address IS NOT NULL THEN
    NEW.customer_address := COALESCE(NEW.customer_address, NEW.shipping_address);
    NEW.delivery_address := COALESCE(NEW.delivery_address, NEW.shipping_address);
  ELSIF NEW.customer_address IS NOT NULL THEN
    NEW.shipping_address := NEW.customer_address;
    NEW.delivery_address := COALESCE(NEW.delivery_address, NEW.customer_address);
  END IF;

  -- Sync status
  IF NEW.status IS NOT NULL THEN
    NEW.order_status := NEW.status;
  ELSIF NEW.order_status IS NOT NULL THEN
    NEW.status := NEW.order_status;
  END IF;

  -- Sync total
  IF NEW.total_amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total := NEW.total_amount;
  ELSIF NEW.total IS NOT NULL AND (NEW.total_amount IS NULL OR NEW.total_amount = 0) THEN
    NEW.total_amount := NEW.total;
  END IF;

  -- Sync discount
  IF NEW.discount_amount IS NOT NULL AND (NEW.discount IS NULL OR NEW.discount = 0) THEN
    NEW.discount := NEW.discount_amount;
  ELSIF NEW.discount IS NOT NULL AND (NEW.discount_amount IS NULL OR NEW.discount_amount = 0) THEN
    NEW.discount_amount := NEW.discount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_order_columns ON public.orders;
CREATE TRIGGER tr_sync_order_columns
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_columns();

