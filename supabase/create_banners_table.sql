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

-- 4. Seed Default Banners (Official Store Banner, Friday Special Offer, Eid Special Offer)
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
  'Friday Special Offer',
  'শুক্রবার স্পেশাল ধামাকা অফার',
  'Special discounts on pure cooking oil, spices, and groceries every Friday!',
  'খাঁটি সরিষার তেল, সয়াবিন তেল, মসলা ও ডালের ওপর বিশেষ ছাড়!',
  'Friday Offer',
  'শুক্রবার স্পেশাল',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  '/shop/category/cooking-essentials',
  'View Offers',
  'অফার দেখুন',
  2,
  true
),
(
  'b1000000-0000-0000-0000-000000000003',
  'Eid Special Mega Offer',
  'ঈদ স্পেশাল মেগা অফার',
  'Mega discount on Polao Rice, Lachha Semai, Powder Milk, and Pure Ghee!',
  'পোলাও চাল, লাচ্ছা সেমাই, গুঁড়ো দুধ ও খাঁটি ঘিয়ে আকর্ষণীয় মূল্যছাড়!',
  'Eid Mubarak',
  'ঈদ মোবারক',
  'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=1200&q=80',
  '/shop/category/snacks-beverages',
  'Get Eid Offer',
  'ঈদ অফার নিন',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  subtitle_bn = EXCLUDED.subtitle_bn,
  badge_text_bn = EXCLUDED.badge_text_bn,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
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
