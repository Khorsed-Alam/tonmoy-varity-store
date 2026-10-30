-- ====================================================================================
-- TONMOY VARIETY STORE - COMPLETE CLEAN REBUILD & SEED SCRIPT
-- (চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর - সম্পূর্ণ ক্লিন রিবিল্ড ও সিড স্ক্রিপ্ট)
-- Run this script in: Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)
-- WARNING: This script drops and recreates tables with exact schema, RLS, categories & seed products.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. EXTENSIONS & SAFE TABLE CLEANUP (DROP OLD TABLES)
-- ------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.shop_settings CASCADE;

-- ------------------------------------------------------------------------------------
-- 2. FRESH TABLE DEFINITIONS
-- ------------------------------------------------------------------------------------
-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  full_name_bn TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  address TEXT,
  area TEXT DEFAULT 'নারুয়ামালা',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CATEGORIES TABLE (3-Tier Standardized Hierarchy)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  icon_name TEXT,
  description TEXT,
  description_bn TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  subcategory TEXT,
  child_subcategory TEXT,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  cost_price NUMERIC,
  stock_quantity INTEGER NOT NULL DEFAULT 50,
  unit TEXT NOT NULL DEFAULT '১ কেজি',
  tag TEXT,
  image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT,
  customer_name TEXT,
  phone TEXT,
  customer_phone TEXT,
  alternate_phone TEXT DEFAULT '',
  shipping_address TEXT,
  customer_address TEXT,
  delivery_address TEXT,
  area TEXT DEFAULT 'নারুয়ামালা হাট, বগুড়া',
  delivery_method TEXT NOT NULL DEFAULT 'home_delivery',
  fulfillment_type TEXT DEFAULT 'delivery',
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_name_bn TEXT NOT NULL DEFAULT '',
  unit TEXT DEFAULT 'পিস',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVENTORY TRANSACTIONS TABLE
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CART ITEMS TABLE
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SHOP SETTINGS TABLE
CREATE TABLE public.shop_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'Tonmoy Variety Store',
  shop_name_bn TEXT NOT NULL DEFAULT 'চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর',
  currency TEXT NOT NULL DEFAULT 'BDT',
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 50 CHECK (delivery_fee >= 0),
  free_delivery_threshold NUMERIC(12,2) DEFAULT 500,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT DEFAULT '01717-999460',
  address TEXT DEFAULT 'নারুয়ামালা হাট, গাবতলী, বগুড়া',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BANNERS & OFFERS TABLE
CREATE TABLE public.banners (
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

-- Seed Default Banners (Official Store, Friday Special, Eid Special)
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
) ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  subtitle_bn = EXCLUDED.subtitle_bn,
  badge_text_bn = EXCLUDED.badge_text_bn,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  button_text_bn = EXCLUDED.button_text_bn,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Default Shop Settings Row
INSERT INTO public.shop_settings (
  id, shop_name, shop_name_bn, currency, delivery_fee, free_delivery_threshold, pickup_enabled, delivery_enabled, contact_phone, address
) VALUES (
  1, 'Tonmoy Variety Store', 'চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর', 'BDT', 50, 500, true, true, '01717-999460', 'নারুয়ামালা হাট, গাবতলী, বগুড়া'
) ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_name_bn = EXCLUDED.shop_name_bn;

-- INDEXES
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_level ON public.categories(level);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_products_cat_slug ON public.products(category_slug);
CREATE INDEX idx_products_subcat ON public.products(subcategory);
CREATE INDEX idx_products_tag ON public.products(tag);
CREATE INDEX idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_num ON public.orders(order_number);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ------------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) OPEN POLICIES (NO 42501 BLOCKING)
-- ------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all categories" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all order items" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all inventory" ON public.inventory_transactions FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all cart" ON public.cart_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all shop_settings" ON public.shop_settings FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all banners" ON public.banners FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------------
-- 4. HELPER & RPC FUNCTIONS
-- ------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT, p_order_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_current_stock INT;
BEGIN
  SELECT stock_quantity INTO v_current_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  UPDATE public.products SET stock_quantity = GREATEST(0, stock_quantity - p_quantity), updated_at = now() WHERE id = p_product_id;
  INSERT INTO public.inventory_transactions (product_id, order_id, type, quantity, previous_stock, new_stock, notes)
  VALUES (p_product_id, p_order_id, 'out', p_quantity, v_current_stock, GREATEST(0, v_current_stock - p_quantity), 'অর্ডার বিক্রয় স্টক হ্রাস');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_order_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.customer_name IS NULL THEN
    NEW.customer_name := NEW.full_name;
  ELSIF NEW.customer_name IS NOT NULL AND NEW.full_name IS NULL THEN
    NEW.full_name := NEW.customer_name;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.customer_phone IS NULL THEN
    NEW.customer_phone := NEW.phone;
  ELSIF NEW.customer_phone IS NOT NULL AND NEW.phone IS NULL THEN
    NEW.phone := NEW.customer_phone;
  END IF;

  IF NEW.shipping_address IS NOT NULL THEN
    NEW.customer_address := COALESCE(NEW.customer_address, NEW.shipping_address);
    NEW.delivery_address := COALESCE(NEW.delivery_address, NEW.shipping_address);
  ELSIF NEW.customer_address IS NOT NULL THEN
    NEW.shipping_address := NEW.customer_address;
    NEW.delivery_address := COALESCE(NEW.delivery_address, NEW.customer_address);
  END IF;

  IF NEW.status IS NOT NULL THEN
    NEW.order_status := NEW.status;
  ELSIF NEW.order_status IS NOT NULL THEN
    NEW.status := NEW.order_status;
  END IF;

  IF NEW.total_amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total := NEW.total_amount;
  ELSIF NEW.total IS NOT NULL AND (NEW.total_amount IS NULL OR NEW.total_amount = 0) THEN
    NEW.total_amount := NEW.total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_order_columns ON public.orders;
CREATE TRIGGER tr_sync_order_columns
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_columns();

-- ------------------------------------------------------------------------------------
-- 5. SEED: LEVEL 1 (7 MAIN CATEGORIES)
-- ------------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'দুধ ও ডিম', 'dairy-eggs', '🥛', 'egg_alt', 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম', 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম', 1, 1, true, '["দুধ","দই","মাখন ও ঘি","পনির ও চিজ","ক্রিম","ডিম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000002', 'Cooking Essentials', 'রান্নার সামগ্রী', 'cooking-essentials', '🌾', 'restaurant', 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি', 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি', 1, 2, true, '["চাল","ডাল ও ডালজাতীয়","আটা ও ময়দা","ভোজ্য তেল","লবণ ও চিনি","মসলাপাতি","সস ও আচার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000003', 'Snacks & Beverages', 'নাস্তা ও পানীয়', 'snacks-beverages', '🍪', 'fastfood', 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়', 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়', 1, 3, true, '["চিপস ও চানাচুর","বিস্কুট ও কুকিজ","চকলেট ও ক্যান্ডি","চা ও কফি","জুস ও পানীয়","কোমল পানীয়","খাবার পানি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000004', 'Baby Care', 'শিশুর যত্ন', 'baby-care', '👶', 'child_care', 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন', 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন', 1, 4, true, '["ডায়াপার","বেবি ওয়াইপস","শিশুর খাবার ও ফর্মুলা","শিশুর গোসল ও ত্বক","শিশুর অনুষঙ্গ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000005', 'Beauty & Personal Care', 'সৌন্দর্য ও ব্যক্তিগত যত্ন', 'beauty-personal-care', '💄', 'face', 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন', 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন', 1, 5, true, '["ত্বকের যত্ন","চুলের যত্ন","মুখের যত্ন","গোসল ও শরীর","শেভিং ও গ্রুমিং","সুগন্ধি ও ডিওডোরেন্ট","নারীর ব্যক্তিগত যত্ন"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000006', 'Cleaning & Household', 'ক্লিনিং ও গৃহস্থালি', 'cleaning-household', '🧹', 'cleaning_services', 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ', 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ', 1, 6, true, '["বাসন মাজার সামগ্রী","লন্ড্রি ও কাপড় ধোয়া","টয়লেট ক্লিনার","ন্যাপকিন ও পেপার সামগ্রী","মশা ও কীটনাশক","মেঝে ও গ্লাস ক্লিনার","পরিষ্কারের সরঞ্জাম","এয়ার ফ্রেশনার","ডিসপোজেবল ও ট্র্যাশ ব্যাগ","জুতার যত্ন","ডাস্টবিন ও ঝুড়ি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)
VALUES ('c1000000-0000-0000-0000-000000000007', 'Stationery & Lifestyle', 'স্টেশনারি ও লাইফস্টাইল', 'stationery-lifestyle', '✏️', 'menu_book', 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি', 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি', 1, 7, true, '["কলম ও লেখার সামগ্রী","খাতা ও কাগজ","অফিস সামগ্রী","আর্ট ও ক্রাফট","পার্টি সামগ্রী"]'::jsonb);

-- ------------------------------------------------------------------------------------
-- 6. SEED: LEVEL 2 (48 SUBCATEGORIES)
-- ------------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0001-0000-000000000000', 'Milk', 'দুধ', 'dairy-eggs-milk', '🥛', 'egg_alt', 'Milk - Dairy & Eggs', 'দুধ - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 1, true, '["ফুল ক্রিম দুধ","লো-ফ্যাট দুধ","ইউএইচটি দুধ","গুঁড়ো দুধ","ফ্লেভার্ড মিল্ক","কনডেন্সড মিল্ক"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0002-0000-000000000000', 'Yogurt', 'দই', 'dairy-eggs-yogurt', '🥛', 'egg_alt', 'Yogurt - Dairy & Eggs', 'দই - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 2, true, '["টক দই","মিষ্টি দই","গ্রিক ইয়োগার্ট","ফ্লেভার্ড দই"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0003-0000-000000000000', 'Butter & Ghee', 'মাখন ও ঘি', 'dairy-eggs-butter-ghee', '🥛', 'egg_alt', 'Butter & Ghee - Dairy & Eggs', 'মাখন ও ঘি - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 3, true, '["সল্টেড বাটার","আনসল্টেড বাটার","গাওয়া ঘি","খাঁটি ঘি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0004-0000-000000000000', 'Cheese', 'পনির ও চিজ', 'dairy-eggs-cheese', '🥛', 'egg_alt', 'Cheese - Dairy & Eggs', 'পনির ও চিজ - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 4, true, '["স্লাইসড চিজ","চিজ ব্লক","চিজ স্প্রেড","মোজারেলা চিজ","প্রসেসড চিজ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0005-0000-000000000000', 'Cream', 'ক্রিম', 'dairy-eggs-cream', '🥛', 'egg_alt', 'Cream - Dairy & Eggs', 'ক্রিম - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 5, true, '["ফ্রেশ ক্রিম","হুইপিং ক্রিম","কুকিং ক্রিম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0001-0006-0000-000000000000', 'Eggs', 'ডিম', 'dairy-eggs-eggs', '🥛', 'egg_alt', 'Eggs - Dairy & Eggs', 'ডিম - দুধ ও ডিম', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 6, true, '["মুরগির ডিম","হাঁসের ডিম","কোয়েলের ডিম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0001-0000-000000000000', 'Rice', 'চাল', 'cooking-essentials-rice', '🌾', 'restaurant', 'Rice - Cooking Essentials', 'চাল - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 1, true, '["মিনিকেট চাল","নাজিরশাইল চাল","বাসমতী চাল","ব্রাউন রাইস / লাল চাল","সিদ্ধ চাল","সুগন্ধি পোলাও চাল"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0002-0000-000000000000', 'Lentils & Pulses', 'ডাল ও ডালজাতীয়', 'cooking-essentials-lentils-pulses', '🌾', 'restaurant', 'Lentils & Pulses - Cooking Essentials', 'ডাল ও ডালজাতীয় - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 2, true, '["মসুর ডাল","মুগ ডাল","ছোলার ডাল","মাষকলাই ডাল","ছোলা বুট","মটর ডাল"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0003-0000-000000000000', 'Flour', 'আটা ও ময়দা', 'cooking-essentials-flour', '🌾', 'restaurant', 'Flour - Cooking Essentials', 'আটা ও ময়দা - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 3, true, '["আটা","ময়দা","লাল আটা","চালের গুঁড়া","বেসন","সুজি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0004-0000-000000000000', 'Cooking Oil', 'ভোজ্য তেল', 'cooking-essentials-cooking-oil', '🌾', 'restaurant', 'Cooking Oil - Cooking Essentials', 'ভোজ্য তেল - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 4, true, '["সয়াবিন তেল","সরিষার তেল","সূর্যমুখী তেল","অলিভ অয়েল","রাইস ব্রান তেল","নারকেল তেল"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0005-0000-000000000000', 'Salt & Sugar', 'লবণ ও চিনি', 'cooking-essentials-salt-sugar', '🌾', 'restaurant', 'Salt & Sugar - Cooking Essentials', 'লবণ ও চিনি - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 5, true, '["আয়োডিনযুক্ত লবণ","সৈন্ধব লবণ / বিট লবণ","সাদা চিনি","দেশি লাল চিনি","আইসিং সুগার","জিরো ক্যালরি সুগার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0006-0000-000000000000', 'Spices', 'মসলাপাতি', 'cooking-essentials-spices', '🌾', 'restaurant', 'Spices - Cooking Essentials', 'মসলাপাতি - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 6, true, '["হলুদ গুঁড়া","মরিচ গুঁড়া","ধনে গুঁড়া","জিরা","গরম মসলা","আস্ত মসলা","রেডি মসলা মিক্স"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0002-0007-0000-000000000000', 'Sauces & Condiments', 'সস ও আচার', 'cooking-essentials-sauces-condiments', '🌾', 'restaurant', 'Sauces & Condiments - Cooking Essentials', 'সস ও আচার - রান্নার সামগ্রী', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 2, 7, true, '["টমেটো সস","সয়া সস","মরিচ সস","মেয়োনিজ","সরিষার কাসুন্দি","ভিনেগার","আচার","চাটনি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0001-0000-000000000000', 'Chips & Savory Snacks', 'চিপস ও চানাচুর', 'snacks-beverages-chips-snacks', '🍪', 'fastfood', 'Chips & Savory Snacks - Snacks & Beverages', 'চিপস ও চানাচুর - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 1, true, '["আলু চিপস","কর্ন চিপস","চানাচুর","বাদাম ও বীজ","পপকর্ন","নোনতা ক্র্যাকার্স"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0002-0000-000000000000', 'Biscuits & Cookies', 'বিস্কুট ও কুকিজ', 'snacks-beverages-biscuits-cookies', '🍪', 'fastfood', 'Biscuits & Cookies - Snacks & Beverages', 'বিস্কুট ও কুকিজ - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 2, true, '["মিষ্টি বিস্কুট","নোনতা বিস্কুট","ক্রিম বিস্কুট","কুকিজ","ওয়েফার","টোস্ট ও ক্র্যাকার্স"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0003-0000-000000000000', 'Chocolates & Candy', 'চকলেট ও ক্যান্ডি', 'snacks-beverages-chocolates-candy', '🍪', 'fastfood', 'Chocolates & Candy - Snacks & Beverages', 'চকলেট ও ক্যান্ডি - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 3, true, '["চকলেট বার","বক্স চকলেট","টফি","ললিপপ","চুয়িংগাম","মিন্ট ক্যান্ডি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0004-0000-000000000000', 'Tea & Coffee', 'চা ও কফি', 'snacks-beverages-tea-coffee', '🍪', 'fastfood', 'Tea & Coffee - Snacks & Beverages', 'চা ও কফি - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 4, true, '["ব্ল্যাক টি / পাতা চা","গ্রিন টি","টি ব্যাগ","ইনস্ট্যান্ট কফি","গ্রাউন্ড কফি","কফি মিক্স","দুধ চা মিক্স"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0005-0000-000000000000', 'Juice', 'জুস ও পানীয়', 'snacks-beverages-juice', '🍪', 'fastfood', 'Juice - Snacks & Beverages', 'জুস ও পানীয় - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 5, true, '["ফলের জুস","জুস ড্রিংকস","ডাবের পানি","কনসেনট্রেটেড স্কোয়াশ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0006-0000-000000000000', 'Soft Drinks', 'কোমল পানীয়', 'snacks-beverages-soft-drinks', '🍪', 'fastfood', 'Soft Drinks - Snacks & Beverages', 'কোমল পানীয় - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 6, true, '["কোলা","লেমন-লাইম ড্রিংক","অরেঞ্জ ড্রিংক","সোডা ওয়াটার","এনার্জি ড্রিংক","মল্ট ড্রিংকস"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0003-0007-0000-000000000000', 'Water', 'খাবার পানি', 'snacks-beverages-water', '🍪', 'fastfood', 'Water - Snacks & Beverages', 'খাবার পানি - নাস্তা ও পানীয়', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2, 7, true, '["মিনারেল ওয়াটার","বিশুদ্ধ পানি","স্পার্কলিং ওয়াটার","বড় পানির জার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0004-0001-0000-000000000000', 'Diapers', 'ডায়াপার', 'baby-care-diapers', '👶', 'child_care', 'Diapers - Baby Care', 'ডায়াপার - শিশুর যত্ন', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 1, true, '["নবজাতকের ডায়াপার","এস সাইজ","এম সাইজ","এল সাইজ","এক্সএল সাইজ","প্যান্ট ডায়াপার","কাপড়ের ডায়াপার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0004-0002-0000-000000000000', 'Baby Wipes', 'বেবি ওয়াইপস', 'baby-care-baby-wipes', '👶', 'child_care', 'Baby Wipes - Baby Care', 'বেবি ওয়াইপস - শিশুর যত্ন', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 2, true, '["সেনসিটিভ স্কিন ওয়াইপস","সুগন্ধিমুক্ত ওয়াইপস","ওয়াটার বেসড ওয়াইপস","ট্রাভেল প্যাক ওয়াইপস"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0004-0003-0000-000000000000', 'Baby Food & Formula', 'শিশুর খাবার ও ফর্মুলা', 'baby-care-baby-food', '👶', 'child_care', 'Baby Food & Formula - Baby Care', 'শিশুর খাবার ও ফর্মুলা - শিশুর যত্ন', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 3, true, '["ইনফ্যান্ট ফর্মুলা দুধ","ফলো-অন ফর্মুলা","গ্রোয়িং-আপ মিল্ক","সেরেল্যাক / বেবি সিরিয়াল","বেবি পিউরি","শিশুর নাস্তা","ফুড পাউচ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0004-0004-0000-000000000000', 'Baby Bath & Skin Care', 'শিশুর গোসল ও ত্বক', 'baby-care-baby-bath-skin', '👶', 'child_care', 'Baby Bath & Skin Care - Baby Care', 'শিশুর গোসল ও ত্বক - শিশুর যত্ন', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 4, true, '["বেবি শ্যাম্পু","বেবি বডি ওয়াশ","বেবি লোশন","বেবি অয়েল","র‍্যাশ ক্রিম","বেবি পাউডার","বেবি সোপ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0004-0005-0000-000000000000', 'Baby Accessories', 'শিশুর অনুষঙ্গ', 'baby-care-baby-accessories', '👶', 'child_care', 'Baby Accessories - Baby Care', 'শিশুর অনুষঙ্গ - শিশুর যত্ন', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 5, true, '["ফিডার বোতল","নিপল ও টিট","প্যাসিফায়ার","শিশুর বিব","চামচ ও বাটি","বোতল পরিষ্কারের ব্রাশ","নেইল ক্লিপার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0001-0000-000000000000', 'Skin Care', 'ত্বকের যত্ন', 'beauty-personal-care-skin-care', '💄', 'face', 'Skin Care - Beauty & Personal Care', 'ত্বকের যত্ন - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 1, true, '["ফেস ওয়াশ","ময়েশ্চারাইজার","সানস্ক্রিন","ফেস ক্রিম","সিরাম","টোনার","ফেস মাস্ক","লিপ কেয়ার / বাম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0002-0000-000000000000', 'Hair Care', 'চুলের যত্ন', 'beauty-personal-care-hair-care', '💄', 'face', 'Hair Care - Beauty & Personal Care', 'চুলের যত্ন - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 2, true, '["শ্যাম্পু","কন্ডিশনার","চুলের তেল","হেয়ার সিরাম","হেয়ার কালার","হেয়ার জেল ও ওয়াক্স","হেয়ার মাস্ক"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0003-0000-000000000000', 'Oral Care', 'মুখের যত্ন', 'beauty-personal-care-oral-care', '💄', 'face', 'Oral Care - Beauty & Personal Care', 'মুখের যত্ন - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 3, true, '["টুথপেস্ট","টুথব্রাশ","মাউথওয়াশ","ডেন্টাল ফ্লস","টুথপাউডার","জিহ্বা পরিষ্কারক"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0004-0000-000000000000', 'Bath & Body', 'গোসল ও শরীর', 'beauty-personal-care-bath-body', '💄', 'face', 'Bath & Body - Beauty & Personal Care', 'গোসল ও শরীর - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 4, true, '["গোসলের সাবান","বডি ওয়াশ","বডি লোশন","বডি স্ক্রাব","হ্যান্ড ওয়াশ","হ্যান্ড ক্রিম","ট্যালকম পাউডার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0005-0000-000000000000', 'Shaving & Grooming', 'শেভিং ও গ্রুমিং', 'beauty-personal-care-shaving-grooming', '💄', 'face', 'Shaving & Grooming - Beauty & Personal Care', 'শেভিং ও গ্রুমিং - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 5, true, '["রেজর / ব্লেড","শেভিং ক্রিম","শেভিং ফোম","আফটারশেভ","দাড়ির তেল","হেয়ার রিমুভাল ক্রিম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0006-0000-000000000000', 'Deodorants', 'সুগন্ধি ও ডিওডোরেন্ট', 'beauty-personal-care-deodorants', '💄', 'face', 'Deodorants - Beauty & Personal Care', 'সুগন্ধি ও ডিওডোরেন্ট - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 6, true, '["রোল-অন","বডি স্প্রে","স্টিক ডিওডোরেন্ট","বডি মিস্ট","পারফিউম / আতর"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0005-0007-0000-000000000000', 'Feminine Care', 'নারীর ব্যক্তিগত যত্ন', 'beauty-personal-care-feminine-care', '💄', 'face', 'Feminine Care - Beauty & Personal Care', 'নারীর ব্যক্তিগত যত্ন - সৌন্দর্য ও ব্যক্তিগত যত্ন', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 2, 7, true, '["স্যানিটারি ন্যাপকিন","প্যান্টিলাইনার","ট্যাম্পন","মেনস্ট্রুয়াল কাপ","ইন্টিমেট ওয়াশ","ম্যাটারনিটি প্যাড"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0001-0000-000000000000', 'Dishwashing Supplies', 'বাসন মাজার সামগ্রী', 'cleaning-household-dishwashing-supplies', '🧹', 'cleaning_services', 'Dishwashing Supplies - Cleaning & Household', 'বাসন মাজার সামগ্রী - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 1, true, '["ডিশওয়াশ লিকুইড","ডিশওয়াশ বার / সাবান","ডিশওয়াশ পাউডার","ডিশওয়াশার ট্যাবলেট","স্পঞ্জ ও স্ক্রাবার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0002-0000-000000000000', 'Laundry', 'লন্ড্রি ও কাপড় ধোয়া', 'cleaning-household-laundry', '🧹', 'cleaning_services', 'Laundry - Cleaning & Household', 'লন্ড্রি ও কাপড় ধোয়া - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 2, true, '["ডিটারজেন্ট পাউডার","লিকুইড ডিটারজেন্ট","কাপড় কাচার সাবান","ফ্যাব্রিক সফটনার","দাগ দূরকারক","ব্লিচিং পাউডার","কাপড়ের ক্লিপ ও পিন"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0003-0000-000000000000', 'Toilet Cleaners', 'টয়লেট ক্লিনার', 'cleaning-household-toilet-cleaners', '🧹', 'cleaning_services', 'Toilet Cleaners - Cleaning & Household', 'টয়লেট ক্লিনার - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 3, true, '["টয়লেট লিকুইড ক্লিনার","টয়লেট জেল","ফ্লাশ ব্লক","বাথরুম ক্লিনার","ড্রেন ক্লিনার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0004-0000-000000000000', 'Napkins & Paper Products', 'ন্যাপকিন ও পেপার সামগ্রী', 'cleaning-household-napkins-paper-products', '🧹', 'cleaning_services', 'Napkins & Paper Products - Cleaning & Household', 'ন্যাপকিন ও পেপার সামগ্রী - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 4, true, '["ফেসিয়াল টিস্যু","টয়লেট টিস্যু রোল","কিচেন পেপার টাওয়েল","পেপার ন্যাপকিন","ওয়েট ওয়াইপস","হ্যান্ড টাওয়েল"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0005-0000-000000000000', 'Pest Control', 'মশা ও কীটনাশক', 'cleaning-household-pest-control', '🧹', 'cleaning_services', 'Pest Control - Cleaning & Household', 'মশা ও কীটনাশক - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 5, true, '["মশার অ্যারোসল / স্প্রে","মশার কয়েল","লিকুইড ভ্যাপোরাইজার ও রিফিল","তেলাপোকা ও পিঁপড়া মারার স্প্রে","ইঁদুর মারার বিষ / ফাঁদ","কীটনাশক চক ও পাউডার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0006-0000-000000000000', 'Floor & Glass Cleaners', 'মেঝে ও গ্লাস ক্লিনার', 'cleaning-household-floor-glass-cleaners', '🧹', 'cleaning_services', 'Floor & Glass Cleaners - Cleaning & Household', 'মেঝে ও গ্লাস ক্লিনার - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 6, true, '["ফ্লোর ক্লিনার","গ্লাস ক্লিনার","মাল্টি-পারপাস ক্লিনার","জীবাণুনাশক স্প্রে ও ফিনাইল","কিচেন ক্লিনার","ফার্নিচার পলিশ"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0007-0000-000000000000', 'Cleaning Accessories', 'পরিষ্কারের সরঞ্জাম', 'cleaning-household-cleaning-accessories', '🧹', 'cleaning_services', 'Cleaning Accessories - Cleaning & Household', 'পরিষ্কারের সরঞ্জাম - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 7, true, '["ফ্লোর মপ ও ওয়াইপার","ঝাড়ু ও ডাস্টপ্যান","স্ক্রাবার ও স্পঞ্জ","মুছার কাপড় ও ডাস্টার","টয়লেট ব্রাশ","ক্লিনিং রাবার গ্লাভস"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0008-0000-000000000000', 'Air Fresheners', 'এয়ার ফ্রেশনার', 'cleaning-household-air-fresheners', '🧹', 'cleaning_services', 'Air Fresheners - Cleaning & Household', 'এয়ার ফ্রেশনার - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 8, true, '["রুম স্প্রে","অ্যারোসল ফ্রেশনার","জেল ফ্রেশনার","টয়লেট ফ্রেশনার ও ওডোনিল","ডিফিউজার ও রিফিল","কার ফ্রেশনার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0009-0000-000000000000', 'Disposables & Trash Bags', 'ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'cleaning-household-disposables-trash-bags', '🧹', 'cleaning_services', 'Disposables & Trash Bags - Cleaning & Household', 'ডিসপোজেবল ও ট্র্যাশ ব্যাগ - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 9, true, '["ময়লার ব্যাগ / ট্র্যাশ ব্যাগ","ড্রস্ট্রিং ডাস্টবিন ব্যাগ","অ্যালুমিনিয়াম ফয়েল","ফুড র‍্যাপিং পেপার / ক্লিঙ ফিল্ম","ডিসপোজেবল গ্লাভস","ডিসপোজেবল বক্স"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0010-0000-000000000000', 'Shoe Care', 'জুতার যত্ন', 'cleaning-household-shoe-care', '🧹', 'cleaning_services', 'Shoe Care - Cleaning & Household', 'জুতার যত্ন - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 10, true, '["কালো জুতার পলিশ","বাদামী জুতার পলিশ","ইনস্ট্যান্ট জুতার শাইনার","লিকুইড শু পলিশ","জুতার ব্রাশ","শু ক্রিম"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0006-0011-0000-000000000000', 'Trash Bin & Basket', 'ডাস্টবিন ও ঝুড়ি', 'cleaning-household-trash-bin-basket', '🧹', 'cleaning_services', 'Trash Bin & Basket - Cleaning & Household', 'ডাস্টবিন ও ঝুড়ি - ক্লিনিং ও গৃহস্থালি', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 2, 11, true, '["প্যাডেল ডাস্টবিন","ওপেন ডাস্টবিন","বাথরুমের ছোট বিন","লন্ড্রি বাস্কেট","স্টোরেজ ঝুড়ি"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0007-0001-0000-000000000000', 'Pens & Writing', 'কলম ও লেখার সামগ্রী', 'stationery-lifestyle-pens-writing', '✏️', 'menu_book', 'Pens & Writing - Stationery & Lifestyle', 'কলম ও লেখার সামগ্রী - স্টেশনারি ও লাইফস্টাইল', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 2, 1, true, '["বলপয়েন্ট কলম","জেল কলম","পেন্সিল","হাইলাইটার","স্থায়ী মার্কার","হোয়াইটবোর্ড মার্কার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0007-0002-0000-000000000000', 'Notebooks & Paper', 'খাতা ও কাগজ', 'stationery-lifestyle-notebooks-paper', '✏️', 'menu_book', 'Notebooks & Paper - Stationery & Lifestyle', 'খাতা ও কাগজ - স্টেশনারি ও লাইফস্টাইল', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 2, 2, true, '["খাতা","স্পাইরাল নোটবুক","স্টিকি নোট","এ৪ পেপার","ডায়েরি ও প্ল্যানার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0007-0003-0000-000000000000', 'Office Supplies', 'অফিস সামগ্রী', 'stationery-lifestyle-office-supplies', '✏️', 'menu_book', 'Office Supplies - Stationery & Lifestyle', 'অফিস সামগ্রী - স্টেশনারি ও লাইফস্টাইল', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 2, 3, true, '["স্ট্যাপলার ও পিন","পেপার ক্লিপ","কাঁচি ও কাটার","আঠা ও স্কচটেপ","ক্যালকুলেটর","ফাইল ও ফোল্ডার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0007-0004-0000-000000000000', 'Art & Craft', 'আর্ট ও ক্রাফট', 'stationery-lifestyle-art-craft', '✏️', 'menu_book', 'Art & Craft - Stationery & Lifestyle', 'আর্ট ও ক্রাফট - স্টেশনারি ও লাইফস্টাইল', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 2, 4, true, '["রং পেন্সিল","মোম রং / ক্রেয়ন","জলরং সেট","স্কেচবুক","ক্রাফট পেপার"]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c2000000-0007-0005-0000-000000000000', 'Party Supplies', 'পার্টি সামগ্রী', 'stationery-lifestyle-party-supplies', '✏️', 'menu_book', 'Party Supplies - Stationery & Lifestyle', 'পার্টি সামগ্রী - স্টেশনারি ও লাইফস্টাইল', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 2, 5, true, '["বেলুন","জন্মদিনের মোমবাতি","পার্টি পপার","ডিসপোজেবল প্লেট ও কাপ","গিফট র‍্যাপ ও ব্যাগ"]'::jsonb);

-- ------------------------------------------------------------------------------------
-- 7. SEED: LEVEL 3 (277 CHILD CATEGORIES - SUBCATEGORY UNDER SUBCATEGORY)
-- ------------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0001-000000000000', 'Full Cream Milk', 'ফুল ক্রিম দুধ', 'dairy-eggs-milk-full-cream-milk', '🥛', 'egg_alt', 'Full Cream Milk - Milk', 'ফুল ক্রিম দুধ - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0002-000000000000', 'Low-Fat Milk', 'লো-ফ্যাট দুধ', 'dairy-eggs-milk-low-fat-milk', '🥛', 'egg_alt', 'Low-Fat Milk - Milk', 'লো-ফ্যাট দুধ - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0003-000000000000', 'UHT Milk', 'ইউএইচটি দুধ', 'dairy-eggs-milk-uht-milk', '🥛', 'egg_alt', 'UHT Milk - Milk', 'ইউএইচটি দুধ - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0004-000000000000', 'Powdered Milk', 'গুঁড়ো দুধ', 'dairy-eggs-milk-powdered-milk', '🥛', 'egg_alt', 'Powdered Milk - Milk', 'গুঁড়ো দুধ - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0005-000000000000', 'Flavored Milk', 'ফ্লেভার্ড মিল্ক', 'dairy-eggs-milk-flavored-milk', '🥛', 'egg_alt', 'Flavored Milk - Milk', 'ফ্লেভার্ড মিল্ক - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0001-0006-000000000000', 'Condensed Milk', 'কনডেন্সড মিল্ক', 'dairy-eggs-milk-condensed-milk', '🥛', 'egg_alt', 'Condensed Milk - Milk', 'কনডেন্সড মিল্ক - দুধ', 'c2000000-0001-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0002-0001-000000000000', 'Plain Yogurt', 'টক দই', 'dairy-eggs-yogurt-plain-yogurt', '🥛', 'egg_alt', 'Plain Yogurt - Yogurt', 'টক দই - দই', 'c2000000-0001-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0002-0002-000000000000', 'Sweetened Yogurt', 'মিষ্টি দই', 'dairy-eggs-yogurt-sweetened-yogurt', '🥛', 'egg_alt', 'Sweetened Yogurt - Yogurt', 'মিষ্টি দই - দই', 'c2000000-0001-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0002-0003-000000000000', 'Greek-Style Yogurt', 'গ্রিক ইয়োগার্ট', 'dairy-eggs-yogurt-greek-style-yogurt', '🥛', 'egg_alt', 'Greek-Style Yogurt - Yogurt', 'গ্রিক ইয়োগার্ট - দই', 'c2000000-0001-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0002-0004-000000000000', 'Flavored Yogurt', 'ফ্লেভার্ড দই', 'dairy-eggs-yogurt-flavored-yogurt', '🥛', 'egg_alt', 'Flavored Yogurt - Yogurt', 'ফ্লেভার্ড দই - দই', 'c2000000-0001-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0003-0001-000000000000', 'Salted Butter', 'সল্টেড বাটার', 'dairy-eggs-butter-ghee-salted-butter', '🥛', 'egg_alt', 'Salted Butter - Butter & Ghee', 'সল্টেড বাটার - মাখন ও ঘি', 'c2000000-0001-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0003-0002-000000000000', 'Unsalted Butter', 'আনসল্টেড বাটার', 'dairy-eggs-butter-ghee-unsalted-butter', '🥛', 'egg_alt', 'Unsalted Butter - Butter & Ghee', 'আনসল্টেড বাটার - মাখন ও ঘি', 'c2000000-0001-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0003-0003-000000000000', 'Dairy Ghee', 'গাওয়া ঘি', 'dairy-eggs-butter-ghee-dairy-ghee', '🥛', 'egg_alt', 'Dairy Ghee - Butter & Ghee', 'গাওয়া ঘি - মাখন ও ঘি', 'c2000000-0001-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0003-0004-000000000000', 'Pure Ghee', 'খাঁটি ঘি', 'dairy-eggs-butter-ghee-pure-ghee', '🥛', 'egg_alt', 'Pure Ghee - Butter & Ghee', 'খাঁটি ঘি - মাখন ও ঘি', 'c2000000-0001-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0004-0001-000000000000', 'Sliced Cheese', 'স্লাইসড চিজ', 'dairy-eggs-cheese-sliced-cheese', '🥛', 'egg_alt', 'Sliced Cheese - Cheese', 'স্লাইসড চিজ - পনির ও চিজ', 'c2000000-0001-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0004-0002-000000000000', 'Cheese Blocks', 'চিজ ব্লক', 'dairy-eggs-cheese-cheese-blocks', '🥛', 'egg_alt', 'Cheese Blocks - Cheese', 'চিজ ব্লক - পনির ও চিজ', 'c2000000-0001-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0004-0003-000000000000', 'Cheese Spread', 'চিজ স্প্রেড', 'dairy-eggs-cheese-cheese-spread', '🥛', 'egg_alt', 'Cheese Spread - Cheese', 'চিজ স্প্রেড - পনির ও চিজ', 'c2000000-0001-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0004-0004-000000000000', 'Mozzarella', 'মোজারেলা চিজ', 'dairy-eggs-cheese-mozzarella', '🥛', 'egg_alt', 'Mozzarella - Cheese', 'মোজারেলা চিজ - পনির ও চিজ', 'c2000000-0001-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0004-0005-000000000000', 'Processed Cheese', 'প্রসেসড চিজ', 'dairy-eggs-cheese-processed-cheese', '🥛', 'egg_alt', 'Processed Cheese - Cheese', 'প্রসেসড চিজ - পনির ও চিজ', 'c2000000-0001-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0005-0001-000000000000', 'Fresh Cream', 'ফ্রেশ ক্রিম', 'dairy-eggs-cream-fresh-cream', '🥛', 'egg_alt', 'Fresh Cream - Cream', 'ফ্রেশ ক্রিম - ক্রিম', 'c2000000-0001-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0005-0002-000000000000', 'Whipping Cream', 'হুইপিং ক্রিম', 'dairy-eggs-cream-whipping-cream', '🥛', 'egg_alt', 'Whipping Cream - Cream', 'হুইপিং ক্রিম - ক্রিম', 'c2000000-0001-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0005-0003-000000000000', 'Cooking Cream', 'কুকিং ক্রিম', 'dairy-eggs-cream-cooking-cream', '🥛', 'egg_alt', 'Cooking Cream - Cream', 'কুকিং ক্রিম - ক্রিম', 'c2000000-0001-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0006-0001-000000000000', 'Chicken Eggs', 'মুরগির ডিম', 'dairy-eggs-eggs-chicken-eggs', '🥛', 'egg_alt', 'Chicken Eggs - Eggs', 'মুরগির ডিম - ডিম', 'c2000000-0001-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0006-0002-000000000000', 'Duck Eggs', 'হাঁসের ডিম', 'dairy-eggs-eggs-duck-eggs', '🥛', 'egg_alt', 'Duck Eggs - Eggs', 'হাঁসের ডিম - ডিম', 'c2000000-0001-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0001-0006-0003-000000000000', 'Quail Eggs', 'কোয়েলের ডিম', 'dairy-eggs-eggs-quail-eggs', '🥛', 'egg_alt', 'Quail Eggs - Eggs', 'কোয়েলের ডিম - ডিম', 'c2000000-0001-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0001-000000000000', 'Miniket Rice', 'মিনিকেট চাল', 'cooking-essentials-rice-miniket-rice', '🌾', 'restaurant', 'Miniket Rice - Rice', 'মিনিকেট চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0002-000000000000', 'Nazirshail Rice', 'নাজিরশাইল চাল', 'cooking-essentials-rice-nazirshail-rice', '🌾', 'restaurant', 'Nazirshail Rice - Rice', 'নাজিরশাইল চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0003-000000000000', 'Basmati Rice', 'বাসমতী চাল', 'cooking-essentials-rice-basmati-rice', '🌾', 'restaurant', 'Basmati Rice - Rice', 'বাসমতী চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0004-000000000000', 'Brown Rice', 'ব্রাউন রাইস / লাল চাল', 'cooking-essentials-rice-brown-rice', '🌾', 'restaurant', 'Brown Rice - Rice', 'ব্রাউন রাইস / লাল চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0005-000000000000', 'Parboiled Rice', 'সিদ্ধ চাল', 'cooking-essentials-rice-parboiled-rice', '🌾', 'restaurant', 'Parboiled Rice - Rice', 'সিদ্ধ চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0001-0006-000000000000', 'Aromatic Rice', 'সুগন্ধি পোলাও চাল', 'cooking-essentials-rice-aromatic-rice', '🌾', 'restaurant', 'Aromatic Rice - Rice', 'সুগন্ধি পোলাও চাল - চাল', 'c2000000-0002-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0001-000000000000', 'Masoor Dal', 'মসুর ডাল', 'cooking-essentials-lentils-pulses-masoor-dal', '🌾', 'restaurant', 'Masoor Dal - Lentils & Pulses', 'মসুর ডাল - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0002-000000000000', 'Moong Dal', 'মুগ ডাল', 'cooking-essentials-lentils-pulses-moong-dal', '🌾', 'restaurant', 'Moong Dal - Lentils & Pulses', 'মুগ ডাল - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0003-000000000000', 'Chana Dal', 'ছোলার ডাল', 'cooking-essentials-lentils-pulses-chana-dal', '🌾', 'restaurant', 'Chana Dal - Lentils & Pulses', 'ছোলার ডাল - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0004-000000000000', 'Urad Dal', 'মাষকলাই ডাল', 'cooking-essentials-lentils-pulses-urad-dal', '🌾', 'restaurant', 'Urad Dal - Lentils & Pulses', 'মাষকলাই ডাল - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0005-000000000000', 'Chickpeas', 'ছোলা বুট', 'cooking-essentials-lentils-pulses-chickpeas', '🌾', 'restaurant', 'Chickpeas - Lentils & Pulses', 'ছোলা বুট - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0002-0006-000000000000', 'Dried Peas', 'মটর ডাল', 'cooking-essentials-lentils-pulses-dried-peas', '🌾', 'restaurant', 'Dried Peas - Lentils & Pulses', 'মটর ডাল - ডাল ও ডালজাতীয়', 'c2000000-0002-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0001-000000000000', 'Atta', 'আটা', 'cooking-essentials-flour-atta', '🌾', 'restaurant', 'Atta - Flour', 'আটা - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0002-000000000000', 'Maida', 'ময়দা', 'cooking-essentials-flour-maida', '🌾', 'restaurant', 'Maida - Flour', 'ময়দা - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0003-000000000000', 'Whole Wheat Flour', 'লাল আটা', 'cooking-essentials-flour-whole-wheat-flour', '🌾', 'restaurant', 'Whole Wheat Flour - Flour', 'লাল আটা - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0004-000000000000', 'Rice Flour', 'চালের গুঁড়া', 'cooking-essentials-flour-rice-flour', '🌾', 'restaurant', 'Rice Flour - Flour', 'চালের গুঁড়া - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0005-000000000000', 'Besan', 'বেসন', 'cooking-essentials-flour-besan', '🌾', 'restaurant', 'Besan - Flour', 'বেসন - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0003-0006-000000000000', 'Semolina (Suji)', 'সুজি', 'cooking-essentials-flour-semolina-suji-', '🌾', 'restaurant', 'Semolina (Suji) - Flour', 'সুজি - আটা ও ময়দা', 'c2000000-0002-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0001-000000000000', 'Soybean Oil', 'সয়াবিন তেল', 'cooking-essentials-cooking-oil-soybean-oil', '🌾', 'restaurant', 'Soybean Oil - Cooking Oil', 'সয়াবিন তেল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0002-000000000000', 'Mustard Oil', 'সরিষার তেল', 'cooking-essentials-cooking-oil-mustard-oil', '🌾', 'restaurant', 'Mustard Oil - Cooking Oil', 'সরিষার তেল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0003-000000000000', 'Sunflower Oil', 'সূর্যমুখী তেল', 'cooking-essentials-cooking-oil-sunflower-oil', '🌾', 'restaurant', 'Sunflower Oil - Cooking Oil', 'সূর্যমুখী তেল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0004-000000000000', 'Olive Oil', 'অলিভ অয়েল', 'cooking-essentials-cooking-oil-olive-oil', '🌾', 'restaurant', 'Olive Oil - Cooking Oil', 'অলিভ অয়েল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0005-000000000000', 'Rice Bran Oil', 'রাইস ব্রান তেল', 'cooking-essentials-cooking-oil-rice-bran-oil', '🌾', 'restaurant', 'Rice Bran Oil - Cooking Oil', 'রাইস ব্রান তেল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0004-0006-000000000000', 'Coconut Oil', 'নারকেল তেল', 'cooking-essentials-cooking-oil-coconut-oil', '🌾', 'restaurant', 'Coconut Oil - Cooking Oil', 'নারকেল তেল - ভোজ্য তেল', 'c2000000-0002-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0001-000000000000', 'Iodized Salt', 'আয়োডিনযুক্ত লবণ', 'cooking-essentials-salt-sugar-iodized-salt', '🌾', 'restaurant', 'Iodized Salt - Salt & Sugar', 'আয়োডিনযুক্ত লবণ - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0002-000000000000', 'Rock Salt', 'সৈন্ধব লবণ / বিট লবণ', 'cooking-essentials-salt-sugar-rock-salt', '🌾', 'restaurant', 'Rock Salt - Salt & Sugar', 'সৈন্ধব লবণ / বিট লবণ - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0003-000000000000', 'White Sugar', 'সাদা চিনি', 'cooking-essentials-salt-sugar-white-sugar', '🌾', 'restaurant', 'White Sugar - Salt & Sugar', 'সাদা চিনি - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0004-000000000000', 'Brown Sugar', 'দেশি লাল চিনি', 'cooking-essentials-salt-sugar-brown-sugar', '🌾', 'restaurant', 'Brown Sugar - Salt & Sugar', 'দেশি লাল চিনি - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0005-000000000000', 'Powdered Sugar', 'আইসিং সুগার', 'cooking-essentials-salt-sugar-powdered-sugar', '🌾', 'restaurant', 'Powdered Sugar - Salt & Sugar', 'আইসিং সুগার - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0005-0006-000000000000', 'Sugar Substitutes', 'জিরো ক্যালরি সুগার', 'cooking-essentials-salt-sugar-sugar-substitutes', '🌾', 'restaurant', 'Sugar Substitutes - Salt & Sugar', 'জিরো ক্যালরি সুগার - লবণ ও চিনি', 'c2000000-0002-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0001-000000000000', 'Turmeric Powder', 'হলুদ গুঁড়া', 'cooking-essentials-spices-turmeric-powder', '🌾', 'restaurant', 'Turmeric Powder - Spices', 'হলুদ গুঁড়া - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0002-000000000000', 'Chili Powder', 'মরিচ গুঁড়া', 'cooking-essentials-spices-chili-powder', '🌾', 'restaurant', 'Chili Powder - Spices', 'মরিচ গুঁড়া - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0003-000000000000', 'Coriander Powder', 'ধনে গুঁড়া', 'cooking-essentials-spices-coriander-powder', '🌾', 'restaurant', 'Coriander Powder - Spices', 'ধনে গুঁড়া - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0004-000000000000', 'Cumin', 'জিরা', 'cooking-essentials-spices-cumin', '🌾', 'restaurant', 'Cumin - Spices', 'জিরা - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0005-000000000000', 'Garam Masala', 'গরম মসলা', 'cooking-essentials-spices-garam-masala', '🌾', 'restaurant', 'Garam Masala - Spices', 'গরম মসলা - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0006-000000000000', 'Whole Spices', 'আস্ত মসলা', 'cooking-essentials-spices-whole-spices', '🌾', 'restaurant', 'Whole Spices - Spices', 'আস্ত মসলা - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0006-0007-000000000000', 'Spice Mixes', 'রেডি মসলা মিক্স', 'cooking-essentials-spices-spice-mixes', '🌾', 'restaurant', 'Spice Mixes - Spices', 'রেডি মসলা মিক্স - মসলাপাতি', 'c2000000-0002-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0001-000000000000', 'Tomato Ketchup', 'টমেটো সস', 'cooking-essentials-sauces-condiments-tomato-ketchup', '🌾', 'restaurant', 'Tomato Ketchup - Sauces & Condiments', 'টমেটো সস - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0002-000000000000', 'Soy Sauce', 'সয়া সস', 'cooking-essentials-sauces-condiments-soy-sauce', '🌾', 'restaurant', 'Soy Sauce - Sauces & Condiments', 'সয়া সস - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0003-000000000000', 'Chili Sauce', 'মরিচ সস', 'cooking-essentials-sauces-condiments-chili-sauce', '🌾', 'restaurant', 'Chili Sauce - Sauces & Condiments', 'মরিচ সস - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0004-000000000000', 'Mayonnaise', 'মেয়োনিজ', 'cooking-essentials-sauces-condiments-mayonnaise', '🌾', 'restaurant', 'Mayonnaise - Sauces & Condiments', 'মেয়োনিজ - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0005-000000000000', 'Mustard', 'সরিষার কাসুন্দি', 'cooking-essentials-sauces-condiments-mustard', '🌾', 'restaurant', 'Mustard - Sauces & Condiments', 'সরিষার কাসুন্দি - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0006-000000000000', 'Vinegar', 'ভিনেগার', 'cooking-essentials-sauces-condiments-vinegar', '🌾', 'restaurant', 'Vinegar - Sauces & Condiments', 'ভিনেগার - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0007-000000000000', 'Pickles', 'আচার', 'cooking-essentials-sauces-condiments-pickles', '🌾', 'restaurant', 'Pickles - Sauces & Condiments', 'আচার - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0002-0007-0008-000000000000', 'Chutney', 'চাটনি', 'cooking-essentials-sauces-condiments-chutney', '🌾', 'restaurant', 'Chutney - Sauces & Condiments', 'চাটনি - সস ও আচার', 'c2000000-0002-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 3, 8, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0001-000000000000', 'Potato Chips', 'আলু চিপস', 'snacks-beverages-chips-snacks-potato-chips', '🍪', 'fastfood', 'Potato Chips - Chips & Savory Snacks', 'আলু চিপস - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0002-000000000000', 'Corn Chips', 'কর্ন চিপস', 'snacks-beverages-chips-snacks-corn-chips', '🍪', 'fastfood', 'Corn Chips - Chips & Savory Snacks', 'কর্ন চিপস - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0003-000000000000', 'Chanachur', 'চানাচুর', 'snacks-beverages-chips-snacks-chanachur', '🍪', 'fastfood', 'Chanachur - Chips & Savory Snacks', 'চানাচুর - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0004-000000000000', 'Nuts & Seeds', 'বাদাম ও বীজ', 'snacks-beverages-chips-snacks-nuts-seeds', '🍪', 'fastfood', 'Nuts & Seeds - Chips & Savory Snacks', 'বাদাম ও বীজ - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0005-000000000000', 'Popcorn', 'পপকর্ন', 'snacks-beverages-chips-snacks-popcorn', '🍪', 'fastfood', 'Popcorn - Chips & Savory Snacks', 'পপকর্ন - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0001-0006-000000000000', 'Crackers', 'নোনতা ক্র্যাকার্স', 'snacks-beverages-chips-snacks-crackers', '🍪', 'fastfood', 'Crackers - Chips & Savory Snacks', 'নোনতা ক্র্যাকার্স - চিপস ও চানাচুর', 'c2000000-0003-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0001-000000000000', 'Sweet Biscuits', 'মিষ্টি বিস্কুট', 'snacks-beverages-biscuits-cookies-sweet-biscuits', '🍪', 'fastfood', 'Sweet Biscuits - Biscuits & Cookies', 'মিষ্টি বিস্কুট - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0002-000000000000', 'Salty Biscuits', 'নোনতা বিস্কুট', 'snacks-beverages-biscuits-cookies-salty-biscuits', '🍪', 'fastfood', 'Salty Biscuits - Biscuits & Cookies', 'নোনতা বিস্কুট - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0003-000000000000', 'Cream Biscuits', 'ক্রিম বিস্কুট', 'snacks-beverages-biscuits-cookies-cream-biscuits', '🍪', 'fastfood', 'Cream Biscuits - Biscuits & Cookies', 'ক্রিম বিস্কুট - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0004-000000000000', 'Cookies', 'কুকিজ', 'snacks-beverages-biscuits-cookies-cookies', '🍪', 'fastfood', 'Cookies - Biscuits & Cookies', 'কুকিজ - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0005-000000000000', 'Wafers', 'ওয়েফার', 'snacks-beverages-biscuits-cookies-wafers', '🍪', 'fastfood', 'Wafers - Biscuits & Cookies', 'ওয়েফার - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0002-0006-000000000000', 'Crackers', 'টোস্ট ও ক্র্যাকার্স', 'snacks-beverages-biscuits-cookies-crackers', '🍪', 'fastfood', 'Crackers - Biscuits & Cookies', 'টোস্ট ও ক্র্যাকার্স - বিস্কুট ও কুকিজ', 'c2000000-0003-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0001-000000000000', 'Chocolate Bars', 'চকলেট বার', 'snacks-beverages-chocolates-candy-chocolate-bars', '🍪', 'fastfood', 'Chocolate Bars - Chocolates & Candy', 'চকলেট বার - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0002-000000000000', 'Boxed Chocolates', 'বক্স চকলেট', 'snacks-beverages-chocolates-candy-boxed-chocolates', '🍪', 'fastfood', 'Boxed Chocolates - Chocolates & Candy', 'বক্স চকলেট - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0003-000000000000', 'Toffees', 'টফি', 'snacks-beverages-chocolates-candy-toffees', '🍪', 'fastfood', 'Toffees - Chocolates & Candy', 'টফি - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0004-000000000000', 'Lollipops', 'ললিপপ', 'snacks-beverages-chocolates-candy-lollipops', '🍪', 'fastfood', 'Lollipops - Chocolates & Candy', 'ললিপপ - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0005-000000000000', 'Chewing Gum', 'চুয়িংগাম', 'snacks-beverages-chocolates-candy-chewing-gum', '🍪', 'fastfood', 'Chewing Gum - Chocolates & Candy', 'চুয়িংগাম - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0003-0006-000000000000', 'Mints', 'মিন্ট ক্যান্ডি', 'snacks-beverages-chocolates-candy-mints', '🍪', 'fastfood', 'Mints - Chocolates & Candy', 'মিন্ট ক্যান্ডি - চকলেট ও ক্যান্ডি', 'c2000000-0003-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0001-000000000000', 'Black Tea', 'ব্ল্যাক টি / পাতা চা', 'snacks-beverages-tea-coffee-black-tea', '🍪', 'fastfood', 'Black Tea - Tea & Coffee', 'ব্ল্যাক টি / পাতা চা - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0002-000000000000', 'Green Tea', 'গ্রিন টি', 'snacks-beverages-tea-coffee-green-tea', '🍪', 'fastfood', 'Green Tea - Tea & Coffee', 'গ্রিন টি - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0003-000000000000', 'Tea Bags', 'টি ব্যাগ', 'snacks-beverages-tea-coffee-tea-bags', '🍪', 'fastfood', 'Tea Bags - Tea & Coffee', 'টি ব্যাগ - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0004-000000000000', 'Instant Coffee', 'ইনস্ট্যান্ট কফি', 'snacks-beverages-tea-coffee-instant-coffee', '🍪', 'fastfood', 'Instant Coffee - Tea & Coffee', 'ইনস্ট্যান্ট কফি - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0005-000000000000', 'Ground Coffee', 'গ্রাউন্ড কফি', 'snacks-beverages-tea-coffee-ground-coffee', '🍪', 'fastfood', 'Ground Coffee - Tea & Coffee', 'গ্রাউন্ড কফি - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0006-000000000000', 'Coffee Mixes', 'কফি মিক্স', 'snacks-beverages-tea-coffee-coffee-mixes', '🍪', 'fastfood', 'Coffee Mixes - Tea & Coffee', 'কফি মিক্স - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0004-0007-000000000000', 'Milk Tea Mix', 'দুধ চা মিক্স', 'snacks-beverages-tea-coffee-milk-tea-mix', '🍪', 'fastfood', 'Milk Tea Mix - Tea & Coffee', 'দুধ চা মিক্স - চা ও কফি', 'c2000000-0003-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0005-0001-000000000000', 'Fruit Juice', 'ফলের জুস', 'snacks-beverages-juice-fruit-juice', '🍪', 'fastfood', 'Fruit Juice - Juice', 'ফলের জুস - জুস ও পানীয়', 'c2000000-0003-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0005-0002-000000000000', 'Juice Drinks', 'জুস ড্রিংকস', 'snacks-beverages-juice-juice-drinks', '🍪', 'fastfood', 'Juice Drinks - Juice', 'জুস ড্রিংকস - জুস ও পানীয়', 'c2000000-0003-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0005-0003-000000000000', 'Coconut Water', 'ডাবের পানি', 'snacks-beverages-juice-coconut-water', '🍪', 'fastfood', 'Coconut Water - Juice', 'ডাবের পানি - জুস ও পানীয়', 'c2000000-0003-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0005-0004-000000000000', 'Concentrated Juice', 'কনসেনট্রেটেড স্কোয়াশ', 'snacks-beverages-juice-concentrated-juice', '🍪', 'fastfood', 'Concentrated Juice - Juice', 'কনসেনট্রেটেড স্কোয়াশ - জুস ও পানীয়', 'c2000000-0003-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0001-000000000000', 'Cola', 'কোলা', 'snacks-beverages-soft-drinks-cola', '🍪', 'fastfood', 'Cola - Soft Drinks', 'কোলা - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0002-000000000000', 'Lemon-Lime Drinks', 'লেমন-লাইম ড্রিংক', 'snacks-beverages-soft-drinks-lemon-lime-drinks', '🍪', 'fastfood', 'Lemon-Lime Drinks - Soft Drinks', 'লেমন-লাইম ড্রিংক - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0003-000000000000', 'Orange Drinks', 'অরেঞ্জ ড্রিংক', 'snacks-beverages-soft-drinks-orange-drinks', '🍪', 'fastfood', 'Orange Drinks - Soft Drinks', 'অরেঞ্জ ড্রিংক - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0004-000000000000', 'Soda Water', 'সোডা ওয়াটার', 'snacks-beverages-soft-drinks-soda-water', '🍪', 'fastfood', 'Soda Water - Soft Drinks', 'সোডা ওয়াটার - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0005-000000000000', 'Energy Drinks', 'এনার্জি ড্রিংক', 'snacks-beverages-soft-drinks-energy-drinks', '🍪', 'fastfood', 'Energy Drinks - Soft Drinks', 'এনার্জি ড্রিংক - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0006-0006-000000000000', 'Malt Drinks', 'মল্ট ড্রিংকস', 'snacks-beverages-soft-drinks-malt-drinks', '🍪', 'fastfood', 'Malt Drinks - Soft Drinks', 'মল্ট ড্রিংকস - কোমল পানীয়', 'c2000000-0003-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0007-0001-000000000000', 'Mineral Water', 'মিনারেল ওয়াটার', 'snacks-beverages-water-mineral-water', '🍪', 'fastfood', 'Mineral Water - Water', 'মিনারেল ওয়াটার - খাবার পানি', 'c2000000-0003-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0007-0002-000000000000', 'Purified Drinking Water', 'বিশুদ্ধ পানি', 'snacks-beverages-water-purified-drinking-water', '🍪', 'fastfood', 'Purified Drinking Water - Water', 'বিশুদ্ধ পানি - খাবার পানি', 'c2000000-0003-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0007-0003-000000000000', 'Sparkling Water', 'স্পার্কলিং ওয়াটার', 'snacks-beverages-water-sparkling-water', '🍪', 'fastfood', 'Sparkling Water - Water', 'স্পার্কলিং ওয়াটার - খাবার পানি', 'c2000000-0003-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0003-0007-0004-000000000000', 'Large Water Bottles', 'বড় পানির জার', 'snacks-beverages-water-large-water-bottles', '🍪', 'fastfood', 'Large Water Bottles - Water', 'বড় পানির জার - খাবার পানি', 'c2000000-0003-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000003', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0001-000000000000', 'Newborn Diapers', 'নবজাতকের ডায়াপার', 'baby-care-diapers-newborn-diapers', '👶', 'child_care', 'Newborn Diapers - Diapers', 'নবজাতকের ডায়াপার - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0002-000000000000', 'Small Size', 'এস সাইজ', 'baby-care-diapers-small-size', '👶', 'child_care', 'Small Size - Diapers', 'এস সাইজ - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0003-000000000000', 'Medium Size', 'এম সাইজ', 'baby-care-diapers-medium-size', '👶', 'child_care', 'Medium Size - Diapers', 'এম সাইজ - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0004-000000000000', 'Large Size', 'এল সাইজ', 'baby-care-diapers-large-size', '👶', 'child_care', 'Large Size - Diapers', 'এল সাইজ - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0005-000000000000', 'Extra-Large Size', 'এক্সএল সাইজ', 'baby-care-diapers-extra-large-size', '👶', 'child_care', 'Extra-Large Size - Diapers', 'এক্সএল সাইজ - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0006-000000000000', 'Diaper Pants', 'প্যান্ট ডায়াপার', 'baby-care-diapers-diaper-pants', '👶', 'child_care', 'Diaper Pants - Diapers', 'প্যান্ট ডায়াপার - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0001-0007-000000000000', 'Cloth Diapers', 'কাপড়ের ডায়াপার', 'baby-care-diapers-cloth-diapers', '👶', 'child_care', 'Cloth Diapers - Diapers', 'কাপড়ের ডায়াপার - ডায়াপার', 'c2000000-0004-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0002-0001-000000000000', 'Sensitive-Skin Wipes', 'সেনসিটিভ স্কিন ওয়াইপস', 'baby-care-baby-wipes-sensitive-skin-wipes', '👶', 'child_care', 'Sensitive-Skin Wipes - Baby Wipes', 'সেনসিটিভ স্কিন ওয়াইপস - বেবি ওয়াইপস', 'c2000000-0004-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0002-0002-000000000000', 'Fragrance-Free Wipes', 'সুগন্ধিমুক্ত ওয়াইপস', 'baby-care-baby-wipes-fragrance-free-wipes', '👶', 'child_care', 'Fragrance-Free Wipes - Baby Wipes', 'সুগন্ধিমুক্ত ওয়াইপস - বেবি ওয়াইপস', 'c2000000-0004-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0002-0003-000000000000', 'Water-Based Wipes', 'ওয়াটার বেসড ওয়াইপস', 'baby-care-baby-wipes-water-based-wipes', '👶', 'child_care', 'Water-Based Wipes - Baby Wipes', 'ওয়াটার বেসড ওয়াইপস - বেবি ওয়াইপস', 'c2000000-0004-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0002-0004-000000000000', 'Travel Pack Wipes', 'ট্রাভেল প্যাক ওয়াইপস', 'baby-care-baby-wipes-travel-pack-wipes', '👶', 'child_care', 'Travel Pack Wipes - Baby Wipes', 'ট্রাভেল প্যাক ওয়াইপস - বেবি ওয়াইপস', 'c2000000-0004-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0001-000000000000', 'Infant Formula', 'ইনফ্যান্ট ফর্মুলা দুধ', 'baby-care-baby-food-infant-formula', '👶', 'child_care', 'Infant Formula - Baby Food & Formula', 'ইনফ্যান্ট ফর্মুলা দুধ - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0002-000000000000', 'Follow-On Formula', 'ফলো-অন ফর্মুলা', 'baby-care-baby-food-follow-on-formula', '👶', 'child_care', 'Follow-On Formula - Baby Food & Formula', 'ফলো-অন ফর্মুলা - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0003-000000000000', 'Growing-Up Milk', 'গ্রোয়িং-আপ মিল্ক', 'baby-care-baby-food-growing-up-milk', '👶', 'child_care', 'Growing-Up Milk - Baby Food & Formula', 'গ্রোয়িং-আপ মিল্ক - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0004-000000000000', 'Baby Cereal', 'সেরেল্যাক / বেবি সিরিয়াল', 'baby-care-baby-food-baby-cereal', '👶', 'child_care', 'Baby Cereal - Baby Food & Formula', 'সেরেল্যাক / বেবি সিরিয়াল - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0005-000000000000', 'Baby Puree', 'বেবি পিউরি', 'baby-care-baby-food-baby-puree', '👶', 'child_care', 'Baby Puree - Baby Food & Formula', 'বেবি পিউরি - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0006-000000000000', 'Baby Snacks', 'শিশুর নাস্তা', 'baby-care-baby-food-baby-snacks', '👶', 'child_care', 'Baby Snacks - Baby Food & Formula', 'শিশুর নাস্তা - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0003-0007-000000000000', 'Baby Food Pouches', 'ফুড পাউচ', 'baby-care-baby-food-baby-food-pouches', '👶', 'child_care', 'Baby Food Pouches - Baby Food & Formula', 'ফুড পাউচ - শিশুর খাবার ও ফর্মুলা', 'c2000000-0004-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0001-000000000000', 'Baby Shampoo', 'বেবি শ্যাম্পু', 'baby-care-baby-bath-skin-baby-shampoo', '👶', 'child_care', 'Baby Shampoo - Baby Bath & Skin Care', 'বেবি শ্যাম্পু - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0002-000000000000', 'Baby Body Wash', 'বেবি বডি ওয়াশ', 'baby-care-baby-bath-skin-baby-body-wash', '👶', 'child_care', 'Baby Body Wash - Baby Bath & Skin Care', 'বেবি বডি ওয়াশ - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0003-000000000000', 'Baby Lotion', 'বেবি লোশন', 'baby-care-baby-bath-skin-baby-lotion', '👶', 'child_care', 'Baby Lotion - Baby Bath & Skin Care', 'বেবি লোশন - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0004-000000000000', 'Baby Oil', 'বেবি অয়েল', 'baby-care-baby-bath-skin-baby-oil', '👶', 'child_care', 'Baby Oil - Baby Bath & Skin Care', 'বেবি অয়েল - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0005-000000000000', 'Diaper Rash Cream', 'র‍্যাশ ক্রিম', 'baby-care-baby-bath-skin-diaper-rash-cream', '👶', 'child_care', 'Diaper Rash Cream - Baby Bath & Skin Care', 'র‍্যাশ ক্রিম - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0006-000000000000', 'Baby Powder', 'বেবি পাউডার', 'baby-care-baby-bath-skin-baby-powder', '👶', 'child_care', 'Baby Powder - Baby Bath & Skin Care', 'বেবি পাউডার - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0004-0007-000000000000', 'Baby Soap', 'বেবি সোপ', 'baby-care-baby-bath-skin-baby-soap', '👶', 'child_care', 'Baby Soap - Baby Bath & Skin Care', 'বেবি সোপ - শিশুর গোসল ও ত্বক', 'c2000000-0004-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0001-000000000000', 'Feeding Bottles', 'ফিডার বোতল', 'baby-care-baby-accessories-feeding-bottles', '👶', 'child_care', 'Feeding Bottles - Baby Accessories', 'ফিডার বোতল - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0002-000000000000', 'Nipples & Teats', 'নিপল ও টিট', 'baby-care-baby-accessories-nipples-teats', '👶', 'child_care', 'Nipples & Teats - Baby Accessories', 'নিপল ও টিট - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0003-000000000000', 'Pacifiers', 'প্যাসিফায়ার', 'baby-care-baby-accessories-pacifiers', '👶', 'child_care', 'Pacifiers - Baby Accessories', 'প্যাসিফায়ার - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0004-000000000000', 'Bibs', 'শিশুর বিব', 'baby-care-baby-accessories-bibs', '👶', 'child_care', 'Bibs - Baby Accessories', 'শিশুর বিব - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0005-000000000000', 'Baby Spoons & Bowls', 'চামচ ও বাটি', 'baby-care-baby-accessories-baby-spoons-bowls', '👶', 'child_care', 'Baby Spoons & Bowls - Baby Accessories', 'চামচ ও বাটি - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0006-000000000000', 'Bottle Cleaning Brushes', 'বোতল পরিষ্কারের ব্রাশ', 'baby-care-baby-accessories-bottle-cleaning-brushes', '👶', 'child_care', 'Bottle Cleaning Brushes - Baby Accessories', 'বোতল পরিষ্কারের ব্রাশ - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0004-0005-0007-000000000000', 'Baby Nail Clippers', 'নেইল ক্লিপার', 'baby-care-baby-accessories-baby-nail-clippers', '👶', 'child_care', 'Baby Nail Clippers - Baby Accessories', 'নেইল ক্লিপার - শিশুর অনুষঙ্গ', 'c2000000-0004-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000004', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0001-000000000000', 'Face Wash', 'ফেস ওয়াশ', 'beauty-personal-care-skin-care-face-wash', '💄', 'face', 'Face Wash - Skin Care', 'ফেস ওয়াশ - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0002-000000000000', 'Moisturizers', 'ময়েশ্চারাইজার', 'beauty-personal-care-skin-care-moisturizers', '💄', 'face', 'Moisturizers - Skin Care', 'ময়েশ্চারাইজার - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0003-000000000000', 'Sunscreen', 'সানস্ক্রিন', 'beauty-personal-care-skin-care-sunscreen', '💄', 'face', 'Sunscreen - Skin Care', 'সানস্ক্রিন - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0004-000000000000', 'Face Cream', 'ফেস ক্রিম', 'beauty-personal-care-skin-care-face-cream', '💄', 'face', 'Face Cream - Skin Care', 'ফেস ক্রিম - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0005-000000000000', 'Serums', 'সিরাম', 'beauty-personal-care-skin-care-serums', '💄', 'face', 'Serums - Skin Care', 'সিরাম - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0006-000000000000', 'Toner', 'টোনার', 'beauty-personal-care-skin-care-toner', '💄', 'face', 'Toner - Skin Care', 'টোনার - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0007-000000000000', 'Face Masks', 'ফেস মাস্ক', 'beauty-personal-care-skin-care-face-masks', '💄', 'face', 'Face Masks - Skin Care', 'ফেস মাস্ক - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0001-0008-000000000000', 'Lip Care', 'লিপ কেয়ার / বাম', 'beauty-personal-care-skin-care-lip-care', '💄', 'face', 'Lip Care - Skin Care', 'লিপ কেয়ার / বাম - ত্বকের যত্ন', 'c2000000-0005-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 8, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0001-000000000000', 'Shampoo', 'শ্যাম্পু', 'beauty-personal-care-hair-care-shampoo', '💄', 'face', 'Shampoo - Hair Care', 'শ্যাম্পু - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0002-000000000000', 'Conditioner', 'কন্ডিশনার', 'beauty-personal-care-hair-care-conditioner', '💄', 'face', 'Conditioner - Hair Care', 'কন্ডিশনার - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0003-000000000000', 'Hair Oil', 'চুলের তেল', 'beauty-personal-care-hair-care-hair-oil', '💄', 'face', 'Hair Oil - Hair Care', 'চুলের তেল - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0004-000000000000', 'Hair Serum', 'হেয়ার সিরাম', 'beauty-personal-care-hair-care-hair-serum', '💄', 'face', 'Hair Serum - Hair Care', 'হেয়ার সিরাম - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0005-000000000000', 'Hair Color', 'হেয়ার কালার', 'beauty-personal-care-hair-care-hair-color', '💄', 'face', 'Hair Color - Hair Care', 'হেয়ার কালার - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0006-000000000000', 'Hair Gel & Wax', 'হেয়ার জেল ও ওয়াক্স', 'beauty-personal-care-hair-care-hair-gel-wax', '💄', 'face', 'Hair Gel & Wax - Hair Care', 'হেয়ার জেল ও ওয়াক্স - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0002-0007-000000000000', 'Hair Masks', 'হেয়ার মাস্ক', 'beauty-personal-care-hair-care-hair-masks', '💄', 'face', 'Hair Masks - Hair Care', 'হেয়ার মাস্ক - চুলের যত্ন', 'c2000000-0005-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0001-000000000000', 'Toothpaste', 'টুথপেস্ট', 'beauty-personal-care-oral-care-toothpaste', '💄', 'face', 'Toothpaste - Oral Care', 'টুথপেস্ট - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0002-000000000000', 'Toothbrushes', 'টুথব্রাশ', 'beauty-personal-care-oral-care-toothbrushes', '💄', 'face', 'Toothbrushes - Oral Care', 'টুথব্রাশ - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0003-000000000000', 'Mouthwash', 'মাউথওয়াশ', 'beauty-personal-care-oral-care-mouthwash', '💄', 'face', 'Mouthwash - Oral Care', 'মাউথওয়াশ - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0004-000000000000', 'Dental Floss', 'ডেন্টাল ফ্লস', 'beauty-personal-care-oral-care-dental-floss', '💄', 'face', 'Dental Floss - Oral Care', 'ডেন্টাল ফ্লস - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0005-000000000000', 'Toothpowder', 'টুথপাউডার', 'beauty-personal-care-oral-care-toothpowder', '💄', 'face', 'Toothpowder - Oral Care', 'টুথপাউডার - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0003-0006-000000000000', 'Tongue Cleaners', 'জিহ্বা পরিষ্কারক', 'beauty-personal-care-oral-care-tongue-cleaners', '💄', 'face', 'Tongue Cleaners - Oral Care', 'জিহ্বা পরিষ্কারক - মুখের যত্ন', 'c2000000-0005-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0001-000000000000', 'Bath Soap', 'গোসলের সাবান', 'beauty-personal-care-bath-body-bath-soap', '💄', 'face', 'Bath Soap - Bath & Body', 'গোসলের সাবান - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0002-000000000000', 'Body Wash', 'বডি ওয়াশ', 'beauty-personal-care-bath-body-body-wash', '💄', 'face', 'Body Wash - Bath & Body', 'বডি ওয়াশ - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0003-000000000000', 'Body Lotion', 'বডি লোশন', 'beauty-personal-care-bath-body-body-lotion', '💄', 'face', 'Body Lotion - Bath & Body', 'বডি লোশন - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0004-000000000000', 'Body Scrub', 'বডি স্ক্রাব', 'beauty-personal-care-bath-body-body-scrub', '💄', 'face', 'Body Scrub - Bath & Body', 'বডি স্ক্রাব - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0005-000000000000', 'Hand Wash', 'হ্যান্ড ওয়াশ', 'beauty-personal-care-bath-body-hand-wash', '💄', 'face', 'Hand Wash - Bath & Body', 'হ্যান্ড ওয়াশ - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0006-000000000000', 'Hand Cream', 'হ্যান্ড ক্রিম', 'beauty-personal-care-bath-body-hand-cream', '💄', 'face', 'Hand Cream - Bath & Body', 'হ্যান্ড ক্রিম - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0004-0007-000000000000', 'Talcum Powder', 'ট্যালকম পাউডার', 'beauty-personal-care-bath-body-talcum-powder', '💄', 'face', 'Talcum Powder - Bath & Body', 'ট্যালকম পাউডার - গোসল ও শরীর', 'c2000000-0005-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0001-000000000000', 'Razors', 'রেজর / ব্লেড', 'beauty-personal-care-shaving-grooming-razors', '💄', 'face', 'Razors - Shaving & Grooming', 'রেজর / ব্লেড - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0002-000000000000', 'Shaving Cream', 'শেভিং ক্রিম', 'beauty-personal-care-shaving-grooming-shaving-cream', '💄', 'face', 'Shaving Cream - Shaving & Grooming', 'শেভিং ক্রিম - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0003-000000000000', 'Shaving Foam', 'শেভিং ফোম', 'beauty-personal-care-shaving-grooming-shaving-foam', '💄', 'face', 'Shaving Foam - Shaving & Grooming', 'শেভিং ফোম - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0004-000000000000', 'Aftershave', 'আফটারশেভ', 'beauty-personal-care-shaving-grooming-aftershave', '💄', 'face', 'Aftershave - Shaving & Grooming', 'আফটারশেভ - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0005-000000000000', 'Beard Oil', 'দাড়ির তেল', 'beauty-personal-care-shaving-grooming-beard-oil', '💄', 'face', 'Beard Oil - Shaving & Grooming', 'দাড়ির তেল - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0005-0006-000000000000', 'Hair Removal Products', 'হেয়ার রিমুভাল ক্রিম', 'beauty-personal-care-shaving-grooming-hair-removal-products', '💄', 'face', 'Hair Removal Products - Shaving & Grooming', 'হেয়ার রিমুভাল ক্রিম - শেভিং ও গ্রুমিং', 'c2000000-0005-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0006-0001-000000000000', 'Roll-On', 'রোল-অন', 'beauty-personal-care-deodorants-roll-on', '💄', 'face', 'Roll-On - Deodorants', 'রোল-অন - সুগন্ধি ও ডিওডোরেন্ট', 'c2000000-0005-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0006-0002-000000000000', 'Spray Deodorant', 'বডি স্প্রে', 'beauty-personal-care-deodorants-spray-deodorant', '💄', 'face', 'Spray Deodorant - Deodorants', 'বডি স্প্রে - সুগন্ধি ও ডিওডোরেন্ট', 'c2000000-0005-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0006-0003-000000000000', 'Stick Deodorant', 'স্টিক ডিওডোরেন্ট', 'beauty-personal-care-deodorants-stick-deodorant', '💄', 'face', 'Stick Deodorant - Deodorants', 'স্টিক ডিওডোরেন্ট - সুগন্ধি ও ডিওডোরেন্ট', 'c2000000-0005-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0006-0004-000000000000', 'Body Mist', 'বডি মিস্ট', 'beauty-personal-care-deodorants-body-mist', '💄', 'face', 'Body Mist - Deodorants', 'বডি মিস্ট - সুগন্ধি ও ডিওডোরেন্ট', 'c2000000-0005-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0006-0005-000000000000', 'Perfume', 'পারফিউম / আতর', 'beauty-personal-care-deodorants-perfume', '💄', 'face', 'Perfume - Deodorants', 'পারফিউম / আতর - সুগন্ধি ও ডিওডোরেন্ট', 'c2000000-0005-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0001-000000000000', 'Sanitary Pads', 'স্যানিটারি ন্যাপকিন', 'beauty-personal-care-feminine-care-sanitary-pads', '💄', 'face', 'Sanitary Pads - Feminine Care', 'স্যানিটারি ন্যাপকিন - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0002-000000000000', 'Pantyliners', 'প্যান্টিলাইনার', 'beauty-personal-care-feminine-care-pantyliners', '💄', 'face', 'Pantyliners - Feminine Care', 'প্যান্টিলাইনার - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0003-000000000000', 'Tampons', 'ট্যাম্পন', 'beauty-personal-care-feminine-care-tampons', '💄', 'face', 'Tampons - Feminine Care', 'ট্যাম্পন - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0004-000000000000', 'Menstrual Cups', 'মেনস্ট্রুয়াল কাপ', 'beauty-personal-care-feminine-care-menstrual-cups', '💄', 'face', 'Menstrual Cups - Feminine Care', 'মেনস্ট্রুয়াল কাপ - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0005-000000000000', 'Intimate Wash', 'ইন্টিমেট ওয়াশ', 'beauty-personal-care-feminine-care-intimate-wash', '💄', 'face', 'Intimate Wash - Feminine Care', 'ইন্টিমেট ওয়াশ - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0005-0007-0006-000000000000', 'Maternity Pads', 'ম্যাটারনিটি প্যাড', 'beauty-personal-care-feminine-care-maternity-pads', '💄', 'face', 'Maternity Pads - Feminine Care', 'ম্যাটারনিটি প্যাড - নারীর ব্যক্তিগত যত্ন', 'c2000000-0005-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000005', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0001-0001-000000000000', 'Dishwashing Liquid', 'ডিশওয়াশ লিকুইড', 'cleaning-household-dishwashing-supplies-dishwashing-liquid', '🧹', 'cleaning_services', 'Dishwashing Liquid - Dishwashing Supplies', 'ডিশওয়াশ লিকুইড - বাসন মাজার সামগ্রী', 'c2000000-0006-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0001-0002-000000000000', 'Dishwashing Bar', 'ডিশওয়াশ বার / সাবান', 'cleaning-household-dishwashing-supplies-dishwashing-bar', '🧹', 'cleaning_services', 'Dishwashing Bar - Dishwashing Supplies', 'ডিশওয়াশ বার / সাবান - বাসন মাজার সামগ্রী', 'c2000000-0006-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0001-0003-000000000000', 'Dishwashing Powder', 'ডিশওয়াশ পাউডার', 'cleaning-household-dishwashing-supplies-dishwashing-powder', '🧹', 'cleaning_services', 'Dishwashing Powder - Dishwashing Supplies', 'ডিশওয়াশ পাউডার - বাসন মাজার সামগ্রী', 'c2000000-0006-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0001-0004-000000000000', 'Dishwasher Tablets', 'ডিশওয়াশার ট্যাবলেট', 'cleaning-household-dishwashing-supplies-dishwasher-tablets', '🧹', 'cleaning_services', 'Dishwasher Tablets - Dishwashing Supplies', 'ডিশওয়াশার ট্যাবলেট - বাসন মাজার সামগ্রী', 'c2000000-0006-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0001-0005-000000000000', 'Sponges & Scrubbers', 'স্পঞ্জ ও স্ক্রাবার', 'cleaning-household-dishwashing-supplies-sponges-scrubbers', '🧹', 'cleaning_services', 'Sponges & Scrubbers - Dishwashing Supplies', 'স্পঞ্জ ও স্ক্রাবার - বাসন মাজার সামগ্রী', 'c2000000-0006-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0001-000000000000', 'Detergent Powder', 'ডিটারজেন্ট পাউডার', 'cleaning-household-laundry-detergent-powder', '🧹', 'cleaning_services', 'Detergent Powder - Laundry', 'ডিটারজেন্ট পাউডার - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0002-000000000000', 'Liquid Detergent', 'লিকুইড ডিটারজেন্ট', 'cleaning-household-laundry-liquid-detergent', '🧹', 'cleaning_services', 'Liquid Detergent - Laundry', 'লিকুইড ডিটারজেন্ট - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0003-000000000000', 'Detergent Bars', 'কাপড় কাচার সাবান', 'cleaning-household-laundry-detergent-bars', '🧹', 'cleaning_services', 'Detergent Bars - Laundry', 'কাপড় কাচার সাবান - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0004-000000000000', 'Fabric Softener', 'ফ্যাব্রিক সফটনার', 'cleaning-household-laundry-fabric-softener', '🧹', 'cleaning_services', 'Fabric Softener - Laundry', 'ফ্যাব্রিক সফটনার - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0005-000000000000', 'Stain Remover', 'দাগ দূরকারক', 'cleaning-household-laundry-stain-remover', '🧹', 'cleaning_services', 'Stain Remover - Laundry', 'দাগ দূরকারক - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0006-000000000000', 'Bleach', 'ব্লিচিং পাউডার', 'cleaning-household-laundry-bleach', '🧹', 'cleaning_services', 'Bleach - Laundry', 'ব্লিচিং পাউডার - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0002-0007-000000000000', 'Cloth Pegs & Clips', 'কাপড়ের ক্লিপ ও পিন', 'cleaning-household-laundry-cloth-pegs-clips', '🧹', 'cleaning_services', 'Cloth Pegs & Clips - Laundry', 'কাপড়ের ক্লিপ ও পিন - লন্ড্রি ও কাপড় ধোয়া', 'c2000000-0006-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 7, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0003-0001-000000000000', 'Toilet Cleaning Liquid', 'টয়লেট লিকুইড ক্লিনার', 'cleaning-household-toilet-cleaners-toilet-cleaning-liquid', '🧹', 'cleaning_services', 'Toilet Cleaning Liquid - Toilet Cleaners', 'টয়লেট লিকুইড ক্লিনার - টয়লেট ক্লিনার', 'c2000000-0006-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0003-0002-000000000000', 'Toilet Cleaning Gel', 'টয়লেট জেল', 'cleaning-household-toilet-cleaners-toilet-cleaning-gel', '🧹', 'cleaning_services', 'Toilet Cleaning Gel - Toilet Cleaners', 'টয়লেট জেল - টয়লেট ক্লিনার', 'c2000000-0006-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0003-0003-000000000000', 'Toilet Blocks', 'ফ্লাশ ব্লক', 'cleaning-household-toilet-cleaners-toilet-blocks', '🧹', 'cleaning_services', 'Toilet Blocks - Toilet Cleaners', 'ফ্লাশ ব্লক - টয়লেট ক্লিনার', 'c2000000-0006-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0003-0004-000000000000', 'Bathroom Cleaner', 'বাথরুম ক্লিনার', 'cleaning-household-toilet-cleaners-bathroom-cleaner', '🧹', 'cleaning_services', 'Bathroom Cleaner - Toilet Cleaners', 'বাথরুম ক্লিনার - টয়লেট ক্লিনার', 'c2000000-0006-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0003-0005-000000000000', 'Drain Cleaner', 'ড্রেন ক্লিনার', 'cleaning-household-toilet-cleaners-drain-cleaner', '🧹', 'cleaning_services', 'Drain Cleaner - Toilet Cleaners', 'ড্রেন ক্লিনার - টয়লেট ক্লিনার', 'c2000000-0006-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0001-000000000000', 'Facial Tissue', 'ফেসিয়াল টিস্যু', 'cleaning-household-napkins-paper-products-facial-tissue', '🧹', 'cleaning_services', 'Facial Tissue - Napkins & Paper Products', 'ফেসিয়াল টিস্যু - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0002-000000000000', 'Toilet Tissue', 'টয়লেট টিস্যু রোল', 'cleaning-household-napkins-paper-products-toilet-tissue', '🧹', 'cleaning_services', 'Toilet Tissue - Napkins & Paper Products', 'টয়লেট টিস্যু রোল - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0003-000000000000', 'Kitchen Paper Towels', 'কিচেন পেপার টাওয়েল', 'cleaning-household-napkins-paper-products-kitchen-paper-towels', '🧹', 'cleaning_services', 'Kitchen Paper Towels - Napkins & Paper Products', 'কিচেন পেপার টাওয়েল - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0004-000000000000', 'Paper Napkins', 'পেপার ন্যাপকিন', 'cleaning-household-napkins-paper-products-paper-napkins', '🧹', 'cleaning_services', 'Paper Napkins - Napkins & Paper Products', 'পেপার ন্যাপকিন - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0005-000000000000', 'Wet Wipes', 'ওয়েট ওয়াইপস', 'cleaning-household-napkins-paper-products-wet-wipes', '🧹', 'cleaning_services', 'Wet Wipes - Napkins & Paper Products', 'ওয়েট ওয়াইপস - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0004-0006-000000000000', 'Hand Towels', 'হ্যান্ড টাওয়েল', 'cleaning-household-napkins-paper-products-hand-towels', '🧹', 'cleaning_services', 'Hand Towels - Napkins & Paper Products', 'হ্যান্ড টাওয়েল - ন্যাপকিন ও পেপার সামগ্রী', 'c2000000-0006-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0001-000000000000', 'Mosquito Aerosol', 'মশার অ্যারোসল / স্প্রে', 'cleaning-household-pest-control-mosquito-aerosol', '🧹', 'cleaning_services', 'Mosquito Aerosol - Pest Control', 'মশার অ্যারোসল / স্প্রে - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0002-000000000000', 'Mosquito Coils', 'মশার কয়েল', 'cleaning-household-pest-control-mosquito-coils', '🧹', 'cleaning_services', 'Mosquito Coils - Pest Control', 'মশার কয়েল - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0003-000000000000', 'Liquid Vaporizer & Refill', 'লিকুইড ভ্যাপোরাইজার ও রিফিল', 'cleaning-household-pest-control-liquid-vaporizer-refill', '🧹', 'cleaning_services', 'Liquid Vaporizer & Refill - Pest Control', 'লিকুইড ভ্যাপোরাইজার ও রিফিল - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0004-000000000000', 'Cockroach & Ant Killer', 'তেলাপোকা ও পিঁপড়া মারার স্প্রে', 'cleaning-household-pest-control-cockroach-ant-killer', '🧹', 'cleaning_services', 'Cockroach & Ant Killer - Pest Control', 'তেলাপোকা ও পিঁপড়া মারার স্প্রে - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0005-000000000000', 'Rat Killer', 'ইঁদুর মারার বিষ / ফাঁদ', 'cleaning-household-pest-control-rat-killer', '🧹', 'cleaning_services', 'Rat Killer - Pest Control', 'ইঁদুর মারার বিষ / ফাঁদ - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0005-0006-000000000000', 'Insect Repellent Chalk', 'কীটনাশক চক ও পাউডার', 'cleaning-household-pest-control-insect-repellent-chalk', '🧹', 'cleaning_services', 'Insect Repellent Chalk - Pest Control', 'কীটনাশক চক ও পাউডার - মশা ও কীটনাশক', 'c2000000-0006-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0001-000000000000', 'Floor Cleaner', 'ফ্লোর ক্লিনার', 'cleaning-household-floor-glass-cleaners-floor-cleaner', '🧹', 'cleaning_services', 'Floor Cleaner - Floor & Glass Cleaners', 'ফ্লোর ক্লিনার - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0002-000000000000', 'Glass Cleaner', 'গ্লাস ক্লিনার', 'cleaning-household-floor-glass-cleaners-glass-cleaner', '🧹', 'cleaning_services', 'Glass Cleaner - Floor & Glass Cleaners', 'গ্লাস ক্লিনার - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0003-000000000000', 'Multi-Purpose Cleaner', 'মাল্টি-পারপাস ক্লিনার', 'cleaning-household-floor-glass-cleaners-multi-purpose-cleaner', '🧹', 'cleaning_services', 'Multi-Purpose Cleaner - Floor & Glass Cleaners', 'মাল্টি-পারপাস ক্লিনার - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0004-000000000000', 'Disinfectant Spray', 'জীবাণুনাশক স্প্রে ও ফিনাইল', 'cleaning-household-floor-glass-cleaners-disinfectant-spray', '🧹', 'cleaning_services', 'Disinfectant Spray - Floor & Glass Cleaners', 'জীবাণুনাশক স্প্রে ও ফিনাইল - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0005-000000000000', 'Kitchen Degreaser', 'কিচেন ক্লিনার', 'cleaning-household-floor-glass-cleaners-kitchen-degreaser', '🧹', 'cleaning_services', 'Kitchen Degreaser - Floor & Glass Cleaners', 'কিচেন ক্লিনার - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0006-0006-000000000000', 'Furniture Polish', 'ফার্নিচার পলিশ', 'cleaning-household-floor-glass-cleaners-furniture-polish', '🧹', 'cleaning_services', 'Furniture Polish - Floor & Glass Cleaners', 'ফার্নিচার পলিশ - মেঝে ও গ্লাস ক্লিনার', 'c2000000-0006-0006-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0001-000000000000', 'Floor Mops & Wipers', 'ফ্লোর মপ ও ওয়াইপার', 'cleaning-household-cleaning-accessories-floor-mops-wipers', '🧹', 'cleaning_services', 'Floor Mops & Wipers - Cleaning Accessories', 'ফ্লোর মপ ও ওয়াইপার - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0002-000000000000', 'Brooms & Dustpans', 'ঝাড়ু ও ডাস্টপ্যান', 'cleaning-household-cleaning-accessories-brooms-dustpans', '🧹', 'cleaning_services', 'Brooms & Dustpans - Cleaning Accessories', 'ঝাড়ু ও ডাস্টপ্যান - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0003-000000000000', 'Scrubbers & Sponges', 'স্ক্রাবার ও স্পঞ্জ', 'cleaning-household-cleaning-accessories-scrubbers-sponges', '🧹', 'cleaning_services', 'Scrubbers & Sponges - Cleaning Accessories', 'স্ক্রাবার ও স্পঞ্জ - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0004-000000000000', 'Cleaning Cloths & Dusters', 'মুছার কাপড় ও ডাস্টার', 'cleaning-household-cleaning-accessories-cleaning-cloths-dusters', '🧹', 'cleaning_services', 'Cleaning Cloths & Dusters - Cleaning Accessories', 'মুছার কাপড় ও ডাস্টার - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0005-000000000000', 'Toilet Brushes', 'টয়লেট ব্রাশ', 'cleaning-household-cleaning-accessories-toilet-brushes', '🧹', 'cleaning_services', 'Toilet Brushes - Cleaning Accessories', 'টয়লেট ব্রাশ - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0007-0006-000000000000', 'Rubber Gloves', 'ক্লিনিং রাবার গ্লাভস', 'cleaning-household-cleaning-accessories-rubber-gloves', '🧹', 'cleaning_services', 'Rubber Gloves - Cleaning Accessories', 'ক্লিনিং রাবার গ্লাভস - পরিষ্কারের সরঞ্জাম', 'c2000000-0006-0007-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0001-000000000000', 'Room Spray', 'রুম স্প্রে', 'cleaning-household-air-fresheners-room-spray', '🧹', 'cleaning_services', 'Room Spray - Air Fresheners', 'রুম স্প্রে - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0002-000000000000', 'Aerosol Freshener', 'অ্যারোসল ফ্রেশনার', 'cleaning-household-air-fresheners-aerosol-freshener', '🧹', 'cleaning_services', 'Aerosol Freshener - Air Fresheners', 'অ্যারোসল ফ্রেশনার - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0003-000000000000', 'Gel Freshener', 'জেল ফ্রেশনার', 'cleaning-household-air-fresheners-gel-freshener', '🧹', 'cleaning_services', 'Gel Freshener - Air Fresheners', 'জেল ফ্রেশনার - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0004-000000000000', 'Toilet Fresheners / Odonil', 'টয়লেট ফ্রেশনার ও ওডোনিল', 'cleaning-household-air-fresheners-toilet-fresheners-odonil', '🧹', 'cleaning_services', 'Toilet Fresheners / Odonil - Air Fresheners', 'টয়লেট ফ্রেশনার ও ওডোনিল - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0005-000000000000', 'Electric Diffusers', 'ডিফিউজার ও রিফিল', 'cleaning-household-air-fresheners-electric-diffusers', '🧹', 'cleaning_services', 'Electric Diffusers - Air Fresheners', 'ডিফিউজার ও রিফিল - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0008-0006-000000000000', 'Car Freshener', 'কার ফ্রেশনার', 'cleaning-household-air-fresheners-car-freshener', '🧹', 'cleaning_services', 'Car Freshener - Air Fresheners', 'কার ফ্রেশনার - এয়ার ফ্রেশনার', 'c2000000-0006-0008-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0001-000000000000', 'Garbage Bags', 'ময়লার ব্যাগ / ট্র্যাশ ব্যাগ', 'cleaning-household-disposables-trash-bags-garbage-bags', '🧹', 'cleaning_services', 'Garbage Bags - Disposables & Trash Bags', 'ময়লার ব্যাগ / ট্র্যাশ ব্যাগ - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0002-000000000000', 'Drawstring Trash Bags', 'ড্রস্ট্রিং ডাস্টবিন ব্যাগ', 'cleaning-household-disposables-trash-bags-drawstring-trash-bags', '🧹', 'cleaning_services', 'Drawstring Trash Bags - Disposables & Trash Bags', 'ড্রস্ট্রিং ডাস্টবিন ব্যাগ - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0003-000000000000', 'Aluminum Foil', 'অ্যালুমিনিয়াম ফয়েল', 'cleaning-household-disposables-trash-bags-aluminum-foil', '🧹', 'cleaning_services', 'Aluminum Foil - Disposables & Trash Bags', 'অ্যালুমিনিয়াম ফয়েল - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0004-000000000000', 'Cling Film / Food Wrap', 'ফুড র‍্যাপিং পেপার / ক্লিঙ ফিল্ম', 'cleaning-household-disposables-trash-bags-cling-film-food-wrap', '🧹', 'cleaning_services', 'Cling Film / Food Wrap - Disposables & Trash Bags', 'ফুড র‍্যাপিং পেপার / ক্লিঙ ফিল্ম - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0005-000000000000', 'Disposable Gloves', 'ডিসপোজেবল গ্লাভস', 'cleaning-household-disposables-trash-bags-disposable-gloves', '🧹', 'cleaning_services', 'Disposable Gloves - Disposables & Trash Bags', 'ডিসপোজেবল গ্লাভস - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0009-0006-000000000000', 'Disposable Food Boxes', 'ডিসপোজেবল বক্স', 'cleaning-household-disposables-trash-bags-disposable-food-boxes', '🧹', 'cleaning_services', 'Disposable Food Boxes - Disposables & Trash Bags', 'ডিসপোজেবল বক্স - ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'c2000000-0006-0009-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0001-000000000000', 'Black Shoe Polish', 'কালো জুতার পলিশ', 'cleaning-household-shoe-care-black-shoe-polish', '🧹', 'cleaning_services', 'Black Shoe Polish - Shoe Care', 'কালো জুতার পলিশ - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0002-000000000000', 'Brown Shoe Polish', 'বাদামী জুতার পলিশ', 'cleaning-household-shoe-care-brown-shoe-polish', '🧹', 'cleaning_services', 'Brown Shoe Polish - Shoe Care', 'বাদামী জুতার পলিশ - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0003-000000000000', 'Shoe Shiner Sponge', 'ইনস্ট্যান্ট জুতার শাইনার', 'cleaning-household-shoe-care-shoe-shiner-sponge', '🧹', 'cleaning_services', 'Shoe Shiner Sponge - Shoe Care', 'ইনস্ট্যান্ট জুতার শাইনার - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0004-000000000000', 'Liquid Shoe Polish', 'লিকুইড শু পলিশ', 'cleaning-household-shoe-care-liquid-shoe-polish', '🧹', 'cleaning_services', 'Liquid Shoe Polish - Shoe Care', 'লিকুইড শু পলিশ - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0005-000000000000', 'Shoe Brush', 'জুতার ব্রাশ', 'cleaning-household-shoe-care-shoe-brush', '🧹', 'cleaning_services', 'Shoe Brush - Shoe Care', 'জুতার ব্রাশ - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0010-0006-000000000000', 'Shoe Cream', 'শু ক্রিম', 'cleaning-household-shoe-care-shoe-cream', '🧹', 'cleaning_services', 'Shoe Cream - Shoe Care', 'শু ক্রিম - জুতার যত্ন', 'c2000000-0006-0010-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0011-0001-000000000000', 'Pedal Trash Bins', 'প্যাডেল ডাস্টবিন', 'cleaning-household-trash-bin-basket-pedal-trash-bins', '🧹', 'cleaning_services', 'Pedal Trash Bins - Trash Bin & Basket', 'প্যাডেল ডাস্টবিন - ডাস্টবিন ও ঝুড়ি', 'c2000000-0006-0011-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0011-0002-000000000000', 'Open Waste Bins', 'ওপেন ডাস্টবিন', 'cleaning-household-trash-bin-basket-open-waste-bins', '🧹', 'cleaning_services', 'Open Waste Bins - Trash Bin & Basket', 'ওপেন ডাস্টবিন - ডাস্টবিন ও ঝুড়ি', 'c2000000-0006-0011-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0011-0003-000000000000', 'Bathroom Dustbins', 'বাথরুমের ছোট বিন', 'cleaning-household-trash-bin-basket-bathroom-dustbins', '🧹', 'cleaning_services', 'Bathroom Dustbins - Trash Bin & Basket', 'বাথরুমের ছোট বিন - ডাস্টবিন ও ঝুড়ি', 'c2000000-0006-0011-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0011-0004-000000000000', 'Laundry Baskets', 'লন্ড্রি বাস্কেট', 'cleaning-household-trash-bin-basket-laundry-baskets', '🧹', 'cleaning_services', 'Laundry Baskets - Trash Bin & Basket', 'লন্ড্রি বাস্কেট - ডাস্টবিন ও ঝুড়ি', 'c2000000-0006-0011-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0006-0011-0005-000000000000', 'Storage Baskets', 'স্টোরেজ ঝুড়ি', 'cleaning-household-trash-bin-basket-storage-baskets', '🧹', 'cleaning_services', 'Storage Baskets - Trash Bin & Basket', 'স্টোরেজ ঝুড়ি - ডাস্টবিন ও ঝুড়ি', 'c2000000-0006-0011-0000-000000000000', 'c1000000-0000-0000-0000-000000000006', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0001-000000000000', 'Ballpoint Pens', 'বলপয়েন্ট কলম', 'stationery-lifestyle-pens-writing-ballpoint-pens', '✏️', 'menu_book', 'Ballpoint Pens - Pens & Writing', 'বলপয়েন্ট কলম - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0002-000000000000', 'Gel Pens', 'জেল কলম', 'stationery-lifestyle-pens-writing-gel-pens', '✏️', 'menu_book', 'Gel Pens - Pens & Writing', 'জেল কলম - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0003-000000000000', 'Pencils', 'পেন্সিল', 'stationery-lifestyle-pens-writing-pencils', '✏️', 'menu_book', 'Pencils - Pens & Writing', 'পেন্সিল - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0004-000000000000', 'Highlighters', 'হাইলাইটার', 'stationery-lifestyle-pens-writing-highlighters', '✏️', 'menu_book', 'Highlighters - Pens & Writing', 'হাইলাইটার - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0005-000000000000', 'Permanent Markers', 'স্থায়ী মার্কার', 'stationery-lifestyle-pens-writing-permanent-markers', '✏️', 'menu_book', 'Permanent Markers - Pens & Writing', 'স্থায়ী মার্কার - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0001-0006-000000000000', 'Whiteboard Markers', 'হোয়াইটবোর্ড মার্কার', 'stationery-lifestyle-pens-writing-whiteboard-markers', '✏️', 'menu_book', 'Whiteboard Markers - Pens & Writing', 'হোয়াইটবোর্ড মার্কার - কলম ও লেখার সামগ্রী', 'c2000000-0007-0001-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0002-0001-000000000000', 'Exercise Books', 'খাতা', 'stationery-lifestyle-notebooks-paper-exercise-books', '✏️', 'menu_book', 'Exercise Books - Notebooks & Paper', 'খাতা - খাতা ও কাগজ', 'c2000000-0007-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0002-0002-000000000000', 'Spiral Notebooks', 'স্পাইরাল নোটবুক', 'stationery-lifestyle-notebooks-paper-spiral-notebooks', '✏️', 'menu_book', 'Spiral Notebooks - Notebooks & Paper', 'স্পাইরাল নোটবুক - খাতা ও কাগজ', 'c2000000-0007-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0002-0003-000000000000', 'Sticky Notes', 'স্টিকি নোট', 'stationery-lifestyle-notebooks-paper-sticky-notes', '✏️', 'menu_book', 'Sticky Notes - Notebooks & Paper', 'স্টিকি নোট - খাতা ও কাগজ', 'c2000000-0007-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0002-0004-000000000000', 'A4 Paper', 'এ৪ পেপার', 'stationery-lifestyle-notebooks-paper-a4-paper', '✏️', 'menu_book', 'A4 Paper - Notebooks & Paper', 'এ৪ পেপার - খাতা ও কাগজ', 'c2000000-0007-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0002-0005-000000000000', 'Diary & Planners', 'ডায়েরি ও প্ল্যানার', 'stationery-lifestyle-notebooks-paper-diary-planners', '✏️', 'menu_book', 'Diary & Planners - Notebooks & Paper', 'ডায়েরি ও প্ল্যানার - খাতা ও কাগজ', 'c2000000-0007-0002-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0001-000000000000', 'Staplers & Pins', 'স্ট্যাপলার ও পিন', 'stationery-lifestyle-office-supplies-staplers-pins', '✏️', 'menu_book', 'Staplers & Pins - Office Supplies', 'স্ট্যাপলার ও পিন - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0002-000000000000', 'Paper Clips', 'পেপার ক্লিপ', 'stationery-lifestyle-office-supplies-paper-clips', '✏️', 'menu_book', 'Paper Clips - Office Supplies', 'পেপার ক্লিপ - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0003-000000000000', 'Scissors & Cutters', 'কাঁচি ও কাটার', 'stationery-lifestyle-office-supplies-scissors-cutters', '✏️', 'menu_book', 'Scissors & Cutters - Office Supplies', 'কাঁচি ও কাটার - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0004-000000000000', 'Glue & Adhesive Tape', 'আঠা ও স্কচটেপ', 'stationery-lifestyle-office-supplies-glue-adhesive-tape', '✏️', 'menu_book', 'Glue & Adhesive Tape - Office Supplies', 'আঠা ও স্কচটেপ - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0005-000000000000', 'Calculators', 'ক্যালকুলেটর', 'stationery-lifestyle-office-supplies-calculators', '✏️', 'menu_book', 'Calculators - Office Supplies', 'ক্যালকুলেটর - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0003-0006-000000000000', 'Files & Folders', 'ফাইল ও ফোল্ডার', 'stationery-lifestyle-office-supplies-files-folders', '✏️', 'menu_book', 'Files & Folders - Office Supplies', 'ফাইল ও ফোল্ডার - অফিস সামগ্রী', 'c2000000-0007-0003-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 6, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0004-0001-000000000000', 'Color Pencils', 'রং পেন্সিল', 'stationery-lifestyle-art-craft-color-pencils', '✏️', 'menu_book', 'Color Pencils - Art & Craft', 'রং পেন্সিল - আর্ট ও ক্রাফট', 'c2000000-0007-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0004-0002-000000000000', 'Crayons', 'মোম রং / ক্রেয়ন', 'stationery-lifestyle-art-craft-crayons', '✏️', 'menu_book', 'Crayons - Art & Craft', 'মোম রং / ক্রেয়ন - আর্ট ও ক্রাফট', 'c2000000-0007-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0004-0003-000000000000', 'Watercolor Sets', 'জলরং সেট', 'stationery-lifestyle-art-craft-watercolor-sets', '✏️', 'menu_book', 'Watercolor Sets - Art & Craft', 'জলরং সেট - আর্ট ও ক্রাফট', 'c2000000-0007-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0004-0004-000000000000', 'Sketchbooks', 'স্কেচবুক', 'stationery-lifestyle-art-craft-sketchbooks', '✏️', 'menu_book', 'Sketchbooks - Art & Craft', 'স্কেচবুক - আর্ট ও ক্রাফট', 'c2000000-0007-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0004-0005-000000000000', 'Craft Paper', 'ক্রাফট পেপার', 'stationery-lifestyle-art-craft-craft-paper', '✏️', 'menu_book', 'Craft Paper - Art & Craft', 'ক্রাফট পেপার - আর্ট ও ক্রাফট', 'c2000000-0007-0004-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 5, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0005-0001-000000000000', 'Balloons', 'বেলুন', 'stationery-lifestyle-party-supplies-balloons', '✏️', 'menu_book', 'Balloons - Party Supplies', 'বেলুন - পার্টি সামগ্রী', 'c2000000-0007-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 1, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0005-0002-000000000000', 'Birthday Candles', 'জন্মদিনের মোমবাতি', 'stationery-lifestyle-party-supplies-birthday-candles', '✏️', 'menu_book', 'Birthday Candles - Party Supplies', 'জন্মদিনের মোমবাতি - পার্টি সামগ্রী', 'c2000000-0007-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 2, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0005-0003-000000000000', 'Party Poppers', 'পার্টি পপার', 'stationery-lifestyle-party-supplies-party-poppers', '✏️', 'menu_book', 'Party Poppers - Party Supplies', 'পার্টি পপার - পার্টি সামগ্রী', 'c2000000-0007-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 3, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0005-0004-000000000000', 'Disposable Plates & Cups', 'ডিসপোজেবল প্লেট ও কাপ', 'stationery-lifestyle-party-supplies-disposable-plates-cups', '✏️', 'menu_book', 'Disposable Plates & Cups - Party Supplies', 'ডিসপোজেবল প্লেট ও কাপ - পার্টি সামগ্রী', 'c2000000-0007-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 4, true, '[]'::jsonb);
INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)
VALUES ('c3000000-0007-0005-0005-000000000000', 'Gift Wraps & Bags', 'গিফট র‍্যাপ ও ব্যাগ', 'stationery-lifestyle-party-supplies-gift-wraps-bags', '✏️', 'menu_book', 'Gift Wraps & Bags - Party Supplies', 'গিফট র‍্যাপ ও ব্যাগ - পার্টি সামগ্রী', 'c2000000-0007-0005-0000-000000000000', 'c1000000-0000-0000-0000-000000000007', 3, 5, true, '[]'::jsonb);

-- ------------------------------------------------------------------------------------
-- 8. SEED: INITIAL PRODUCTS (1 ITEM FROM EACH OF THE 7 MAIN CATEGORIES)
-- ------------------------------------------------------------------------------------
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'dairy-eggs', 'Milk', 'Full Cream Milk', 'ফুল ক্রিম দুধ', 'Milk Vita Pure Pasteurized Liquid Milk (1L)', 'মিল্ক ভিটা খাঁটি পাস্তুরিত তরল দুধ ১ লিটার', 'Fresh, 100% pure pasteurized liquid cow milk rich in calcium and natural vitamins.', 'খাঁটি ও তাজা পাস্তুরিত তরল গরুর দুধ, ক্যালসিয়াম ও ভিটামিনে সমৃদ্ধ। প্রতিদিনের পুষ্টিতে নির্ভরযোগ্য।', 90, 95, 82, 45, '১ লিটার প্যাকেট', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'cooking-essentials', 'Cooking Oil', 'Soybean Oil', 'সয়াবিন তেল', 'Rupchanda Fortified Soybean Oil (5L)', 'রূপচাঁদা ফর্টিফাইড সয়াবিন তেল ৫ লিটার', 'Vitamin A fortified premium grade pure refined soybean cooking oil for tasty and healthy meals.', 'ভিটামিন এ সমৃদ্ধ খাঁটি পরিশোধিত সয়াবিন তেল। রান্নায় আনে সুস্বাদু স্বাদ ও সুস্থতা।', 820, 850, 780, 30, '৫ লিটার বোতল', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'snacks-beverages', 'Tea & Coffee', 'Black Tea', 'ব্ল্যাক টি / পাতা চা', 'Ispahani Mirzapore Best Leaf Tea (400g)', 'ইস্পাহানি মির্জাপুর শ্রেষ্ঠ পাতা চা ৪০০ গ্রাম', 'Selected premium tea leaves delivering rich aroma and refreshing strong liquor in every cup.', 'সেরা বাগানের তাজা পাতা চায়ের দারুণ ব্লেন্ড। কড়া লিকার ও মনমাতানো সুবাসে সেরা।', 220, 230, 195, 60, '৪০০ গ্রাম প্যাক', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'baby-care', 'Diapers', 'Medium Size', 'এম সাইজ', 'Pampers Baby Dry Pants Diaper (Medium - 48 Pcs)', 'প্যাম্পার্স বেবি ড্রাই প্যান্ট ডায়াপার (এম সাইজ ৪৮ পিস)', 'Breathable, ultra-absorbent baby pants diaper ensuring up to 12 hours of dry comfort for active babies.', '১২ ঘণ্টা পর্যন্ত শুষ্কতা নিশ্চিত করা নরম ও আরামদায়ক বেবি প্যান্ট ডায়াপার। কোমল ত্বকের জন্য সম্পূর্ণ নিরাপদ।', 1450, 1550, 1320, 20, '৪৮ পিস প্যাক', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'beauty-personal-care', 'Hair Care', 'Shampoo', 'শ্যাম্পু', 'Sunsilk Stunning Black Shine Shampoo (375ml)', 'সানসিল্ক ব্ল্যাক শাইন শ্যাম্পু ৩৭৫ মি.লি.', 'Enriched with Amla Pearl complex to nourish hair from root to tip, giving long-lasting lustrous black shine.', 'আমলা ও মুক্তার নির্যাস সমৃদ্ধ শ্যাম্পু, যা চুলকে করে তোলে গভীর থেকে নরম ও চকচকে কালো।', 380, 410, 330, 35, '৩৭৫ মি.লি. বোতল', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'cleaning-household', 'Laundry', 'Detergent Powder', 'ডিটারজেন্ট পাউডার', 'Wheel 2in1 Detergent Washing Powder (1kg)', 'হুইল টু ইন ওয়ান ওয়াশিং পাউডার ১ কেজি', 'Powerful deep-cleaning detergent powder that removes tough dirt and leaves clothes smelling fresh and floral.', 'লেবুর শক্তি ও হাজার ফুলের সুবাসে কাপড়ের জেদি ময়লা দূর করে সহজে কাপড়কে রাখে উজ্জ্বল ও সুবাসিত।', 130, 140, 112, 75, '১ কেজি প্যাকেট', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80', true, true);
INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 'stationery-lifestyle', 'Pens & Writing', 'Ballpoint Pens', 'বলপয়েন্ট কলম', 'Matador Ballpen All-Time Classic (Box of 12)', 'মেটাডোর অল-টাইম বলপয়েন্ট কলম (১২ পিস বক্স)', 'Smooth-flowing fine-point ink ballpen for comfortable, non-smudge everyday writing at school and office.', 'স্মুথ ও চমৎকার লেখার নিশ্চয়তা দেওয়া জনপ্রিয় মেটাডোর বলপেন। স্কুল, কলেজ ও অফিসের জন্য সেরা।', 60, 70, 48, 120, '১২ পিস বক্স', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80', true, true);

-- ------------------------------------------------------------------------------------
-- 9. STORAGE BUCKET CONFIGURATION (PRODUCT IMAGES)
-- ------------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public insert product images" ON storage.objects;
CREATE POLICY "Public insert product images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public update product images" ON storage.objects;
CREATE POLICY "Public update product images" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;
CREATE POLICY "Public delete product images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'product-images');

-- ====================================================================================
-- COMPLETE SUCCESS! All tables cleanly recreated, indexed, RLS opened, categories seeded,
-- and 7 sample products (one from each category) successfully inserted!
-- ====================================================================================
