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
sql += '-- TONMOY VARIETY STORE - COMPLETE MASTER DATABASE FIX\n';
sql += '-- (চিন্ময় ও তন্ময় ভ্যারাইটি স্টোর - সম্পূর্ণ ডাটাবেস ফিক্স স্ক্রিপ্ট)\n';
sql += '-- Run this script in: Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)\n';
sql += '-- ====================================================================================\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 1. EXTENSIONS & SCHEMA ALTERATIONS\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

sql += '-- Ensure all required columns exist on public.categories\n';
sql += 'ALTER TABLE public.categories\n';
sql += '  ADD COLUMN IF NOT EXISTS description TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS description_bn TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,\n';
sql += '  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,\n';
sql += '  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,\n';
sql += '  ADD COLUMN IF NOT EXISTS icon TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS icon_name TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT \'[]\'::jsonb,\n';
sql += '  ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0,\n';
sql += '  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1,\n';
sql += '  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;\n\n';

sql += '-- Ensure all required columns exist on public.products\n';
sql += 'ALTER TABLE public.products\n';
sql += '  ADD COLUMN IF NOT EXISTS child_subcategory TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS cost_price NUMERIC,\n';
sql += '  ADD COLUMN IF NOT EXISTS original_price NUMERIC,\n';
sql += '  ADD COLUMN IF NOT EXISTS category_slug TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS subcategory TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS tag TEXT,\n';
sql += '  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT \'১ কেজি\',\n';
sql += '  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,\n';
sql += '  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;\n\n';

sql += '-- Performance Indexes\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_categories_level ON public.categories(level);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_products_cat_slug ON public.products(category_slug);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_products_subcat ON public.products(subcategory);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_products_tag ON public.products(tag);\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 2. ROW LEVEL SECURITY (RLS) POLICIES FOR ADMIN & STORE MANAGEMENT\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- Open products permissions so Admin can Insert, Update, and Delete without 42501 blocks\n';
sql += 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;\n\n';
sql += 'DROP POLICY IF EXISTS "Allow public read products" ON public.products;\n';
sql += 'DROP POLICY IF EXISTS "Public read active products" ON public.products;\n';
sql += 'DROP POLICY IF EXISTS "Admins manage all products" ON public.products;\n';
sql += 'DROP POLICY IF EXISTS "Allow public insert products" ON public.products;\n';
sql += 'DROP POLICY IF EXISTS "Allow public update products" ON public.products;\n';
sql += 'DROP POLICY IF EXISTS "Allow public delete products" ON public.products;\n\n';

sql += 'CREATE POLICY "Allow public read products" ON public.products FOR SELECT TO public USING (true);\n';
sql += 'CREATE POLICY "Allow public insert products" ON public.products FOR INSERT TO public WITH CHECK (true);\n';
sql += 'CREATE POLICY "Allow public update products" ON public.products FOR UPDATE TO public USING (true) WITH CHECK (true);\n';
sql += 'CREATE POLICY "Allow public delete products" ON public.products FOR DELETE TO public USING (true);\n\n';

sql += '-- Open categories permissions\n';
sql += 'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;\n\n';
sql += 'DROP POLICY IF EXISTS "Allow anyone to read categories" ON public.categories;\n';
sql += 'DROP POLICY IF EXISTS "Public read active categories" ON public.categories;\n';
sql += 'DROP POLICY IF EXISTS "Allow anyone to insert categories" ON public.categories;\n';
sql += 'DROP POLICY IF EXISTS "Allow anyone to update categories" ON public.categories;\n';
sql += 'DROP POLICY IF EXISTS "Allow anyone to delete categories" ON public.categories;\n\n';

sql += 'CREATE POLICY "Allow anyone to read categories" ON public.categories FOR SELECT TO public USING (true);\n';
sql += 'CREATE POLICY "Allow anyone to insert categories" ON public.categories FOR INSERT TO public WITH CHECK (true);\n';
sql += 'CREATE POLICY "Allow anyone to update categories" ON public.categories FOR UPDATE TO public USING (true) WITH CHECK (true);\n';
sql += 'CREATE POLICY "Allow anyone to delete categories" ON public.categories FOR DELETE TO public USING (true);\n\n';

sql += '-- Open orders & order_items permissions so customers can order and admin can view\n';
sql += 'DO $$ BEGIN\n';
sql += '  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'orders\') THEN\n';
sql += '    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;\n';
sql += '    DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;\n';
sql += '    DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;\n';
sql += '    DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;\n';
sql += '    CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT TO public USING (true);\n';
sql += '    CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);\n';
sql += '    CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);\n';
sql += '  END IF;\n';
sql += '  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'order_items\') THEN\n';
sql += '    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;\n';
sql += '    DROP POLICY IF EXISTS "Allow public read order items" ON public.order_items;\n';
sql += '    DROP POLICY IF EXISTS "Allow public insert order items" ON public.order_items;\n';
sql += '    CREATE POLICY "Allow public read order items" ON public.order_items FOR SELECT TO public USING (true);\n';
sql += '    CREATE POLICY "Allow public insert order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);\n';
sql += '  END IF;\n';
sql += 'END $$;\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 3. LEVEL 1: INSERT / UPSERT 7 OFFICIAL MAIN CATEGORIES\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  const subsJson = JSON.stringify(mainCat.subcategories.map(s => s.name_bn || s.name));
  sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, level, sort_order, is_active, subcategories)\n`;
  sql += `VALUES (${esc(mainCat.id)}, ${esc(mainCat.name)}, ${esc(mainCat.name_bn)}, ${esc(mainCat.slug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(mainCat.description)}, ${esc(mainCat.description_bn)}, 1, ${mainIdx + 1}, true, '${subsJson}'::jsonb)\n`;
  sql += `ON CONFLICT (id) DO UPDATE SET\n`;
  sql += `  name = EXCLUDED.name,\n`;
  sql += `  name_bn = EXCLUDED.name_bn,\n`;
  sql += `  slug = EXCLUDED.slug,\n`;
  sql += `  icon = EXCLUDED.icon,\n`;
  sql += `  icon_name = EXCLUDED.icon_name,\n`;
  sql += `  description = EXCLUDED.description,\n`;
  sql += `  description_bn = EXCLUDED.description_bn,\n`;
  sql += `  level = 1,\n`;
  sql += `  sort_order = EXCLUDED.sort_order,\n`;
  sql += `  is_active = true,\n`;
  sql += `  subcategories = EXCLUDED.subcategories;\n\n`;
});

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 4. LEVEL 2: INSERT / UPSERT 48 SUBCATEGORIES\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  mainCat.subcategories.forEach((sub, subIdx) => {
    const subId = `c2000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-000000000000`;
    const subSlug = `${mainCat.slug}-${sub.slug}`;
    const itemsJson = JSON.stringify(sub.items_bn || sub.items || []);
    sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)\n`;
    sql += `VALUES (${esc(subId)}, ${esc(sub.name)}, ${esc(sub.name_bn)}, ${esc(subSlug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(sub.name + ' - ' + mainCat.name)}, ${esc((sub.name_bn || sub.name) + ' - ' + mainCat.name_bn)}, ${esc(mainCat.id)}, ${esc(mainCat.id)}, 2, ${subIdx + 1}, true, '${itemsJson}'::jsonb)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  name = EXCLUDED.name,\n`;
    sql += `  name_bn = EXCLUDED.name_bn,\n`;
    sql += `  slug = EXCLUDED.slug,\n`;
    sql += `  icon = EXCLUDED.icon,\n`;
    sql += `  icon_name = EXCLUDED.icon_name,\n`;
    sql += `  parent_id = EXCLUDED.parent_id,\n`;
    sql += `  parent_category_id = EXCLUDED.parent_category_id,\n`;
    sql += `  level = 2,\n`;
    sql += `  sort_order = EXCLUDED.sort_order,\n`;
    sql += `  is_active = true,\n`;
    sql += `  subcategories = EXCLUDED.subcategories;\n\n`;
  });
});

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 5. LEVEL 3: INSERT / UPSERT 277 CHILD CATEGORIES (Subcategory under Subcategory)\n';
sql += '-- ------------------------------------------------------------------------------------\n';

DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
  mainCat.subcategories.forEach((sub, subIdx) => {
    const subId = `c2000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-000000000000`;
    if (sub.items && sub.items.length > 0) {
      sub.items.forEach((item, itemIdx) => {
        const itemBn = sub.items_bn?.[itemIdx] || item;
        const itemSlug = `${mainCat.slug}-${sub.slug}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const itemId = `c3000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-${String(itemIdx + 1).padStart(4, '0')}0000`;
        sql += `INSERT INTO public.categories (id, name, name_bn, slug, icon, icon_name, description, description_bn, parent_id, parent_category_id, level, sort_order, is_active, subcategories)\n`;
        sql += `VALUES (${esc(itemId)}, ${esc(item)}, ${esc(itemBn)}, ${esc(itemSlug)}, ${esc(mainCat.icon)}, ${esc(mainCat.icon_name)}, ${esc(item + ' - ' + sub.name)}, ${esc(itemBn + ' - ' + (sub.name_bn || sub.name))}, ${esc(subId)}, ${esc(mainCat.id)}, 3, ${itemIdx + 1}, true, '[]'::jsonb)\n`;
        sql += `ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  name = EXCLUDED.name,\n`;
        sql += `  name_bn = EXCLUDED.name_bn,\n`;
        sql += `  slug = EXCLUDED.slug,\n`;
        sql += `  parent_id = EXCLUDED.parent_id,\n`;
        sql += `  parent_category_id = EXCLUDED.parent_category_id,\n`;
        sql += `  level = 3,\n`;
        sql += `  sort_order = EXCLUDED.sort_order,\n`;
        sql += `  is_active = true;\n\n`;
      });
    }
  });
});

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 6. MIGRATE EXISTING PRODUCTS TO OFFICIAL 7 CATEGORIES\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- Cooking Essentials\n';
sql += 'UPDATE public.products\n';
sql += 'SET category_slug = \'cooking-essentials\', category_id = \'c1000000-0000-0000-0000-000000000002\'\n';
sql += 'WHERE category_slug IN (\'rice-dal\', \'edible-oil\', \'spices\', \'flour\', \'essentials\');\n\n';

sql += '-- Snacks & Beverages\n';
sql += 'UPDATE public.products\n';
sql += 'SET category_slug = \'snacks-beverages\', category_id = \'c1000000-0000-0000-0000-000000000003\'\n';
sql += 'WHERE category_slug IN (\'snacks-tea\', \'tea-coffee\');\n\n';

sql += '-- Cleaning & Household\n';
sql += 'UPDATE public.products\n';
sql += 'SET category_slug = \'cleaning-household\', category_id = \'c1000000-0000-0000-0000-000000000006\'\n';
sql += 'WHERE category_slug IN (\'soap-cleaning\', \'cleaning\', \'cleaning-supplies\');\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- 7. STORAGE BUCKET FOR PRODUCT IMAGE UPLOADS\n';
sql += '-- ------------------------------------------------------------------------------------\n';
sql += 'INSERT INTO storage.buckets (id, name, public)\n';
sql += 'VALUES (\'product-images\', \'product-images\', true)\n';
sql += 'ON CONFLICT (id) DO UPDATE SET public = true;\n\n';

sql += 'DROP POLICY IF EXISTS "Public read product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public read product images"\n';
sql += 'ON storage.objects FOR SELECT TO public\n';
sql += 'USING (bucket_id = \'product-images\');\n\n';

sql += 'DROP POLICY IF EXISTS "Public insert product images" ON storage.objects;\n';
sql += 'CREATE POLICY "Public insert product images"\n';
sql += 'ON storage.objects FOR INSERT TO public\n';
sql += 'WITH CHECK (bucket_id = \'product-images\');\n\n';

sql += '-- ------------------------------------------------------------------------------------\n';
sql += '-- COMPLETE! All tables, policies, columns, and 3-level categories are now active!\n';
sql += '-- ====================================================================================\n';

const outPath = path.join(__dirname, '../supabase/fix_all_database_issues.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('SUCCESS! Generated fix_all_database_issues.sql at:', outPath, 'size:', sql.length, 'bytes');
