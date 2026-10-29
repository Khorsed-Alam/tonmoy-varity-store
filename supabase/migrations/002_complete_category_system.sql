-- Complete Category & Subcategory System Migration (Chaldal Style)
-- Level 1: Main Category, Level 2: Subcategory, Level 3: Detailed Subcategory

-- 1. Ensure required columns exist on public.categories and public.products
alter table public.categories 
  add column if not exists parent_category_id uuid references public.categories(id) on delete cascade,
  add column if not exists parent_id uuid references public.categories(id) on delete cascade,
  add column if not exists level integer not null default 1,
  add column if not exists icon text,
  add column if not exists icon_name text,
  add column if not exists subcategories jsonb default '[]'::jsonb,
  add column if not exists item_count integer default 0;

alter table public.products
  add column if not exists child_subcategory text;

-- Useful indexes
create index if not exists categories_parent_idx on public.categories(parent_category_id);
create index if not exists categories_level_idx on public.categories(level);
create index if not exists categories_slug_idx on public.categories(slug);

-- 2. Open RLS for reading categories
alter table public.categories enable row level security;

drop policy if exists "Public read active categories" on public.categories;
drop policy if exists "Allow anyone to read categories" on public.categories;
create policy "Allow anyone to read categories"
on public.categories for select
to public
using (true);

drop policy if exists "Allow anyone to insert categories" on public.categories;
create policy "Allow anyone to insert categories"
on public.categories for insert
to public
with check (true);

drop policy if exists "Allow anyone to update categories" on public.categories;
create policy "Allow anyone to update categories"
on public.categories for update
to public
using (true)
with check (true);

-- 3. Idempotent Upsert for the 7 Main Categories (Level 1)
insert into public.categories (id, name, name_bn, slug, icon, icon_name, description_bn, level, sort_order, is_active)
values
  ('c1000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'দুধ ও ডিম', 'dairy-eggs', '🥛', 'egg_alt', 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম', 1, 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Cooking Essentials', 'রান্নার সামগ্রী', 'cooking-essentials', '🌾', 'restaurant', 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি', 1, 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Snacks & Beverages', 'নাস্তা ও পানীয়', 'snacks-beverages', '🍪', 'fastfood', 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়', 1, 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Baby Care', 'শিশুর যত্ন', 'baby-care', '👶', 'child_care', 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন', 1, 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Beauty & Personal Care', 'সৌন্দর্য ও ব্যক্তিগত যত্ন', 'beauty-personal-care', '💄', 'face', 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন', 1, 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Cleaning & Household', 'গৃহস্থালি ও পরিষ্কার-পরিচ্ছন্নতা', 'cleaning-household', '🧹', 'cleaning_services', 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ', 1, 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Stationery & Lifestyle', 'স্টেশনারি ও লাইফস্টাইল', 'stationery-lifestyle', '✏️', 'menu_book', 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি', 1, 7, true)
on conflict (slug) do update set
  name = excluded.name,
  name_bn = excluded.name_bn,
  icon = excluded.icon,
  icon_name = excluded.icon_name,
  description_bn = excluded.description_bn,
  level = 1,
  sort_order = excluded.sort_order,
  is_active = true;

-- 4. Idempotent Upsert for Level 2 Subcategories
insert into public.categories (id, parent_category_id, name, name_bn, slug, icon, level, sort_order, is_active, subcategories)
values
  -- Dairy & Eggs (c1000000-0000-0000-0000-000000000001)
  ('c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Milk', 'দুধ', 'dairy-eggs-milk', '🥛', 2, 1, true, '["ফুল ক্রিম দুধ", "লো-ফ্যাট দুধ", "ইউএইচটি দুধ", "গুঁড়ো দুধ", "ফ্লেভার্ড মিল্ক", "কনডেন্সড মিল্ক"]'::jsonb),
  ('c2000000-0001-0002-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Yogurt', 'দই', 'dairy-eggs-yogurt', '🥛', 2, 2, true, '["টক দই", "মিষ্টি দই", "গ্রিক ইয়োগার্ট", "ফ্লেভার্ড দই"]'::jsonb),
  ('c2000000-0001-0003-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Butter & Ghee', 'মাখন ও ঘি', 'dairy-eggs-butter-ghee', '🥛', 2, 3, true, '["সল্টেড বাটার", "আনসল্টেড বাটার", "গাওয়া ঘি", "খাঁটি ঘি"]'::jsonb),
  ('c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Cheese', 'পনির ও চিজ', 'dairy-eggs-cheese', '🥛', 2, 4, true, '["স্লাইসড চিজ", "চিজ ব্লক", "চিজ স্প্রেড", "মোজারেলা চিজ", "প্রসেসড চিজ"]'::jsonb),
  ('c2000000-0001-0005-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Cream', 'ক্রিম', 'dairy-eggs-cream', '🥛', 2, 5, true, '["ফ্রেশ ক্রিম", "হুইপিং ক্রিম", "কুকিং ক্রিম"]'::jsonb),
  ('c2000000-0001-0006-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Eggs', 'ডিম', 'dairy-eggs-eggs', '🥚', 2, 6, true, '["মুরগির ডিম", "হাঁসের ডিম", "কোয়েলের ডিম"]'::jsonb),

  -- Cooking Essentials (c1000000-0000-0000-0000-000000000002)
  ('c2000000-0002-0001-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Rice', 'চাল', 'cooking-essentials-rice', '🌾', 2, 1, true, '["মিনিকেট চাল", "নাজিরশাইল চাল", "বাসমতী চাল", "ব্রাউন রাইস / লাল চাল", "সিদ্ধ চাল", "সুগন্ধি পোলাও চাল"]'::jsonb),
  ('c2000000-0002-0002-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Lentils & Pulses', 'ডাল ও ডালজাতীয়', 'cooking-essentials-lentils-pulses', '🌾', 2, 2, true, '["মসুর ডাল", "মুগ ডাল", "ছোলার ডাল", "মাষকলাই ডাল", "ছোলা বুট", "মটর ডাল"]'::jsonb),
  ('c2000000-0002-0003-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Flour', 'আটা ও ময়দা', 'cooking-essentials-flour', '🌾', 2, 3, true, '["আটা", "ময়দা", "লাল আটা", "চালের গুঁড়া", "বেসন", "সুজি"]'::jsonb),
  ('c2000000-0002-0004-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Cooking Oil', 'ভোজ্য তেল', 'cooking-essentials-cooking-oil', '🌾', 2, 4, true, '["সয়াবিন তেল", "সরিষার তেল", "সূর্যমুখী তেল", "অলিভ অয়েল", "রাইস ব্রান অয়েল", "নারিকেল তেল"]'::jsonb),
  ('c2000000-0002-0005-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Salt & Sugar', 'লবণ ও চিনি', 'cooking-essentials-salt-sugar', '🌾', 2, 5, true, '["আয়োডিনযুক্ত লবণ", "সৈন্ধব লবণ", "সাদা চিনি", "লাল চিনি / দেশি চিনি", "আইসিং সুগার", "জিরোক্যাল / সুগার সাবস্টিটিউট"]'::jsonb),
  ('c2000000-0002-0006-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Spices', 'মসলাপাতি', 'cooking-essentials-spices', '🌾', 2, 6, true, '["হলুদ গুঁড়া", "মরিচ গুঁড়া", "ধনিয়া গুঁড়া", "জিরা গুঁড়া", "গরম মসলা", "আস্ত মসলা", "রেডি স্পাইস মিক্স"]'::jsonb),
  ('c2000000-0002-0007-000000000000', 'c1000000-0000-0000-0000-000000000002', 'Sauces & Condiments', 'সস ও আচার', 'cooking-essentials-sauces-condiments', '🌾', 2, 7, true, '["টমেটো সস", "সয়া সস", "চিলি সস", "মেয়োনিজ", "কাসুন্দি ও মাস্টার্ড", "সিরকা / ভিনেগার", "আচার", "চাটনি"]'::jsonb),

  -- Snacks & Beverages (c1000000-0000-0000-0000-000000000003)
  ('c2000000-0003-0001-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Chips & Savory Snacks', 'চিপস ও নোনতা স্ন্যাক্স', 'snacks-beverages-chips-savory', '🍪', 2, 1, true, '["আলুর চিপস", "কর্ন চিপস", "চানাচুর", "বাদাম ও বীজ", "পপকর্ন", "ক্র্যাকার্স"]'::jsonb),
  ('c2000000-0003-0002-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Biscuits & Cookies', 'বিস্কুট ও কুকিজ', 'snacks-beverages-biscuits-cookies', '🍪', 2, 2, true, '["মিষ্টি বিস্কুট", "নোনতা বিস্কুট", "ক্রিম বিস্কুট", "কুকিজ", "ওয়েফার", "টোস্ট ও রাস্ক"]'::jsonb),
  ('c2000000-0003-0003-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Chocolates & Candy', 'চকলেট ও ক্যান্ডি', 'snacks-beverages-chocolates-candy', '🍪', 2, 3, true, '["চকলেট বার", "বক্স চকলেট", "টফি", "ললিপপ", "চুয়িংগাম", "মিন্ট"]'::jsonb),
  ('c2000000-0003-0004-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Tea & Coffee', 'চা ও কফি', 'snacks-beverages-tea-coffee', '☕', 2, 4, true, '["কালো চা", "গ্রিন টি", "টি ব্যাগ", "ইনস্ট্যান্ট কফি", "কফি বিন্স", "কফি মিক্স", "দুধ চা মিক্স"]'::jsonb),
  ('c2000000-0003-0005-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Juice', 'জুস ও পানীয়', 'snacks-beverages-juice', '🥤', 2, 5, true, '["ফলের জুস", "জুস ড্রিংকস", "ডাবের পানি", "কনসেনট্রেটেড জুস"]'::jsonb),
  ('c2000000-0003-0006-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Soft Drinks', 'কোমল পানীয়', 'snacks-beverages-soft-drinks', '🥤', 2, 6, true, '["কোলা", "লেমন-লাইম ড্রিংক", "অরেঞ্জ ড্রিংক", "সোডা ওয়াটার", "এনার্জি ড্রিংক", "মল্ট ড্রিংক"]'::jsonb),
  ('c2000000-0003-0007-000000000000', 'c1000000-0000-0000-0000-000000000003', 'Water', 'খাবার পানি', 'snacks-beverages-water', '💧', 2, 7, true, '["মিনারেল ওয়াটার", "বিশুদ্ধ খাবার পানি", "স্পার্কলিং ওয়াটার", "জার পানি"]'::jsonb),

  -- Baby Care (c1000000-0000-0000-0000-000000000004)
  ('c2000000-0004-0001-000000000000', 'c1000000-0000-0000-0000-000000000004', 'Diapers', 'ডায়াপার', 'baby-care-diapers', '👶', 2, 1, true, '["নবজাতকের ডায়াপার", "ছোট সাইজ (S)", "মাঝারি সাইজ (M)", "বড় সাইজ (L)", "এক্সট্রা লার্জ (XL)", "প্যান্ট স্টাইল ডায়াপার", "কাপড়ের ডায়াপার"]'::jsonb),
  ('c2000000-0004-0002-000000000000', 'c1000000-0000-0000-0000-000000000004', 'Baby Wipes', 'বেবি ওয়াইপস', 'baby-care-wipes', '👶', 2, 2, true, '["সংবেদনশীল ত্বকের ওয়াইপস", "সুগন্ধিমুক্ত ওয়াইপস", "ওয়াটার বেসড ওয়াইপস", "ট্রাভেল প্যাক ওয়াইপস"]'::jsonb),
  ('c2000000-0004-0003-000000000000', 'c1000000-0000-0000-0000-000000000004', 'Baby Food & Formula', 'শিশুর খাবার ও ফর্মুলা', 'baby-care-food-formula', '👶', 2, 3, true, '["ইনফ্যান্ট ফর্মুলা", "ফলো-অন ফর্মুলা", "গ্রোয়িং-আপ মিল্ক", "বেবি সিরিয়াল", "বেবি পিউরি", "বেবি স্ন্যাক্স", "ফুড পাউচ"]'::jsonb),
  ('c2000000-0004-0004-000000000000', 'c1000000-0000-0000-0000-000000000004', 'Baby Bath & Skin Care', 'গোসল ও ত্বকের যত্ন', 'baby-care-bath-skin-care', '👶', 2, 4, true, '["বেবি শ্যাম্পু", "বেবি বডি ওয়াশ", "বেবি লোশন", "বেবি অয়েল", "র‍্যাশ ক্রিম", "বেবি পাউডার", "বেবি সাবান"]'::jsonb),
  ('c2000000-0004-0005-000000000000', 'c1000000-0000-0000-0000-000000000004', 'Baby Accessories', 'শিশুর অন্যান্য অনুষঙ্গ', 'baby-care-accessories', '👶', 2, 5, true, '["ফিডিং বোতল", "নিপল ও টিট", "প্যাসিফায়ার", "বিব", "বেবি চামচ ও বাটি", "বোতল পরিষ্কারের ব্রাশ", "বেবি নেইল কাটার"]'::jsonb),

  -- Beauty & Personal Care (c1000000-0000-0000-0000-000000000005)
  ('c2000000-0005-0001-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Skin Care', 'ত্বকের যত্ন', 'beauty-personal-care-skin-care', '💄', 2, 1, true, '["ফেস ওয়াশ", "ময়েশ্চারাইজার", "সানস্ক্রিন", "ফেস ক্রিম", "সিরাম", "টোনার", "ফেস মাস্ক", "লিপ বাম"]'::jsonb),
  ('c2000000-0005-0002-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Hair Care', 'চুলের যত্ন', 'beauty-personal-care-hair-care', '💄', 2, 2, true, '["শ্যাম্পু", "কন্ডিশনার", "চুলের তেল", "হেয়ার সিরাম", "হেয়ার কালার", "হেয়ার জেল ও ওয়াক্স", "হেয়ার প্যাক"]'::jsonb),
  ('c2000000-0005-0003-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Oral Care', 'মুখ ও দাঁতের যত্ন', 'beauty-personal-care-oral-care', '💄', 2, 3, true, '["টুথপেস্ট", "টুথব্রাশ", "মাউথওয়াশ", "ডেন্টাল ফ্লস", "দাঁতের মাজন", "জিভ ছোলার"]'::jsonb),
  ('c2000000-0005-0004-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Bath & Body', 'গোসল ও বডি কেয়ার', 'beauty-personal-care-bath-body', '💄', 2, 4, true, '["গায়ে মাখার সাবান", "বডি ওয়াশ", "বডি লোশন", "বডি স্ক্রাব", "হ্যান্ড ওয়াশ", "হ্যান্ড ক্রিম", "ট্যালকম পাউডার"]'::jsonb),
  ('c2000000-0005-0005-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Shaving & Grooming', 'শেভিং ও গ্রুমিং', 'beauty-personal-care-shaving-grooming', '💄', 2, 5, true, '["রেজার ও ব্লেড", "শেভিং ক্রিম", "শেভিং ফোম", "আফটারশেভ", "দাড়ির তেল", "হেয়ার রিমুভার"]'::jsonb),
  ('c2000000-0005-0006-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Deodorants', 'সুগন্ধি ও ডিওডোরেন্ট', 'beauty-personal-care-deodorants', '💄', 2, 6, true, '["রোল-অন", "বডি স্প্রে", "স্টিক ডিওডোরেন্ট", "বডি মিস্ট", "আতর ও পারফিউম"]'::jsonb),
  ('c2000000-0005-0007-000000000000', 'c1000000-0000-0000-0000-000000000005', 'Feminine Care', 'নারীদের ব্যক্তিগত যত্ন', 'beauty-personal-care-feminine-care', '💄', 2, 7, true, '["স্যানিটারি প্যাড", "প্যান্টিলাইনার", "ট্যাম্পন", "মেনস্ট্রুয়াল কাপ", "ইন্টিমেট ওয়াশ", "ম্যাটারনিটি প্যাড"]'::jsonb),

  -- Cleaning & Household (c1000000-0000-0000-0000-000000000006)
  ('c2000000-0006-0001-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Dishwashing Supplies', 'বাসন মাজার সামগ্রী', 'cleaning-household-dishwashing-supplies', '🍽️', 2, 1, true, '["ডিশওয়াশ লিকুইড", "ডিশওয়াশ বার / সাবান", "ডিশওয়াশ পাউডার", "ডিশওয়াশার ট্যাবলেট", "স্পঞ্জ ও স্ক্রাবার"]'::jsonb),
  ('c2000000-0006-0002-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Laundry', 'লন্ড্রি ও কাপড় ধোয়া', 'cleaning-household-laundry', '🧺', 2, 2, true, '["ডিটারজেন্ট পাউডার", "লিকুইড ডিটারজেন্ট", "কাপড় কাচার সাবান", "ফ্যাব্রিক সফটনার", "দাগ দূরকারক", "ব্লিচিং পাউডার", "কাপড়ের ক্লিপ ও পিন"]'::jsonb),
  ('c2000000-0006-0003-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Toilet Cleaners', 'টয়লেট ক্লিনার', 'cleaning-household-toilet-cleaners', '🚽', 2, 3, true, '["টয়লেট লিকুইড ক্লিনার", "টয়লেট জেল", "ফ্লাশ ব্লক", "বাথরুম ক্লিনার", "ড্রেন ক্লিনার"]'::jsonb),
  ('c2000000-0006-0004-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Napkins & Paper Products', 'ন্যাপকিন ও পেপার সামগ্রী', 'cleaning-household-napkins-paper-products', '🧻', 2, 4, true, '["ফেসিয়াল টিস্যু", "টয়লেট টিস্যু রোল", "কিচেন পেপার টাওয়েল", "পেপার ন্যাপকিন", "ওয়েট ওয়াইপস", "হ্যান্ড টাওয়েল"]'::jsonb),
  ('c2000000-0006-0005-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Pest Control', 'মশা ও কীটনাশক', 'cleaning-household-pest-control', '🦟', 2, 5, true, '["মশার অ্যারোসল / স্প্রে", "মশার কয়েল", "লিকুইড ভ্যাপোরাইজার ও রিফিল", "তেলাপোকা ও পিঁপড়া মারার স্প্রে", "ইঁদুর মারার বিষ / ফাঁদ", "কীটনাশক চক ও পাউডার"]'::jsonb),
  ('c2000000-0006-0006-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Floor & Glass Cleaners', 'মেঝে ও গ্লাস ক্লিনার', 'cleaning-household-floor-glass-cleaners', '🪟', 2, 6, true, '["ফ্লোর ক্লিনার", "গ্লাস ক্লিনার", "মাল্টি-পারপাস ক্লিনার", "জীবাণুনাশক স্প্রে ও ফিনাইল", "কিচেন ক্লিনার", "ফার্নিচার পলিশ"]'::jsonb),
  ('c2000000-0006-0007-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Cleaning Accessories', 'পরিষ্কারের সরঞ্জাম', 'cleaning-household-cleaning-accessories', '🧹', 2, 7, true, '["ফ্লোর মপ ও ওয়াইপার", "ঝাড়ু ও ডাস্টপ্যান", "স্ক্রাবার ও স্পঞ্জ", "মুছার কাপড় ও ডাস্টার", "টয়লেট ব্রাশ", "ক্লিনিং রাবার গ্লাভস"]'::jsonb),
  ('c2000000-0006-0008-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Air Fresheners', 'এয়ার ফ্রেশনার', 'cleaning-household-air-fresheners', '🌸', 2, 8, true, '["রুম স্প্রে", "অ্যারোসল ফ্রেশনার", "জেল ফ্রেশনার", "টয়লেট ফ্রেশনার ও ওডোনিল", "ডিফিউজার ও রিফিল", "কার ফ্রেশনার"]'::jsonb),
  ('c2000000-0006-0009-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Disposables & Trash Bags', 'ডিসপোজেবল ও ট্র্যাশ ব্যাগ', 'cleaning-household-disposables-trash-bags', '🗑️', 2, 9, true, '["ময়লার ব্যাগ / ট্র্যাশ ব্যাগ", "ড্রস্ট্রিং ডাস্টবিন ব্যাগ", "অ্যালুমিনিয়াম ফয়েল", "ফুড র‍্যাপিং পেপার / ক্লিঙ ফিল্ম", "ডিসপোজেবল গ্লাভস", "ডিসপোজেবল বক্স"]'::jsonb),
  ('c2000000-0006-0010-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Shoe Care', 'জুতার যত্ন', 'cleaning-household-shoe-care', '👞', 2, 10, true, '["কালো জুতার পলিশ", "বাদামী জুতার পলিশ", "ইনস্ট্যান্ট জুতার শাইনার", "লিকুইড শু পলিশ", "জুতার ব্রাশ", "শু ক্রিম"]'::jsonb),
  ('c2000000-0006-0011-000000000000', 'c1000000-0000-0000-0000-000000000006', 'Trash Bin & Basket', 'ডাস্টবিন ও ঝুড়ি', 'cleaning-household-trash-bin-basket', '🧺', 2, 11, true, '["প্যাডেল ডাস্টবিন", "ওপেন ডাস্টবিন", "বাথরুমের ছোট বিন", "লন্ড্রি বাস্কেট", "স্টোরেজ ঝুড়ি"]'::jsonb),

  -- Stationery & Lifestyle (c1000000-0000-0000-0000-000000000007)
  ('c2000000-0007-0001-000000000000', 'c1000000-0000-0000-0000-000000000007', 'Pens & Writing', 'কলম ও লেখার সামগ্রী', 'stationery-lifestyle-pens-writing', '✏️', 2, 1, true, '["বলপয়েন্ট কলম", "জেল কলম", "পেন্সিল", "হাইলাইটার", "স্থায়ী মার্কার", "হোয়াইটবোর্ড মার্কার"]'::jsonb),
  ('c2000000-0007-0002-000000000000', 'c1000000-0000-0000-0000-000000000007', 'Notebooks & Paper', 'খাতা ও কাগজ', 'stationery-lifestyle-notebooks-paper', '✏️', 2, 2, true, '["খাতা", "স্পাইরাল নোটবুক", "স্টিকি নোট", "এ৪ পেপার", "ডায়েরি ও প্ল্যানার"]'::jsonb),
  ('c2000000-0007-0003-000000000000', 'c1000000-0000-0000-0000-000000000007', 'Office Supplies', 'অফিস সামগ্রী', 'stationery-lifestyle-office-supplies', '✏️', 2, 3, true, '["স্ট্যাপলার ও পিন", "পেপার ক্লিপ", "কাঁচি ও কাটার", "আঠা ও স্কচটেপ", "ক্যালকুলেটর", "ফাইল ও ফোল্ডার"]'::jsonb),
  ('c2000000-0007-0004-000000000000', 'c1000000-0000-0000-0000-000000000007', 'Art & Craft', 'আর্ট ও ক্রাফট', 'stationery-lifestyle-art-craft', '✏️', 2, 4, true, '["রং পেন্সিল", "মোম রং / ক্রেয়ন", "জলরং সেট", "স্কেচবুক", "ক্রাফট পেপার"]'::jsonb),
  ('c2000000-0007-0005-000000000000', 'c1000000-0000-0000-0000-000000000007', 'Party Supplies', 'পার্টি সামগ্রী', 'stationery-lifestyle-party-supplies', '✏️', 2, 5, true, '["বেলুন", "জন্মদিনের মোমবাতি", "পার্টি পপার", "ডিসপোজেবল প্লেট ও কাপ", "গিফট র‍্যাপ ও ব্যাগ"]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  name_bn = excluded.name_bn,
  parent_category_id = excluded.parent_category_id,
  level = 2,
  sort_order = excluded.sort_order,
  is_active = true,
  subcategories = excluded.subcategories;

-- 4.1 Idempotent Upsert for Dairy & Eggs Level 3 Child Categories (25 Child Categories)
insert into public.categories (id, parent_id, parent_category_id, name, name_bn, slug, icon, level, sort_order, is_active)
values
  -- Under Milk (c2000000-0001-0001-000000000000)
  ('c3000000-0001-0001-00010000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Full Cream Milk', 'ফুল ক্রিম দুধ', 'dairy-eggs-milk-full-cream-milk', '🥛', 3, 1, true),
  ('c3000000-0001-0001-00020000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Low-Fat Milk', 'লো-ফ্যাট দুধ', 'dairy-eggs-milk-low-fat-milk', '🥛', 3, 2, true),
  ('c3000000-0001-0001-00030000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'UHT Milk', 'ইউএইচটি দুধ', 'dairy-eggs-milk-uht-milk', '🥛', 3, 3, true),
  ('c3000000-0001-0001-00040000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Powdered Milk', 'গুঁড়ো দুধ', 'dairy-eggs-milk-powdered-milk', '🥛', 3, 4, true),
  ('c3000000-0001-0001-00050000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Flavored Milk', 'ফ্লেভার্ড মিল্ক', 'dairy-eggs-milk-flavored-milk', '🥛', 3, 5, true),
  ('c3000000-0001-0001-00060000', 'c2000000-0001-0001-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Condensed Milk', 'কনডেন্সড মিল্ক', 'dairy-eggs-milk-condensed-milk', '🥛', 3, 6, true),

  -- Under Yogurt (c2000000-0001-0002-000000000000)
  ('c3000000-0001-0002-00010000', 'c2000000-0001-0002-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Plain Yogurt', 'টক দই', 'dairy-eggs-yogurt-plain-yogurt', '🥛', 3, 1, true),
  ('c3000000-0001-0002-00020000', 'c2000000-0001-0002-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Sweetened Yogurt', 'মিষ্টি দই', 'dairy-eggs-yogurt-sweetened-yogurt', '🥛', 3, 2, true),
  ('c3000000-0001-0002-00030000', 'c2000000-0001-0002-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Greek-Style Yogurt', 'গ্রিক ইয়োগার্ট', 'dairy-eggs-yogurt-greek-style-yogurt', '🥛', 3, 3, true),
  ('c3000000-0001-0002-00040000', 'c2000000-0001-0002-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Flavored Yogurt', 'ফ্লেভার্ড দই', 'dairy-eggs-yogurt-flavored-yogurt', '🥛', 3, 4, true),

  -- Under Butter & Ghee (c2000000-0001-0003-000000000000)
  ('c3000000-0001-0003-00010000', 'c2000000-0001-0003-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Salted Butter', 'সল্টেড বাটার', 'dairy-eggs-butter-ghee-salted-butter', '🥛', 3, 1, true),
  ('c3000000-0001-0003-00020000', 'c2000000-0001-0003-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Unsalted Butter', 'আনসল্টেড বাটার', 'dairy-eggs-butter-ghee-unsalted-butter', '🥛', 3, 2, true),
  ('c3000000-0001-0003-00030000', 'c2000000-0001-0003-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Dairy Ghee', 'গাওয়া ঘি', 'dairy-eggs-butter-ghee-dairy-ghee', '🥛', 3, 3, true),
  ('c3000000-0001-0003-00040000', 'c2000000-0001-0003-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Pure Ghee', 'খাঁটি ঘি', 'dairy-eggs-butter-ghee-pure-ghee', '🥛', 3, 4, true),

  -- Under Cheese (c2000000-0001-0004-000000000000)
  ('c3000000-0001-0004-00010000', 'c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Sliced Cheese', 'স্লাইসড চিজ', 'dairy-eggs-cheese-sliced-cheese', '🥛', 3, 1, true),
  ('c3000000-0001-0004-00020000', 'c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Cheese Blocks', 'চিজ ব্লক', 'dairy-eggs-cheese-cheese-blocks', '🥛', 3, 2, true),
  ('c3000000-0001-0004-00030000', 'c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Cheese Spread', 'চিজ স্প্রেড', 'dairy-eggs-cheese-cheese-spread', '🥛', 3, 3, true),
  ('c3000000-0001-0004-00040000', 'c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Mozzarella', 'মোজারেলা চিজ', 'dairy-eggs-cheese-mozzarella', '🥛', 3, 4, true),
  ('c3000000-0001-0004-00050000', 'c2000000-0001-0004-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Processed Cheese', 'প্রসেসড চিজ', 'dairy-eggs-cheese-processed-cheese', '🥛', 3, 5, true),

  -- Under Cream (c2000000-0001-0005-000000000000)
  ('c3000000-0001-0005-00010000', 'c2000000-0001-0005-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Fresh Cream', 'ফ্রেশ ক্রিম', 'dairy-eggs-cream-fresh-cream', '🥛', 3, 1, true),
  ('c3000000-0001-0005-00020000', 'c2000000-0001-0005-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Whipping Cream', 'হুইপিং ক্রিম', 'dairy-eggs-cream-whipping-cream', '🥛', 3, 2, true),
  ('c3000000-0001-0005-00030000', 'c2000000-0001-0005-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Cooking Cream', 'কুকিং ক্রিম', 'dairy-eggs-cream-cooking-cream', '🥛', 3, 3, true),

  -- Under Eggs (c2000000-0001-0006-000000000000)
  ('c3000000-0001-0006-00010000', 'c2000000-0001-0006-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Chicken Eggs', 'মুরগির ডিম', 'dairy-eggs-eggs-chicken-eggs', '🥚', 3, 1, true),
  ('c3000000-0001-0006-00020000', 'c2000000-0001-0006-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Duck Eggs', 'হাঁসের ডিম', 'dairy-eggs-eggs-duck-eggs', '🥚', 3, 2, true),
  ('c3000000-0001-0006-00030000', 'c2000000-0001-0006-000000000000', 'c1000000-0000-0000-0000-000000000001', 'Quail Eggs', 'কোয়েলের ডিম', 'dairy-eggs-eggs-quail-eggs', '🥚', 3, 3, true)
on conflict (slug) do update set
  name = excluded.name,
  name_bn = excluded.name_bn,
  parent_id = excluded.parent_id,
  parent_category_id = excluded.parent_category_id,
  level = 3,
  sort_order = excluded.sort_order,
  is_active = true;

-- Update products to link to main categories if legacy slug
update public.products
set category_slug = 'cooking-essentials'
where category_slug in ('rice-dal', 'edible-oil', 'spices', 'flour', 'essentials');

update public.products
set category_slug = 'snacks-beverages'
where category_slug = 'snacks-tea';

update public.products
set category_slug = 'cleaning-household'
where category_slug = 'soap-cleaning';

-- 5. Deactivate obsolete main categories outside the 7 official categories
update public.categories
set is_active = false
where (level = 1 or level is null)
  and slug not in (
    'dairy-eggs',
    'cooking-essentials',
    'snacks-beverages',
    'baby-care',
    'beauty-personal-care',
    'cleaning-household',
    'stationery-lifestyle'
  );


