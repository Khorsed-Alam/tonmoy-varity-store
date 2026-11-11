-- Add promo_code and discount_percent to banners table
ALTER TABLE public.banners 
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN public.banners.promo_code IS 'Promo code associated with this banner (e.g. RAMADAN5, FRIDAY2). Only valid when is_active is true.';
COMMENT ON COLUMN public.banners.discount_percent IS 'Percentage discount granted by this promo code (e.g. 5.00 for 5%). Dynamic and configurable from Admin.';

