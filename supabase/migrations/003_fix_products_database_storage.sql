-- ====================================================================================
-- TONMOY VARIETY STORE - DATABASE FIX MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)
-- This ensures:
-- 1. All product columns exist (child_subcategory, cost_price, original_price)
-- 2. RLS policies allow public/anon & authenticated to Insert, Update, and Delete products
-- 3. Categories are updated to the official 7 categories matching the directory
-- ====================================================================================

-- 1. Ensure required columns on products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS child_subcategory TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- 2. Ensure RLS allows full product management from Admin Portal
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for products" ON public.products;
DROP POLICY IF EXISTS "Admins manage all products" ON public.products;
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- Allow reading products
CREATE POLICY "Allow public read products"
ON public.products FOR SELECT
TO public
USING (true);

-- Allow inserting products (Admin Add Product)
CREATE POLICY "Allow public insert products"
ON public.products FOR INSERT
TO public
WITH CHECK (true);

-- Allow updating products (Admin Edit Product & Stock update)
CREATE POLICY "Allow public update products"
ON public.products FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow deleting products (Admin Delete Product)
CREATE POLICY "Allow public delete products"
ON public.products FOR DELETE
TO public
USING (true);

-- 3. Ensure categories table also allows admin insert and updates
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read categories" ON public.categories;
CREATE POLICY "Allow anyone to read categories"
ON public.categories FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow anyone to insert categories" ON public.categories;
CREATE POLICY "Allow anyone to insert categories"
ON public.categories FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anyone to update categories" ON public.categories;
CREATE POLICY "Allow anyone to update categories"
ON public.categories FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 4. Update the 7 Official Main Categories in DB (Matching Directory)
INSERT INTO public.categories (id, name, name_bn, slug, icon, description_bn, sort_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'দুধ ও ডিম', 'dairy-eggs', '🥛', 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Cooking Essentials', 'রান্নার সামগ্রী', 'cooking-essentials', '🌾', 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Snacks & Beverages', 'নাস্তা ও পানীয়', 'snacks-beverages', '🍪', 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Baby Care', 'শিশুর যত্ন', 'baby-care', '👶', 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Beauty & Personal Care', 'সৌন্দর্য ও ব্যক্তিগত যত্ন', 'beauty-personal-care', '💄', 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Cleaning & Household', 'ক্লিনিং ও গৃহস্থালি', 'cleaning-household', '🧹', 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Stationery & Lifestyle', 'স্টেশনারি ও লাইফস্টাইল', 'stationery-lifestyle', '✏️', 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি', 7, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon,
  description_bn = EXCLUDED.description_bn,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

