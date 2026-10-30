-- ====================================================================================
-- TONMOY VARIETY STORE - BANNERS & OFFERS TABLE MIGRATION
-- (চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর - ব্যানার ও অফার টেবিল এবং সিড ডাটা)
-- ====================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  title_bn TEXT NOT NULL,
  subtitle TEXT,
  subtitle_bn TEXT,
  badge_text TEXT,
  badge_text_bn TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '/shop',
  button_text TEXT DEFAULT 'Shop Now',
  button_text_bn TEXT DEFAULT 'বাজার করুন',
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort ON public.banners(sort_order);

-- 3. Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners"
  ON public.banners FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can manage banners" ON public.banners;
CREATE POLICY "Anyone can manage banners"
  ON public.banners FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Seed Official Store & 5 Authentic Promo Banners
INSERT INTO public.banners (
  id, title, title_bn, subtitle, subtitle_bn, badge_text, badge_text_bn,
  image_url, link_url, button_text, button_text_bn, sort_order, is_active
) VALUES 
(
  'b1000000-0000-0000-0000-000000000001',
  'Tonmoy Variety Store',
  'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
  'All your daily essentials now in one place!',
  'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন এক জায়গায়!',
  'Official Store',
  'অফিসিয়াল স্টোর',
  '/images/tonmoy-variety-store-hero-banner.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  1,
  true
),
(
  'b1000000-0000-0000-0000-000000000002',
  '5% OFF For Ramadan',
  'রমজান উপলক্ষে বিশেষ ছাড়!',
  'All your daily essentials at more affordable prices!',
  'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন আরও সাশ্রয়ী মূল্যে!',
  '5% OFF',
  'রমজান ৫% ছাড়',
  '/images/banners/banner-ramadan-special-5off.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  2,
  true
),
(
  'b1000000-0000-0000-0000-000000000003',
  '2% OFF For Friday',
  'শুক্রবারে বিশেষ ছাড়!',
  'All your daily essentials at more affordable prices!',
  'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন আরও সাশ্রয়ী মূল্যে!',
  '2% OFF',
  'শুক্রবার ২% ছাড়',
  '/images/banners/banner-friday-special-2off.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  3,
  true
),
(
  'b1000000-0000-0000-0000-000000000004',
  '5% Discount Qurbani Eid Special',
  'কোরবানী ঈদ উপলক্ষে বিশেষ ছাড়',
  'For favorite food, for loved ones — make Eid joy even more special!',
  'প্রিয় খাবার, প্রিয় মানুষের জন্য — কোরবানীর আনন্দ হোক আরও বিশেষ!',
  'Eid Mubarak',
  'কোরবানী ঈদ ৫% ছাড়',
  '/images/banners/banner-qurbani-eid-5discount.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  4,
  true
),
(
  'b1000000-0000-0000-0000-000000000005',
  '2% Discount Happy New Year',
  'নতুন বছরের বিশেষ অফার',
  'For favorite food, for loved ones — more savings in the new year!',
  'প্রিয় খাবার, প্রিয় মানুষের জন্য — নতুন বছরে আরও বেশি সাশ্রয়!',
  'Happy New Year',
  'নতুন বছর ২% ছাড়',
  '/images/banners/banner-new-year-2discount.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  5,
  true
),
(
  'b1000000-0000-0000-0000-000000000006',
  '2% Discount Pohela Boishakh',
  'বাংলা নববর্ষ উপলক্ষে বিশেষ ছাড়',
  'New shopping in the new year, stay healthy, stay well!',
  'নতুন বছরে নতুন কেনাকাটা, সুস্থ থাকুন, ভালো থাকুন!',
  'Pohela Boishakh',
  'বৈশাখী ২% ছাড়',
  '/images/banners/banner-boishakh-2discount.jpg',
  '/shop',
  'Shop Now',
  'বাজার করুন',
  6,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_bn = EXCLUDED.title_bn,
  subtitle = EXCLUDED.subtitle,
  subtitle_bn = EXCLUDED.subtitle_bn,
  badge_text = EXCLUDED.badge_text,
  badge_text_bn = EXCLUDED.badge_text_bn,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  button_text = EXCLUDED.button_text,
  button_text_bn = EXCLUDED.button_text_bn,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- 5. Storage Bucket (Optional if Supabase Storage is configured)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('banners', 'banners', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Silently ignore if storage schema is not installed
END $$;
