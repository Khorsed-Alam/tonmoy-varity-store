-- Tonmoy Varity Store: Supabase PostgreSQL Schema & Security Policies
-- Safe to run in Supabase SQL Editor or as a migration

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (order matters due to foreign keys)
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.shop_settings CASCADE;

-- 3. Create Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT DEFAULT '',
  description_bn TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price >= price),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'কেজি',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  shipping_address TEXT NOT NULL DEFAULT '',
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('home_delivery', 'store_pickup')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'pay_at_store', 'bkash', 'nagad')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Create Shop Settings table
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'Tonmoy Varity Store',
  store_name_bn TEXT NOT NULL DEFAULT 'তন্ময় ভ্যারাইটি স্টোর',
  phone TEXT NOT NULL DEFAULT '+880 1712-345678',
  address TEXT NOT NULL DEFAULT 'ঢাকা, বাংলাদেশ',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 50,
  free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 500,
  open_hours TEXT NOT NULL DEFAULT 'শনি – বৃহস্পতিবার: সকাল ৮টা – রাত ১০টা',
  home_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  store_pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  pay_at_store_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Automatic Updated At Timestamp Function & Triggers
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

-- 10. Automatically Create Profile on User Sign Up
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. Helper Function: Check if the currently authenticated user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 12. RPC Function: Server-side Stock Decrement
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- 14. Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile (non-role) or admins update all" ON public.profiles;
CREATE POLICY "Users can update own profile (non-role) or admins update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    -- If user is updating their own profile and is not admin, role must not change
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- 15. Categories RLS Policies
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

-- 16. Products RLS Policies
DROP POLICY IF EXISTS "Anyone can view active products or admins view all" ON public.products;
CREATE POLICY "Anyone can view active products or admins view all"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- 17. Orders RLS Policies
DROP POLICY IF EXISTS "Users can view own orders or admins view all" ON public.orders;
CREATE POLICY "Users can view own orders or admins view all"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or service role can insert orders" ON public.orders;
CREATE POLICY "Authenticated users or service role can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- 18. Order Items RLS Policies
DROP POLICY IF EXISTS "Users can view items of own orders or admins view all" ON public.order_items;
CREATE POLICY "Users can view items of own orders or admins view all"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users or service role can insert order items" ON public.order_items;
CREATE POLICY "Users or service role can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 19. Shop Settings RLS Policies
DROP POLICY IF EXISTS "Anyone can read shop settings" ON public.shop_settings;
CREATE POLICY "Anyone can read shop settings"
  ON public.shop_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update shop settings" ON public.shop_settings;
CREATE POLICY "Admins can update shop settings"
  ON public.shop_settings FOR ALL
  USING (public.is_admin());

-- 20. Supabase Storage Bucket Setup for Product Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

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
