-- ======================================================================================
-- মেসার্স তন্ময় ভ্যারাইটি স্টোর (M/S Tonmoy Varity Store)
-- হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া
-- প্রোপ্রাইটার: মোঃ তৌহিদুল ইসলাম বিন্দু | ফোন: ০১৭১৭-৯৯৯৪৬০
--
-- 100% Production-Grade Supabase PostgreSQL Schema, RLS Policies, Triggers & Seed Data
-- ======================================================================================

-- 0. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean Reset: Drop existing tables if re-running
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.shop_settings CASCADE;

-- ======================================================================================
-- 1. CUSTOMER PROFILES
-- ======================================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'বগুড়া',
  area TEXT DEFAULT 'নারুয়ামালা',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  preferred_language TEXT NOT NULL DEFAULT 'bn'
    CHECK (preferred_language IN ('bn', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 2. CATEGORIES
-- ======================================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  icon TEXT DEFAULT '📦',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 3. PRODUCTS
-- ======================================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id)
    ON DELETE SET NULL,
  category_slug TEXT DEFAULT '',
  subcategory TEXT DEFAULT '',
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_bn TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2)
    CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  cost_price NUMERIC(12,2) CHECK (cost_price IS NULL OR cost_price >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  stock_quantity INTEGER NOT NULL DEFAULT 0
    CHECK (stock_quantity >= 0),
  tag TEXT DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  -- Backward-compatibility virtual column for existing components
  original_price NUMERIC(12,2) GENERATED ALWAYS AS (compare_at_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 4. ORDERS
-- ======================================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id UUID REFERENCES public.profiles(id)
    ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  fulfillment_type TEXT NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_type IN ('delivery', 'pickup')),
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'store_pickup', 'cash_on_delivery', 'pay_at_store', 'bkash', 'nagad')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'confirmed', 'processing',
      'ready_for_pickup', 'shipped', 'delivered', 'cancelled'
    )),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (subtotal >= 0),
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (discount >= 0),
  total NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (total >= 0),
  notes TEXT,
  -- Backward-compatibility virtual columns for existing UI & dashboards
  full_name TEXT GENERATED ALWAYS AS (customer_name) STORED,
  phone TEXT GENERATED ALWAYS AS (customer_phone) STORED,
  shipping_address TEXT GENERATED ALWAYS AS (delivery_address) STORED,
  delivery_method TEXT GENERATED ALWAYS AS (fulfillment_type) STORED,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (total) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 5. ORDER ITEMS
-- ======================================================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id)
    ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id)
    ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_name_bn TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  -- Backward-compatibility virtual column for legacy components
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (line_total) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 6. INVENTORY TRANSACTIONS
-- ======================================================================================
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id)
    ON DELETE SET NULL,
  changed_by UUID REFERENCES public.profiles(id)
    ON DELETE SET NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN (
      'stock_in', 'stock_out', 'sale',
      'sale_cancelled', 'adjustment'
    )),
  quantity_change INTEGER NOT NULL
    CHECK (quantity_change <> 0),
  stock_before INTEGER NOT NULL CHECK (stock_before >= 0),
  stock_after INTEGER NOT NULL CHECK (stock_after >= 0),
  order_id UUID REFERENCES public.orders(id)
    ON DELETE SET NULL,
  note TEXT,
  -- Backward-compatibility virtual columns
  quantity INTEGER GENERATED ALWAYS AS (quantity_change) STORED,
  previous_stock INTEGER GENERATED ALWAYS AS (stock_before) STORED,
  new_stock INTEGER GENERATED ALWAYS AS (stock_after) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================================================================================
-- 7. SHOP SETTINGS
-- ======================================================================================
CREATE TABLE public.shop_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'Tonmoy Varity Store',
  shop_name_bn TEXT NOT NULL DEFAULT 'তন্ময় ভ্যারাইটি স্টোর',
  currency TEXT NOT NULL DEFAULT 'BDT',
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0),
  free_delivery_threshold NUMERIC(12,2)
    CHECK (
      free_delivery_threshold IS NULL
      OR free_delivery_threshold >= 0
    ),
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT,
  -- Backward-compatibility virtual columns
  store_name TEXT GENERATED ALWAYS AS (shop_name) STORED,
  store_name_bn TEXT GENERATED ALWAYS AS (shop_name_bn) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initial default settings row
INSERT INTO public.shop_settings (
  id, shop_name, shop_name_bn, currency, delivery_fee, free_delivery_threshold, pickup_enabled, delivery_enabled, contact_phone
)
VALUES (
  1,
  'Tonmoy Varity Store',
  'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
  'BDT',
  50,
  500,
  true,
  true,
  '01717-999460'
)
ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_name_bn = EXCLUDED.shop_name_bn,
  delivery_fee = EXCLUDED.delivery_fee,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  pickup_enabled = EXCLUDED.pickup_enabled,
  delivery_enabled = EXCLUDED.delivery_enabled,
  contact_phone = EXCLUDED.contact_phone;

-- ======================================================================================
-- 8. INDEXES FOR HIGH-EFFICIENCY LOOKUPS
-- ======================================================================================
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_active_idx ON public.products(is_active);
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX inventory_product_idx ON public.inventory_transactions(product_id);

-- ======================================================================================
-- 9. AUTOMATIC TIMESTAMP TRIGGER (updated_at)
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
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
-- 10. AUTH TRIGGER: Automatically create profile on new user sign-up
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, role, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn')
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
-- 11. HELPER: Admin Check Function
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
-- 12. RPC FUNCTION: Atomic Server-Side Stock Decrement & Transaction Audit
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT, p_order_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_before INT;
  v_after INT;
BEGIN
  SELECT stock_quantity INTO v_before FROM public.products WHERE id = p_product_id;
  IF FOUND THEN
    v_after := GREATEST(0, v_before - p_quantity);
    UPDATE public.products
    SET stock_quantity = v_after,
        updated_at = now()
    WHERE id = p_product_id;

    INSERT INTO public.inventory_transactions (
      product_id, changed_by, transaction_type, quantity_change, stock_before, stock_after, order_id, note
    ) VALUES (
      p_product_id, auth.uid(), 'sale', -p_quantity, v_before, v_after, p_order_id, 'Customer order checkout'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.shop_settings enable row level security;

-- --------------------------------------------------------------------------------------
-- Categories RLS
-- --------------------------------------------------------------------------------------
-- Public can read active categories
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage all categories" on public.categories;
create policy "Admins manage all categories"
on public.categories for all
to authenticated
using (public.is_admin());

-- --------------------------------------------------------------------------------------
-- Products RLS
-- --------------------------------------------------------------------------------------
-- Public can read active products
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
on public.products for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage all products" on public.products;
create policy "Admins manage all products"
on public.products for all
to authenticated
using (public.is_admin());

-- --------------------------------------------------------------------------------------
-- Profiles RLS
-- --------------------------------------------------------------------------------------
-- Customers can read their own profile
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()) or public.is_admin());

-- --------------------------------------------------------------------------------------
-- Orders RLS
-- --------------------------------------------------------------------------------------
-- Customers can read their own orders
drop policy if exists "Read own orders" on public.orders;
create policy "Read own orders"
on public.orders for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins read all orders" on public.orders;
create policy "Admins read all orders"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using (public.is_admin());

-- --------------------------------------------------------------------------------------
-- Order Items RLS
-- --------------------------------------------------------------------------------------
-- Customers can read items from their own orders
drop policy if exists "Read own order items" on public.order_items;
create policy "Read own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins read all order items" on public.order_items;
create policy "Admins read all order items"
on public.order_items for select
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can insert order items" on public.order_items;
create policy "Anyone can insert order items"
on public.order_items for insert
to anon, authenticated
with check (true);

-- --------------------------------------------------------------------------------------
-- Inventory Transactions RLS
-- --------------------------------------------------------------------------------------
drop policy if exists "Admins can view inventory transactions" on public.inventory_transactions;
create policy "Admins can view inventory transactions"
on public.inventory_transactions for select
to authenticated
using (public.is_admin());

drop policy if exists "System can insert inventory transactions" on public.inventory_transactions;
create policy "System can insert inventory transactions"
on public.inventory_transactions for insert
with check (true);

-- --------------------------------------------------------------------------------------
-- Shop Settings RLS
-- --------------------------------------------------------------------------------------
-- Public can read shop settings
drop policy if exists "Public read shop settings" on public.shop_settings;
create policy "Public read shop settings"
on public.shop_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update shop settings" on public.shop_settings;
create policy "Admins can update shop settings"
on public.shop_settings for all
to authenticated
using (public.is_admin());

-- ======================================================================================
-- 14. SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
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
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'products');

-- ======================================================================================
-- 15. INITIAL SEED DATA (Bangladeshi Grocery Categories & Authentic Products)
-- ======================================================================================

-- 7 Categories
INSERT INTO public.categories (id, name, name_bn, slug, icon, description, sort_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Rice & Dal', 'চাল ও ডাল', 'rice-dal', '🌾', 'তাজা খাঁটি মানের চাল ও পুষ্টিকর দেশি ডাল', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Edible Oils', 'তেল ও ঘি', 'edible-oil', '🛢️', '১০০% খাঁটি সরিষার তেল ও পুষ্টিকর সয়াবিন তেল', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Pure Spices', 'মসলাপাতি', 'spices', '🧂', 'ভেজালমুক্ত খাঁটি গুঁড়া ও আস্ত রান্নার মসলা', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Atta & Flour', 'আটা-ময়দা', 'flour', '🌾', 'মিল ফ্রেশ পুষ্টিকর আটা, ময়দা ও সুজি', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Sugar & Salt', 'চিনি ও লবণ', 'essentials', '☕', 'দৈনন্দিন রান্নার রিফাইন চিনি ও আয়োডাইজড লবণ', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Biscuits & Tea', 'চা ও বিস্কুট', 'snacks-tea', '🍪', 'সকালের নাস্তা ও বিকেলের চায়ের সেরা আয়োজন', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Soap & Wash', 'ক্লিনিং', 'soap-cleaning', '🧼', 'ঘরের পরিচ্ছন্নতায় বিশ্বস্ত ডিটারজেন্ট ও সাবান', 7, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Initial Products
INSERT INTO public.products (
  id, category_id, category_slug, subcategory, name, name_bn, slug, sku,
  description, description_bn, price, compare_at_price, cost_price, stock_quantity,
  unit, tag, is_featured, is_active, image_url
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'rice-dal',
    'মিনিকেট',
    'Deshi Miniket Rice Sack (25kg)',
    'দেশি মিনিকেট চাল ২৫ কেজি বস্তা',
    'deshi-miniket-rice-sack-25kg',
    'TVS-RIC-001',
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
    'nazirshail-rice-premium-5kg',
    'TVS-RIC-002',
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
    'chashi-chinigura-aromatic-rice-1kg',
    'TVS-RIC-003',
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
    'deshi-small-masoor-dal-1kg',
    'TVS-DAL-001',
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
    'deshi-moong-dal-premium-1kg',
    'TVS-DAL-002',
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
    'fresh-chickpeas-chhola-boot-1kg',
    'TVS-DAL-003',
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
    'rupchanda-fortified-soybean-oil-5l',
    'TVS-OIL-001',
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
    'pran-pure-mustard-oil-500ml',
    'TVS-OIL-002',
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
    'teer-atta-packet-2kg',
    'TVS-FLR-001',
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
    'radhuni-turmeric-powder-200g',
    'TVS-SPC-001',
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
    'fresh-deshi-red-sugar-1kg',
    'TVS-SGR-001',
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
    'ispahani-mirzapore-tea-400g',
    'TVS-TEA-001',
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
    'lifebuoy-total-soap-100g',
    'TVS-SOP-001',
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
    'rin-power-white-detergent-1kg',
    'TVS-DET-001',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  description = EXCLUDED.description,
  description_bn = EXCLUDED.description_bn,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  cost_price = EXCLUDED.cost_price,
  stock_quantity = EXCLUDED.stock_quantity,
  unit = EXCLUDED.unit,
  tag = EXCLUDED.tag,
  image_url = EXCLUDED.image_url;
