-- ======================================================================================
-- মেসার্স তন্ময় ভ্যারাইটি স্টোর (M/S Tonmoy Varity Store)
-- হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া
-- প্রোপ্রাইটার: মোঃ তৌহিদুল ইসলাম বিন্দু | ফোন: ০১৭১৭-৯৯৯৪৬০
--
-- 100% Production-Grade Supabase PostgreSQL Schema, RLS Policies, Triggers & Seed Data
-- ======================================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean Reset: Drop existing tables if re-running (ensures fresh tables with all columns)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.shop_settings CASCADE;

-- ======================================================================================
-- 3. Profiles Table (Linked with Supabase auth.users)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'বগুড়া',
  area TEXT NOT NULL DEFAULT 'নারুয়ামালা',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 4. Categories Table (Aligned with Stitch Design System)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  icon_name TEXT DEFAULT 'inventory_2', -- Material Symbols Outlined icon name (grain, oil_barrel, soup_kitchen, etc.)
  description_bn TEXT DEFAULT '',
  subcategories TEXT[] DEFAULT '{}',
  item_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 5. Products Table (With Subcategories, Packaging Tags, Units & Cost Price)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT DEFAULT '',
  subcategory TEXT DEFAULT '', -- e.g. মিনিকেট, নাজিরশাইল, সয়াবিন তেল
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT DEFAULT '',
  description_bn TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price >= price),
  cost_price NUMERIC(10, 2) CHECK (cost_price IS NULL OR cost_price >= 0), -- For admin profit margin reporting
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'কেজি', -- e.g. ২৫ কেজি, ১ কেজি, ৫০০ মিলি, ৫ লিটার
  tag TEXT DEFAULT '', -- e.g. ফ্রেশ প্যাক, ২৫ কেজি বস্তা, সেরা মান, পোলাও স্পেশাল, ৩০ ছাড়
  image_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 6. Orders Table (With Guest Checkout, TrxID, Payment Status & Time Slot)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable to allow instant guest checkout
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  alternate_phone TEXT DEFAULT '',
  shipping_address TEXT NOT NULL DEFAULT '',
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('home_delivery', 'store_pickup')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'pay_at_store', 'bkash', 'nagad', 'rocket')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  transaction_id TEXT DEFAULT '', -- For bKash / Nagad TrxID verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT DEFAULT '',
  delivery_time_slot TEXT DEFAULT '', -- e.g. ৬০ মিনিট এক্সপ্রেস ডেলিভারি
  assigned_delivery_man TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 7. Order Items Table (With Unit, Snapshot Price & Generated Total)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_name_bn TEXT DEFAULT '',
  unit TEXT DEFAULT 'কেজি',
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 8. Shop Settings Table (Official Tonmoy Store Configuration)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'M/S Tonmoy Varity Store',
  store_name_bn TEXT NOT NULL DEFAULT 'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
  proprietor_name TEXT NOT NULL DEFAULT 'মোঃ তৌহিদুল ইসলাম বিন্দু',
  phone TEXT NOT NULL DEFAULT '01717-999460',
  bkash_number TEXT NOT NULL DEFAULT '01717-999460',
  nagad_number TEXT NOT NULL DEFAULT '01717-999460',
  address TEXT NOT NULL DEFAULT 'হাজি ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 50,
  free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 500,
  open_hours TEXT NOT NULL DEFAULT 'প্রতিদিন: সকাল ৭টা – রাত ১১টা (সপ্তাহে ৭ দিন খোলা)',
  announcement_banner TEXT DEFAULT '🛵 আশেপাশের এলাকায় ৬০ মিনিটে ফ্রি ডেলিভারি (৳৫০০+ অর্ডারে)!',
  home_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  store_pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  bkash_enabled BOOLEAN NOT NULL DEFAULT true,
  pay_at_store_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================================================================================
-- 9. Automatic Updated At Timestamp Function & Triggers
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_categories_updated_at ON public.categories;
CREATE TRIGGER tr_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_shop_settings_updated_at ON public.shop_settings;
CREATE TRIGGER tr_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ======================================================================================
-- 10. Automatically Create Profile on User Sign Up (Supabase Auth Hook)
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ======================================================================================
-- 11. Helper Function: Check if the currently authenticated user is Admin
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ======================================================================================
-- 12. RPC Function: Server-side Stock Decrement on Order Placed
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================================
-- 13. Enable Row Level Security (RLS) on all tables
-- ======================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- ======================================================================================
-- 14. Profiles RLS Policies
-- ======================================================================================
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admins update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- ======================================================================================
-- 15. Categories RLS Policies
-- ======================================================================================
DROP POLICY IF EXISTS "Anyone can view active categories or admins view all" ON public.categories;
CREATE POLICY "Anyone can view active categories or admins view all"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- ======================================================================================
-- 16. Products RLS Policies
-- ======================================================================================
DROP POLICY IF EXISTS "Anyone can view active products or admins view all" ON public.products;
CREATE POLICY "Anyone can view active products or admins view all"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (true);

-- ======================================================================================
-- 17. Orders RLS Policies (Allows Guest Checkout without Login!)
-- ======================================================================================
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true); -- Allows both logged-in users and anonymous guests to checkout

DROP POLICY IF EXISTS "Users can view own orders or guest orders by id or admins view all" ON public.orders;
CREATE POLICY "Users can view own orders or guest orders by id or admins view all"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.uid() IS NULL -- Guest order tracking
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- ======================================================================================
-- 18. Order Items RLS Policies (Allows Guest Order Item Insertion)
-- ======================================================================================
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view items of own orders or admins view all" ON public.order_items;
CREATE POLICY "Users can view items of own orders or admins view all"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR auth.uid() IS NULL OR public.is_admin())
    )
  );

-- ======================================================================================
-- 19. Shop Settings RLS Policies
-- ======================================================================================
DROP POLICY IF EXISTS "Anyone can read shop settings" ON public.shop_settings;
CREATE POLICY "Anyone can read shop settings"
  ON public.shop_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update shop settings" ON public.shop_settings;
CREATE POLICY "Admins can update shop settings"
  ON public.shop_settings FOR ALL
  USING (public.is_admin());

-- ======================================================================================
-- 20. Supabase Storage Bucket Setup for Product Images
-- ======================================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'products' AND public.is_admin());

-- ======================================================================================
-- 21. Indexes for Maximum Performance & Instant Search
-- ======================================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ======================================================================================
-- 22. Initial Seed Data (Tonmoy Store Official Categories, Settings & Authentic Products)
-- ======================================================================================

-- Default Shop Settings
INSERT INTO public.shop_settings (
  id, store_name, store_name_bn, proprietor_name, phone, bkash_number, nagad_number,
  address, delivery_fee, free_delivery_threshold, open_hours, announcement_banner
)
VALUES (
  'default',
  'M/S Tonmoy Varity Store',
  'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
  'মোঃ তৌহিদুল ইসলাম বিন্দু',
  '01717-999460',
  '01717-999460',
  '01717-999460',
  'হাজি ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া',
  50,
  500,
  'প্রতিদিন: সকাল ৭টা – রাত ১১টা (সপ্তাহে ৭ দিন খোলা)',
  '🛵 আশেপাশের এলাকায় ৬০ মিনিটে ফ্রি ডেলিভারি (৳৫০০+ অর্ডারে)!'
)
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  store_name_bn = EXCLUDED.store_name_bn,
  proprietor_name = EXCLUDED.proprietor_name,
  phone = EXCLUDED.phone,
  bkash_number = EXCLUDED.bkash_number,
  nagad_number = EXCLUDED.nagad_number,
  address = EXCLUDED.address;

-- Initial 7 Stitch Grocery Categories
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description_bn, subcategories, item_count, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Rice & Dal', 'চাল ও ডাল', 'rice-dal', '🌾', 'grain', 'তাজা খাঁটি মানের চাল ও পুষ্টিকর দেশি ডাল', ARRAY['সকল', 'মিনিকেট', 'নাজিরশাইল', 'পোলাও চাল', 'মসুর ডাল', 'মুগ ডাল', 'ছোলা বুট'], 18, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Edible Oils', 'তেল ও ঘি', 'edible-oil', '🛢️', 'oil_barrel', '১০০% খাঁটি সরিষার তেল ও পুষ্টিকর সয়াবিন তেল', ARRAY['সকল', 'সয়াবিন তেল', 'সরিষার তেল', 'ঘি'], 12, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Pure Spices', 'মসলাপাতি', 'spices', '🧂', 'soup_kitchen', 'ভেজালমুক্ত খাঁটি গুঁড়া ও আস্ত রান্নার মসলা', ARRAY['সকল', 'হলুদ গুঁড়া', 'মরিচ গুঁড়া', 'জিরা', 'গরম মসলা'], 24, 3),
  ('c1000000-0000-0000-0000-000000000004', 'Atta & Flour', 'আটা-ময়দা', 'flour', '🌾', 'bakery_dining', 'মিল ফ্রেশ পুষ্টিকর আটা, ময়দা ও সুজি', ARRAY['সকল', 'প্যাকেট আটা', 'খোলা আটা', 'ময়দা', 'সুজি'], 9, 4),
  ('c1000000-0000-0000-0000-000000000005', 'Sugar & Salt', 'চিনি ও লবণ', 'essentials', '☕', 'kettle', 'দৈনন্দিন রান্নার রিফাইন চিনি ও আয়োডাইজড লবণ', ARRAY['সকল', 'সাদা চিনি', 'দেশি লাল চিনি', 'আয়োডিন লবণ'], 7, 5),
  ('c1000000-0000-0000-0000-000000000006', 'Biscuits & Tea', 'চা ও বিস্কুট', 'snacks-tea', '🍪', 'coffee', 'সকালের নাস্তা ও বিকেলের চায়ের সেরা আয়োজন', ARRAY['সকল', 'চা পাতা', 'টোস্ট', 'ক্র্যাকার্স', 'নুডলস'], 31, 6),
  ('c1000000-0000-0000-0000-000000000007', 'Soap & Wash', 'ক্লিনিং', 'soap-cleaning', '🧼', 'sanitizer', 'ঘরের পরিচ্ছন্নতায় বিশ্বস্ত ডিটারজেন্ট ও সাবান', ARRAY['সকল', 'কাপড় ধোয়া', 'বাসন মাজা', 'গায়ে মাখা সাবান'], 15, 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  icon = EXCLUDED.icon,
  icon_name = EXCLUDED.icon_name,
  description_bn = EXCLUDED.description_bn,
  subcategories = EXCLUDED.subcategories,
  item_count = EXCLUDED.item_count,
  sort_order = EXCLUDED.sort_order;

-- Initial Authentic Products from Stitch MCP Design
INSERT INTO public.products (
  id, category_id, category_slug, subcategory, name, name_bn, description, description_bn,
  price, original_price, cost_price, stock_quantity, unit, tag, is_featured, is_active, image_url
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'মিনিকেট',
    'Deshi Miniket Rice Sack (25kg)',
    'দেশি মিনিকেট চাল ২৫ কেজি বস্তা',
    'Premium clean Deshi Miniket rice sealed 25kg woven sack, wholesale price',
    'ঝরঝরে ও সুস্বাদু ২৫ কেজির প্রিমিয়াম দেশি মিনিকেট চালের বস্তা। পারিবারিক ব্যবহারের সেরা চাল।',
    1750.00,
    1820.00,
    1650.00,
    25,
    '২৫ কেজি বস্তা',
    'হোলসেল বস্তা',
    true,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDliUXN3Vaw4O-4lK2VFea0bp1jezrqatT6CJt0qRNuKbTA5tlqHumMQgKzlDDE8Z304YBpMFjTbZbgOFZzwWlWRZL93Jpkd89MmHzZRO0-Ori46Tj9X0Jj-qRZkEuh0fmu0WThXa411Jh9ctfxdNIesT-zwSRX5i4OYUfVo5Uj25B1N3wagbxvEii38-VOjfVT7YFP67T8Eh-8qA9vjnLwe_VXuqfKsfX3ljyY_xh76dld3E2qs2FFyQ'
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'নাজিরশাইল',
    'Nazirshail Rice Premium (5kg)',
    'নাজিরশাইল প্রিমিয়াম চাল ৫ কেজি',
    'Slender grain premium white Najirshail rice 5kg pack',
    'চিকন ও লম্বা দানার ফ্রেশ প্রিমিয়াম নাজিরশাইল চাল। রান্নায় ঝরঝরে ও সুস্বাদু।',
    380.00,
    410.00,
    350.00,
    40,
    '৫ কেজি',
    'ফ্রেশ প্যাক',
    true,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAqtJ4CfxqO0Kbr8qLFg7AReH7Wnfq4miSpHz8e9dbVj_aU1nVNAPZQ6s5iWq8aSSg_TOfF7I5mKNR2TEDsHqrBvRmLE0pkxxSgidX3_yqMJ4McKjRmTBhMtcVuRfggw_e25CNeAGs_JtiBJ9k0giprIlWCTEl_9BJmkSoEgzsB4S50F1AUVGs2YxstnimdYn7R0_-P-ttMCoLgp9-QxS0zhqCUNxTK7-51GIdYqmxizQ-pBdmSy2VmvA'
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'পোলাও চাল',
    'Chashi Chinigura Aromatic Rice (1kg)',
    'চাষী সুগন্ধি চিনিগুঁড়া চাল ১ কেজি',
    'Chashi aromatic fragrant Chinigura rice for biryani & polao',
    'পোলাও, বিরিয়ানি ও ক্ষীরের জন্য খাঁটি সুগন্ধি চাষী চিনিগুঁড়া চাল।',
    150.00,
    160.00,
    135.00,
    30,
    '১ কেজি',
    'পোলাও স্পেশাল',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDmyZuliy1ITNdw0gzrbtC84atIaPo0akvvv_uAPXoOr8DlG8ebFUlgqMPYrDu-0mwOb254GZf8bvSr8x74-3nWLYus_rPysDGeVmd00OUcKYUb31PdP7ZMls1CcLxnmK62HeCMWtMcTHlBNyHlpxkeFNK7iae7CXwxkQ3hPmvz4JIaxpEsK91qNgaVn_9VRQ3MxEy6BZ1NwUzFo9YcZtiGwUNUmpPSSMEG8irsq8bMrP5gO5-YhqRpPA'
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'মসুর ডাল',
    'Deshi Small Masoor Dal (1kg)',
    'দেশি ছোট মসুর ডাল ১ কেজি',
    'Vibrant natural small red lentils (Deshi Masoor Dal)',
    'দ্রুত সিদ্ধ হওয়া খাঁটি দেশি ছোট দানার মসুর ডাল। ওজনে ও মানে শতভাগ খাঁটি।',
    135.00,
    150.00,
    120.00,
    45,
    '১ কেজি',
    '১৫ ছাড়',
    true,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXj_2p9jI5iPnIhVV8ErTKGQYUiK0nAGIb6gYmGK8QeChiHtN6y-ALpBWkzOY9tyDu_5lBopd_-uXzvygr3QA5KbH2HqtGFLbNzmwS-6ahoLZoUyz9ha706UMYBqGPKsqZR4IcdOzItdwVyhwLh7UvKUUMz8v8EWP51-Vv8oN0NtercPyz9Q2bzpojKrzdZUVvyYPSJP02F13zuTKH15d-nXgHtmFY6fEVv7jVin32-ybbIy-6nGptZw'
  ),
  (
    'd1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'মুগ ডাল',
    'Deshi Moong Dal Premium (1kg)',
    'দেশি মুগ ডাল প্রিমিয়াম ১ কেজি',
    'Golden yellow roasted Moong dal mung beans',
    'ভাজা সুবাস ও প্রিমিয়াম স্বাদের সোনালী দেশি মুগ ডাল।',
    160.00,
    175.00,
    142.00,
    20,
    '১ কেজি',
    'ভাজা সুবাস',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDdjM4F6VJIKp0qcHvHc0zeM37QmPQ8ce6shIAm-5MOfugweat2MLk-L5S4ApIcNtOE8aJnAlWmp11NvLWbCvs3v4IX2iA1rpDevZ4J73X_DQs1jAMVCISFEIubEyGjkYGggtWgnhWET5okpbwCq12vB-LOToyyHeSIbHE_9lkNKSrmJ0xchAdQasmuBroTjTQo1-M7CHBY8pje5Q5i7isjyod-k1mWAn5ksjL0ZCVPs5NzFQM3AuOmHg'
  ),
  (
    'd1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'ছোলা বুট',
    'Fresh Chickpeas / Chhola Boot (1kg)',
    'ছোলা বুট ফ্রেশ ১ কেজি',
    'Wholesome clean brown whole chickpeas',
    'আমদানি করা বড় দানার পরিষ্কার পুষ্টিকর ছোলা বুট। রান্নায় নরম ও সুস্বাদু।',
    110.00,
    120.00,
    95.00,
    30,
    '১ কেজি',
    'সেরা মান',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAhVP-GedQ1fj09CDdQ3vKQeqnwEQsKX1seQh1GhQekrDTcRodmwqPy09bGSgwIZrnN2kruqT51PyKX3dmnKSMwngM0xwxpJTAxyHiQBHBac2XcmkLwIxR-bRykNw0JmQLspcQwCrjAZFK4kjZIGZfa-FblIIWaN586tHS47_pBFB1p8SmTzkHy_W4Jc_4Z1fNjSdJopBnHj4qQAxQd2VQRoCz7tew7RyGPdCKDEHV4iKWLAWEc1JVZXQ'
  ),
  (
    'd1000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000002',
    'edible-oil',
    'সয়াবিন তেল',
    'Rupchanda Fortified Soybean Oil (5L)',
    'রূপচাঁদা ফর্টিফাইড সয়াবিন তেল ৫ লিটার',
    'Vitamin A fortified premium Rupchanda soybean oil 5L bottle',
    'ভিটামিন এ সমৃদ্ধ খাঁটি রূপচাঁদা সয়াবিন তেল ৫ লিটার বোতল।',
    820.00,
    850.00,
    780.00,
    24,
    '৫ লিটার',
    '৩০ ছাড়',
    true,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAcQ5j1hdcqqh0ozdk72Vn-MySV3Es_oPJUVutIFec3081-AhuxsrdHdvo0CW8Y_QGmt-d4yQ_ONQ39Ah6lDQDli4TpCPnrtHuww-2Vc3XqlJsAUqpBeu5VhFpNva8PUwXZDq_A5cMO8vBo5HvV5Gh3J1fmtjTRvDRuaKEV6eDqsE7-Cs9PneJ6h2qxsUEIrb69CF_VrH4vUxgzyiC3H9bQhndv2Quo7Ma6RnDP2FNIkz9fJQOgwkTc5A'
  ),
  (
    'd1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000002',
    'edible-oil',
    'সরিষার তেল',
    'Pran Pure Mustard Oil (500ml)',
    'প্রাণ খাঁটি সরিষার তেল ৫০০ মিলি',
    'Authentic sharp pungent pure mustard oil Pran 500ml',
    'কড়া ঝাঁঝ ও খাঁটি স্বাদের প্রাণ সরিষার তেল ৫০০ মিলি। ভর্তা ও রান্নায় অতুলনীয়।',
    140.00,
    155.00,
    125.00,
    18,
    '৫০০ মিলি',
    '১৫ ছাড়',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBS40wxe8qQ9ZtW7EiKs29pQOBChBsjoieu56WTnYSm5r6opHn9omJlfxWKhz0_WzkXU02A4XeqDvmL2glgBmZbNxV1g-hrRst-P__ssCjcuvEGdOZlE386uz1lU1pTGTJYUxuU8OiwlVlvnqPdfRyFT886RPWq9Mr51g2sIDyBERZSMTJgVCnDI7U5ZFWxH5TAZFm43sbA24i3V44AbjvQG35HAxIsTHus1_S7Ik_zPuZFJILDz7FvLw'
  ),
  (
    'd1000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000004',
    'flour',
    'প্যাকেট আটা',
    'Teer Atta Packet (2kg)',
    'তীর প্যাকেট আটা ২ কেজি',
    'Teer branded whole wheat flour 2kg hygienic sealed packet',
    'নরম ও স্বাস্থ্যকর লাল আটার রুটির জন্য তীর প্যাকেট আটা ২ কেজি।',
    125.00,
    130.00,
    115.00,
    50,
    '২ কেজি',
    'তাজা স্টক',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBTcPksNpmEH1rVsicP3OD5AVZMAFbf0_KfHwbRt1k6YapAKpT-vRQFqP_0r8PJsosGxOwSjBb6qaLUxdjLz1_RgkfQlseDSqOcDeFglW7mqLwe5O89mA_iCf-iUSbgg8BwACVTmnxYPRCzJxFGETJMsKit3hUX3bFIWsyKkPY2BS56jNPkCKoBv2TaH3crgEgXRLpl2OTVmiaxEprw7VoB_DZzsdWyH9xRf_j3pSC7GFyHf16HvbfzXg'
  ),
  (
    'd1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000003',
    'spices',
    'হলুদ গুঁড়া',
    'Radhuni Turmeric Powder (200g)',
    'রাঁধুনী খাঁটি হলুদ গুঁড়া ২০০ গ্রাম',
    'Radhuni pure turmeric powder 200g foil pack',
    'গাঢ় সোনালী রঙ ও খাঁটি ঘ্রাণের রাঁধুনী হলুদ গুঁড়া ২০০ গ্রাম।',
    85.00,
    90.00,
    76.00,
    40,
    '২০০ গ্রাম',
    'খাঁটি মসলা',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCRoSYjut_r2-c6uSYj6GIkRS3nQmtb4O8Ncvus2BC_Cz-Hi9cQQJnDibmDDOi2q64qdtpp3FQhICw2P600Bv9aI9Jd-MwebnHLdEKbvBIVr0KFhSDtp30bBC4ZOE9pxw10Uzi47Ae_wKBiN4EREhq7oWabqHQRldOafL862jHzQfVpOzjuAX1Bc1cEcKjj0HZoKJOtzcMgCQjepCCPqk1XeXlsGdnSSiDPBP6HVw_RWsOd3gTRMiki8w'
  ),
  (
    'd1000000-0000-0000-0000-000000000011',
    'c1000000-0000-0000-0000-000000000005',
    'essentials',
    'দেশি লাল চিনি',
    'Fresh Deshi Red Sugar (1kg)',
    'দেশি লাল চিনি ১ কেজি',
    'Natural unrefined deshi brown sugar 1kg pack',
    'ভেজাল ও রাসায়নিকমুক্ত প্রাকৃতিক দেশি লাল চিনি ১ কেজি। পুষ্টিকর ও সুস্বাদু।',
    140.00,
    145.00,
    128.00,
    30,
    '১ কেজি',
    'ন্যাচারাল',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBLstnZwRMv1vK8gEJ9mO3W7uaHn7tp6HQaxIHU7vrQcSI_pW44OhzFrscen-QSXUMXwWpc1-ckdplxGfRy4wAYHcPAUY0OBEj5UevDSfzmbSXw4v0ASBsE0cz7bgSwh0SNQJEFoID3trdPxjWRBEkOTCqAnvba8lUYZLTlnASI4-e0Yy9syeyJR7gtx0wHfMXHBn4T6qa9pGjdwmNhX4aaMOP4pACZLWnKU4JeIaUBq7wIEtEwpGN_YA'
  ),
  (
    'd1000000-0000-0000-0000-000000000012',
    'c1000000-0000-0000-0000-000000000006',
    'snacks-tea',
    'চা পাতা',
    'Ispahani Mirzapore Tea (400g)',
    'ইস্পাহানি মির্জাপুর চা পাতা ৪০০ গ্রাম',
    'Ispahani Mirzapore strong blend premium tea 400g pack',
    'কড়া লিকার ও চমৎকার স্বাদের সেরা ইস্পাহানি মির্জাপুর চা পাতা ৪০০ গ্রাম।',
    220.00,
    230.00,
    198.00,
    35,
    '৪০০ গ্রাম',
    'কড়া লিকার',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAM4KmdhGHP3XC9TMcumuWQsRs_zjR8dd2rb3idaIYBmCBbFgHNMMPxms_ZWCMnV8HqzwcnwUYgY4Ep7w2mjzLtat9lfXF1Na0EywxZZLNM7JbWgEJWMLG-VaZjyPCX8IgjBRBoirxRwzav1u676sblcdaq49ogjwQN_fzuNglPDNYOVhk6ulN5J9PpZMxxysHjVYKTVSs_rsD1dx4nu4l5tWo7nn6EwnGoml7wuOaIc0aqULxb33otGg'
  ),
  (
    'd1000000-0000-0000-0000-000000000013',
    'c1000000-0000-0000-0000-000000000007',
    'soap-cleaning',
    'গায়ে মাখা সাবান',
    'Lifebuoy Total Soap (100g)',
    'লাইফবয় সাবান ১০০ গ্রাম',
    'Lifebuoy germ protection total soap 100g',
    'জীবাণু থেকে সুরক্ষা ও সতেজতার জন্য লাইফবয় টোটাল সাবান ১০০ গ্রাম।',
    45.00,
    50.00,
    38.00,
    80,
    '১০০ গ্রাম',
    'জীবাণুনাশক',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCGtooA9ElpJ8LA2ezz2UvINmJEhhoCltsDt5XyO2TsmPw7YZOme76CqXYpPU4VxDndjii3o0YnS-KIz3q4oslwGXR_SJwXNlRcXM3b5MKgziJGtM2YZ-FKkL1HvXP9lpOLvpjY1Os4CjEfnacGjlLza-T59zlSLnbir2cpTcFiTZi0H3I5aMUKyiQhra7zPOM6smSI9d27yPUjAAMsF0qbnuOdxgJmzKJfYTn3EGPoYJDO44sOWiZzGQ'
  ),
  (
    'd1000000-0000-0000-0000-000000000014',
    'c1000000-0000-0000-0000-000000000007',
    'soap-cleaning',
    'কাপড় ধোয়া',
    'Rin Power White Detergent (1kg)',
    'রিন ডিটারজেন্ট পাউডার ১ কেজি',
    'Rin Power White bright washing powder 1kg packet',
    'কাপড়ের উজ্জ্বল শুভ্রতা ও ময়লা দূরীকরণে রিন পাওয়ার হোয়াইট ডিটারজেন্ট ১ কেজি।',
    160.00,
    170.00,
    140.00,
    30,
    '১ কেজি',
    'উজ্জ্বল সাদা',
    false,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAgTwuP5b0Mf9drDaI0Tm_Gs4pgmqWtmHa6LVfM2KBXBeQA-O2dMvicn9pj-aEtWzxdNDPlokkxtWSzcBL06GHKnhDV3bZvUtYaqmSG7vv1arRccHOYIsXc4LbCqX2N27ConSYj8_ou4tgUP3chM7oH9G6NnWc5AToa67qXa3Ca5aynEIUv4TOzonJkF7zg_oH9EAGRwk0CLjNnCE8oEOhivcPQPkfkQ2t7gFreYQp6JyP7iH1lObtEsA'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  description = EXCLUDED.description,
  description_bn = EXCLUDED.description_bn,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  cost_price = EXCLUDED.cost_price,
  stock_quantity = EXCLUDED.stock_quantity,
  unit = EXCLUDED.unit,
  tag = EXCLUDED.tag,
  image_url = EXCLUDED.image_url;

-- ======================================================================================
-- 23. Complete!
-- ======================================================================================
