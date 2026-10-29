import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CATEGORIES } from '../src/data/categories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = '';
sql += '-- ====================================================================================\n';
sql += '-- TONMOY VARIETY STORE - COMPLETE CLEAN REBUILD & SEED SCRIPT\n';
sql += '-- (চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর - সম্পূর্ণ ক্লিন রিবিল্ড ও সিড স্ক্রিপ্ট)\n';
sql += '-- Run this script in: Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)\n';
sql += '-- WARNING: This script drops and recreates tables with exact schema, RLS, categories & seed products.\n';
sql += '-- ====================================================================================\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 1. EXTENSIONS & SAFE TABLE CLEANUP (DROP OLD TABLES)\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

sql += 'DROP TABLE IF EXISTS public.inventory_transactions CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.order_items CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.orders CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.cart_items CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.products CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.categories CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.profiles CASCADE;\n';
sql += 'DROP TABLE IF EXISTS public.shop_settings CASCADE;\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 2. FRESH TABLE DEFINITIONS\n';
sql += '-- ------------------------------------------------------------------------------------\n';

sql += '-- PROFILES TABLE\n';
sql += 'CREATE TABLE public.profiles (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  full_name TEXT,\n';
sql += '  full_name_bn TEXT,\n';
sql += '  phone TEXT,\n';
sql += '  role TEXT NOT NULL DEFAULT \'customer\',\n';
sql += '  address TEXT,\n';
sql += '  area TEXT DEFAULT \'নারুয়ামালা\',\n';
sql += '  avatar_url TEXT,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n';
sql += '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- CATEGORIES TABLE (3-Tier Standardized Hierarchy)\n';
sql += 'CREATE TABLE public.categories (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  name TEXT NOT NULL,\n';
sql += '  name_bn TEXT NOT NULL,\n';
sql += '  slug TEXT NOT NULL UNIQUE,\n';
sql += '  icon TEXT,\n';
sql += '  icon_name TEXT,\n';
sql += '  description TEXT,\n';
sql += '  description_bn TEXT,\n';
sql += '  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,\n';
sql += '  parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,\n';
sql += '  level INTEGER NOT NULL DEFAULT 1,\n';
sql += '  sort_order INTEGER NOT NULL DEFAULT 1,\n';
sql += '  is_active BOOLEAN NOT NULL DEFAULT true,\n';
sql += '  subcategories JSONB NOT NULL DEFAULT \'[]\'::jsonb,\n';
sql += '  item_count INTEGER NOT NULL DEFAULT 0,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n';
sql += '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- PRODUCTS TABLE\n';
sql += 'CREATE TABLE public.products (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,\n';
sql += '  category_slug TEXT,\n';
sql += '  subcategory TEXT,\n';
sql += '  child_subcategory TEXT,\n';
sql += '  name TEXT NOT NULL,\n';
sql += '  name_bn TEXT NOT NULL,\n';
sql += '  description TEXT,\n';
sql += '  description_bn TEXT,\n';
sql += '  price NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  original_price NUMERIC,\n';
sql += '  cost_price NUMERIC,\n';
sql += '  stock_quantity INTEGER NOT NULL DEFAULT 50,\n';
sql += '  unit TEXT NOT NULL DEFAULT \'১ কেজি\',\n';
sql += '  tag TEXT,\n';
sql += '  image_url TEXT NOT NULL DEFAULT \'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80\',\n';
sql += '  is_active BOOLEAN NOT NULL DEFAULT true,\n';
sql += '  is_featured BOOLEAN NOT NULL DEFAULT false,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n';
sql += '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- ORDERS TABLE\n';
sql += 'CREATE TABLE public.orders (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  order_number TEXT UNIQUE NOT NULL,\n';
sql += '  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,\n';
sql += '  full_name TEXT,\n';
sql += '  customer_name TEXT,\n';
sql += '  phone TEXT,\n';
sql += '  customer_phone TEXT,\n';
sql += '  alternate_phone TEXT DEFAULT \'\',\n';
sql += '  shipping_address TEXT,\n';
sql += '  customer_address TEXT,\n';
sql += '  delivery_address TEXT,\n';
sql += '  area TEXT DEFAULT \'নারুয়ামালা হাট, বগুড়া\',\n';
sql += '  delivery_method TEXT NOT NULL DEFAULT \'home_delivery\',\n';
sql += '  fulfillment_type TEXT DEFAULT \'delivery\',\n';
sql += '  payment_method TEXT NOT NULL DEFAULT \'cash_on_delivery\',\n';
sql += '  payment_status TEXT NOT NULL DEFAULT \'pending\',\n';
sql += '  status TEXT NOT NULL DEFAULT \'pending\',\n';
sql += '  order_status TEXT NOT NULL DEFAULT \'pending\',\n';
sql += '  subtotal NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  delivery_fee NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  discount NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  discount_amount NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  total NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  total_amount NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  notes TEXT,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n';
sql += '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- ORDER ITEMS TABLE\n';
sql += 'CREATE TABLE public.order_items (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,\n';
sql += '  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,\n';
sql += '  product_name TEXT NOT NULL,\n';
sql += '  product_name_bn TEXT NOT NULL DEFAULT \'\',\n';
sql += '  unit TEXT DEFAULT \'পিস\',\n';
sql += '  unit_price NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  price NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  quantity INTEGER NOT NULL DEFAULT 1,\n';
sql += '  line_total NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  total_price NUMERIC NOT NULL DEFAULT 0,\n';
sql += '  image_url TEXT DEFAULT \'\',\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- INVENTORY TRANSACTIONS TABLE\n';
sql += 'CREATE TABLE public.inventory_transactions (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,\n';
sql += '  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,\n';
sql += '  type TEXT NOT NULL,\n';
sql += '  quantity INTEGER NOT NULL,\n';
sql += '  previous_stock INTEGER NOT NULL,\n';
sql += '  new_stock INTEGER NOT NULL,\n';
sql += '  notes TEXT,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- CART ITEMS TABLE\n';
sql += 'CREATE TABLE public.cart_items (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,\n';
sql += '  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,\n';
sql += '  quantity INTEGER NOT NULL DEFAULT 1,\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- SHOP SETTINGS TABLE\n';
sql += 'CREATE TABLE public.shop_settings (\n';
sql += '  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),\n';
sql += '  shop_name TEXT NOT NULL DEFAULT \'Tonmoy Variety Store\',\n';
sql += '  shop_name_bn TEXT NOT NULL DEFAULT \'চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর\',\n';
sql += '  currency TEXT NOT NULL DEFAULT \'BDT\',\n';
sql += '  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 50 CHECK (delivery_fee >= 0),\n';
sql += '  free_delivery_threshold NUMERIC(12,2) DEFAULT 500,\n';
sql += '  pickup_enabled BOOLEAN NOT NULL DEFAULT true,\n';
sql += '  delivery_enabled BOOLEAN NOT NULL DEFAULT true,\n';
sql += '  contact_phone TEXT DEFAULT \'01717-999460\',\n';
sql += '  address TEXT DEFAULT \'নারুয়ামালা হাট, গাবতলী, বগুড়া\',\n';
sql += '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n';
sql += '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n';
sql += ');\n\n';

sql += '-- Default Shop Settings Row\n';
sql += 'INSERT INTO public.shop_settings (\n';
sql += '  id, shop_name, shop_name_bn, currency, delivery_fee, free_delivery_threshold, pickup_enabled, delivery_enabled, contact_phone, address\n';
sql += ') VALUES (\n';
sql += '  1, \'Tonmoy Variety Store\', \'চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর\', \'BDT\', 50, 500, true, true, \'01717-999460\', \'নারুয়ামালা হাট, গাবতলী, বগুড়া\'\n';
sql += ') ON CONFLICT (id) DO UPDATE SET\n';
sql += '  shop_name = EXCLUDED.shop_name,\n';
sql += '  shop_name_bn = EXCLUDED.shop_name_bn;\n\n';

sql += '-- INDEXES\n';
sql += 'CREATE INDEX idx_categories_parent ON public.categories(parent_id);\n';
sql += 'CREATE INDEX idx_categories_level ON public.categories(level);\n';
sql += 'CREATE INDEX idx_categories_slug ON public.categories(slug);\n';
sql += 'CREATE INDEX idx_products_cat_slug ON public.products(category_slug);\n';
sql += 'CREATE INDEX idx_products_subcat ON public.products(subcategory);\n';
sql += 'CREATE INDEX idx_products_tag ON public.products(tag);\n';
sql += 'CREATE INDEX idx_orders_phone ON public.orders(customer_phone);\n';
sql += 'CREATE INDEX idx_orders_num ON public.orders(order_number);\n';
sql += 'CREATE INDEX idx_order_items_order ON public.order_items(order_id);\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 3. ROW LEVEL SECURITY (RLS) OPEN POLICIES (NO 42501 BLOCKING)\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all categories" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all order items" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all inventory" ON public.inventory_transactions FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all cart" ON public.cart_items FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += 'ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;\n';
sql += 'CREATE POLICY "Allow public all shop_settings" ON public.shop_settings FOR ALL TO public USING (true) WITH CHECK (true);\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 4. HELPER & RPC FUNCTIONS\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'CREATE OR REPLACE FUNCTION public.is_admin()\n';
sql += 'RETURNS BOOLEAN AS $$\n';
sql += 'BEGIN\n';
sql += '  RETURN true;\n';
sql += 'END;\n';
sql += '$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;\n\n';

sql += 'CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT, p_order_id UUID DEFAULT NULL)\n';
sql += 'RETURNS VOID AS $$\n';
sql += 'DECLARE\n';
sql += '  v_current_stock INT;\n';
sql += 'BEGIN\n';
sql += '  SELECT stock_quantity INTO v_current_stock FROM public.products WHERE id = p_product_id FOR UPDATE;\n';
sql += '  IF NOT FOUND THEN\n';
sql += '    RETURN;\n';
sql += '  END IF;\n';
sql += '  UPDATE public.products SET stock_quantity = GREATEST(0, stock_quantity - p_quantity), updated_at = now() WHERE id = p_product_id;\n';
sql += '  INSERT INTO public.inventory_transactions (product_id, order_id, type, quantity, previous_stock, new_stock, notes)\n';
sql += '  VALUES (p_product_id, p_order_id, \'out\', p_quantity, v_current_stock, GREATEST(0, v_current_stock - p_quantity), \'অর্ডার বিক্রয় স্টক হ্রাস\');\n';
sql += 'END;\n';
sql += '$$ LANGUAGE plpgsql SECURITY DEFINER;\n\n';

sql += `CREATE OR REPLACE FUNCTION public.sync_order_columns()
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
\n`;

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 5. SEED: LEVEL 1 (7 MAIN CATEGORIES)\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  const subsJson = JSON.stringify(mainCat.subcategories.map(s => s.name_bn || s.name));
  sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)\n`;
  sql += `VALUES (${esc(mainCat.id)}, ${esc(mainCat.name)}, ${esc(mainCat.name_bn)}, ${esc(mainCat.slug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(mainCat.description)}, ${esc(mainCat.description_bn)}, 1, ${mainIdx + 1}, true, '${subsJson}'::jsonb);\n`;
});
sql += '\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 6. SEED: LEVEL 2 (48 SUBCATEGORIES)\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  mainCat.subcategories.forEach((sub, subIdx) => {
    const subId = `c2000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-0000-000000000000`;
    const subSlug = `${mainCat.slug}-${sub.slug}`;
    const itemsJson = JSON.stringify(sub.items_bn || sub.items || []);
    sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)\n`;
    sql += `VALUES (${esc(subId)}, ${esc(sub.name)}, ${esc(sub.name_bn)}, ${esc(subSlug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(sub.name + ' - ' + mainCat.name)}, ${esc((sub.name_bn || sub.name) + ' - ' + mainCat.name_bn)}, ${esc(mainCat.id)}, ${esc(mainCat.id)}, 2, ${subIdx + 1}, true, '${itemsJson}'::jsonb);\n`;
  });
});
sql += '\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 7. SEED: LEVEL 3 (277 CHILD CATEGORIES - SUBCATEGORY UNDER SUBCATEGORY)\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  mainCat.subcategories.forEach((sub, subIdx) => {
    const subId = `c2000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-0000-000000000000`;
    if (sub.items && sub.items.length > 0) {
      sub.items.forEach((item, itemIdx) => {
        const itemBn = sub.items_bn?.[itemIdx] || item;
        const itemSlug = `${mainCat.slug}-${sub.slug}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const itemId = `c3000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-${String(itemIdx + 1).padStart(4, '0')}-000000000000`;
        sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)\n`;
        sql += `VALUES (${esc(itemId)}, ${esc(item)}, ${esc(itemBn)}, ${esc(itemSlug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(item + ' - ' + sub.name)}, ${esc(itemBn + ' - ' + (sub.name_bn || sub.name))}, ${esc(subId)}, ${esc(mainCat.id)}, 3, ${itemIdx + 1}, true, '[]'::jsonb);\n`;
      });
    }
  });
});
sql += '\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 8. SEED: INITIAL PRODUCTS (1 ITEM FROM EACH OF THE 7 MAIN CATEGORIES)\n';
sql += '-- ------------------------------------------------------------------------------------\n';

const sampleProducts = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    category_id: 'c1000000-0000-0000-0000-000000000001',
    category_slug: 'dairy-eggs',
    subcategory: 'Milk',
    child_subcategory: 'Full Cream Milk',
    tag: 'ফুল ক্রিম দুধ',
    name: 'Milk Vita Pure Pasteurized Liquid Milk (1L)',
    name_bn: 'মিল্ক ভিটা খাঁটি পাস্তুরিত তরল দুধ ১ লিটার',
    description: 'Fresh, 100% pure pasteurized liquid cow milk rich in calcium and natural vitamins.',
    description_bn: 'খাঁটি ও তাজা পাস্তুরিত তরল গরুর দুধ, ক্যালসিয়াম ও ভিটামিনে সমৃদ্ধ। প্রতিদিনের পুষ্টিতে নির্ভরযোগ্য।',
    price: 90,
    original_price: 95,
    cost_price: 82,
    stock_quantity: 45,
    unit: '১ লিটার প্যাকেট',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    category_slug: 'cooking-essentials',
    subcategory: 'Cooking Oil',
    child_subcategory: 'Soybean Oil',
    tag: 'সয়াবিন তেল',
    name: 'Rupchanda Fortified Soybean Oil (5L)',
    name_bn: 'রূপচাঁদা ফর্টিফাইড সয়াবিন তেল ৫ লিটার',
    description: 'Vitamin A fortified premium grade pure refined soybean cooking oil for tasty and healthy meals.',
    description_bn: 'ভিটামিন এ সমৃদ্ধ খাঁটি পরিশোধিত সয়াবিন তেল। রান্নায় আনে সুস্বাদু স্বাদ ও সুস্থতা।',
    price: 820,
    original_price: 850,
    cost_price: 780,
    stock_quantity: 30,
    unit: '৫ লিটার বোতল',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    category_id: 'c1000000-0000-0000-0000-000000000003',
    category_slug: 'snacks-beverages',
    subcategory: 'Tea & Coffee',
    child_subcategory: 'Black Tea',
    tag: 'ব্ল্যাক টি / পাতা চা',
    name: 'Ispahani Mirzapore Best Leaf Tea (400g)',
    name_bn: 'ইস্পাহানি মির্জাপুর শ্রেষ্ঠ পাতা চা ৪০০ গ্রাম',
    description: 'Selected premium tea leaves delivering rich aroma and refreshing strong liquor in every cup.',
    description_bn: 'সেরা বাগানের তাজা পাতা চায়ের দারুণ ব্লেন্ড। কড়া লিকার ও মনমাতানো সুবাসে সেরা।',
    price: 220,
    original_price: 230,
    cost_price: 195,
    stock_quantity: 60,
    unit: '৪০০ গ্রাম প্যাক',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    category_id: 'c1000000-0000-0000-0000-000000000004',
    category_slug: 'baby-care',
    subcategory: 'Diapers',
    child_subcategory: 'Medium Size',
    tag: 'এম সাইজ',
    name: 'Pampers Baby Dry Pants Diaper (Medium - 48 Pcs)',
    name_bn: 'প্যাম্পার্স বেবি ড্রাই প্যান্ট ডায়াপার (এম সাইজ ৪৮ পিস)',
    description: 'Breathable, ultra-absorbent baby pants diaper ensuring up to 12 hours of dry comfort for active babies.',
    description_bn: '১২ ঘণ্টা পর্যন্ত শুষ্কতা নিশ্চিত করা নরম ও আরামদায়ক বেবি প্যান্ট ডায়াপার। কোমল ত্বকের জন্য সম্পূর্ণ নিরাপদ।',
    price: 1450,
    original_price: 1550,
    cost_price: 1320,
    stock_quantity: 20,
    unit: '৪৮ পিস প্যাক',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    category_id: 'c1000000-0000-0000-0000-000000000005',
    category_slug: 'beauty-personal-care',
    subcategory: 'Hair Care',
    child_subcategory: 'Shampoo',
    tag: 'শ্যাম্পু',
    name: 'Sunsilk Stunning Black Shine Shampoo (375ml)',
    name_bn: 'সানসিল্ক ব্ল্যাক শাইন শ্যাম্পু ৩৭৫ মি.লি.',
    description: 'Enriched with Amla Pearl complex to nourish hair from root to tip, giving long-lasting lustrous black shine.',
    description_bn: 'আমলা ও মুক্তার নির্যাস সমৃদ্ধ শ্যাম্পু, যা চুলকে করে তোলে গভীর থেকে নরম ও চকচকে কালো।',
    price: 380,
    original_price: 410,
    cost_price: 330,
    stock_quantity: 35,
    unit: '৩৭৫ মি.লি. বোতল',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000006',
    category_id: 'c1000000-0000-0000-0000-000000000006',
    category_slug: 'cleaning-household',
    subcategory: 'Laundry',
    child_subcategory: 'Detergent Powder',
    tag: 'ডিটারজেন্ট পাউডার',
    name: 'Wheel 2in1 Detergent Washing Powder (1kg)',
    name_bn: 'হুইল টু ইন ওয়ান ওয়াশিং পাউডার ১ কেজি',
    description: 'Powerful deep-cleaning detergent powder that removes tough dirt and leaves clothes smelling fresh and floral.',
    description_bn: 'লেবুর শক্তি ও হাজার ফুলের সুবাসে কাপড়ের জেদি ময়লা দূর করে সহজে কাপড়কে রাখে উজ্জ্বল ও সুবাসিত।',
    price: 130,
    original_price: 140,
    cost_price: 112,
    stock_quantity: 75,
    unit: '১ কেজি প্যাকেট',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'd1000000-0000-0000-0000-000000000007',
    category_id: 'c1000000-0000-0000-0000-000000000007',
    category_slug: 'stationery-lifestyle',
    subcategory: 'Pens & Writing',
    child_subcategory: 'Ballpoint Pens',
    tag: 'বলপয়েন্ট কলম',
    name: 'Matador Ballpen All-Time Classic (Box of 12)',
    name_bn: 'মেটাডোর অল-টাইম বলপয়েন্ট কলম (১২ পিস বক্স)',
    description: 'Smooth-flowing fine-point ink ballpen for comfortable, non-smudge everyday writing at school and office.',
    description_bn: 'স্মুথ ও চমৎকার লেখার নিশ্চয়তা দেওয়া জনপ্রিয় মেটাডোর বলপেন। স্কুল, কলেজ ও অফিসের জন্য সেরা।',
    price: 60,
    original_price: 70,
    cost_price: 48,
    stock_quantity: 120,
    unit: '১২ পিস বক্স',
    is_active: true,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80'
  }
];

sampleProducts.forEach(prod => {
  sql += `INSERT INTO public.products (id, category_id, category_slug, subcategory, child_subcategory, tag, name, name_bn, description, description_bn, price, original_price, cost_price, stock_quantity, unit, image_url, is_active, is_featured)\n`;
  sql += `VALUES (${esc(prod.id)}, ${esc(prod.category_id)}, ${esc(prod.category_slug)}, ${esc(prod.subcategory)}, ${esc(prod.child_subcategory)}, ${esc(prod.tag)}, ${esc(prod.name)}, ${esc(prod.name_bn)}, ${esc(prod.description)}, ${esc(prod.description_bn)}, ${prod.price}, ${prod.original_price}, ${prod.cost_price}, ${prod.stock_quantity}, ${esc(prod.unit)}, ${esc(prod.image_url)}, ${prod.is_active}, ${prod.is_featured});\n`;
});
sql += '\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 9. STORAGE BUCKET CONFIGURATION (PRODUCT IMAGES)\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'INSERT INTO storage.buckets (id, name, public)\n';
sql += 'VALUES (\'product-images\', \'product-images\', true)\n';
sql += 'ON CONFLICT (id) DO UPDATE SET public = true;\n\n';

sql += 'DROP POLICY IF EXISTS "Public read product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO public USING (bucket_id = \'product-images\');\n\n';

sql += 'DROP POLICY IF EXISTS "Public insert product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public insert product images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = \'product-images\');\n\n';

sql += 'DROP POLICY IF EXISTS "Public update product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public update product images" ON storage.objects FOR UPDATE TO public USING (bucket_id = \'product-images\');\n\n';

sql += 'DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public delete product images" ON storage.objects FOR DELETE TO public USING (bucket_id = \'product-images\');\n\n';

sql += '-- ====================================================================================\n';
sql += '-- COMPLETE SUCCESS! All tables cleanly recreated, indexed, RLS opened, categories seeded,\n';
sql += '-- and 7 sample products (one from each category) successfully inserted!\n';
sql += '-- ====================================================================================\n';

const outPath = path.join(__dirname, '..', 'supabase', 'clean_rebuild_database.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('SUCCESS! Generated clean_rebuild_database.sql at:', outPath, 'size:', sql.length, 'bytes');
