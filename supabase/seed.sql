-- Tonmoy Varity Store: Comprehensive Bangladeshi Grocery Seed Data
-- Run this in your Supabase SQL Editor after running schema.sql

-- 1. Insert Categories
INSERT INTO public.categories (id, name, name_bn, slug, icon, sort_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Rice, Atta & Grains', 'চাল, আটা ও শস্য', 'rice-atta-grains', '🌾', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Oil & Ghee', 'তেল ও ঘি', 'oil-ghee', '🫒', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Dal & Pulses', 'ডাল ও ডালজাতীয়', 'dal-pulses', '🥣', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Spices & Masala', 'মসলা ও গুঁড়ো', 'spices-masala', '🌶️', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Fresh Vegetables', 'তাজা শাক-সবজি', 'fresh-vegetables', '🥦', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Fish & Meat', 'মাছ ও মাংস', 'fish-meat', '🐟', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Dairy & Eggs', 'দুধ ও ডিম', 'dairy-eggs', '🥚', 7, true),
  ('c1000000-0000-0000-0000-000000000008', 'Tea, Coffee & Beverages', 'চা, কফি ও পানীয়', 'tea-beverages', '☕', 8, true),
  ('c1000000-0000-0000-0000-000000000009', 'Snacks & Bakery', 'নাস্তা ও বিস্কুট', 'snacks-bakery', '🍪', 9, true),
  ('c1000000-0000-0000-0000-000000000010', 'Cleaning & Household', 'গৃহস্থালি ও পরিচ্ছন্নতা', 'cleaning-household', '🧼', 10, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- 2. Insert Products
INSERT INTO public.products (id, category_id, name, name_bn, description, description_bn, price, original_price, stock_quantity, unit, image_url, is_active, is_featured)
VALUES
  -- Rice & Grains
  (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Nazirshail Premium Rice (5kg)',
    'নাজিরশাইল প্রিমিয়াম চাল (৫ কেজি)',
    'Pure and authentic aromatic Nazirshail rice, perfectly polished and stone-free.',
    'সুস্বাদু ও ঝরঝরে নাজিরশাইল চাল। পরিবারের দৈনন্দিন খাবারের জন্য সেরা।',
    425.00,
    450.00,
    50,
    'ব্যাগ',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Miniket Standard Rice (1kg)',
    'মিনিকেট চাল (১ কেজি)',
    'Fine grain white miniket rice, non-sticky and daily staple quality.',
    'চিকন ও সাদা মিনিকেট চাল, দৈনন্দিন রান্নার জন্য চমৎকার।',
    72.00,
    78.00,
    150,
    'কেজি',
    'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Teer Whole Wheat Atta (2kg)',
    'তীর হোল হুইট আটা (২ কেজি)',
    '100% pure whole wheat atta for soft, wholesome rotis and parathas.',
    'নরম ও স্বাস্থ্যকর রুটি তৈরির জন্য ১০০% খাঁটি গমের আটা।',
    130.00,
    140.00,
    80,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000001',
    'Chinigura Polao Rice (1kg)',
    'চিনিগুঁড়া পোলাও চাল (১ কেজি)',
    'Aromatic Chinigura rice from Dinajpur, ideal for Biryani and Polao.',
    'দিনাজপুরের সুগন্ধি খাঁটি চিনিগুঁড়া চাল, পোলাও ও বিরিয়ানির জন্য আদর্শ।',
    145.00,
    160.00,
    65,
    'কেজি',
    'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),

  -- Oil & Ghee
  (
    'p1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000002',
    'Rupchanda Fortified Soyabean Oil (5L)',
    'রূপচাঁদা সয়াবিন তেল (৫ লিটার)',
    'Vitamin A fortified premium edible cooking oil for healthy daily meals.',
    'ভিটামিন এ সমৃদ্ধ খাঁটি সয়াবিন তেল, সুস্বাস্থ্য ও সুস্বাদু রান্নার জন্য।',
    920.00,
    950.00,
    40,
    'বোতল',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000002',
    'Pran Pure Mustard Oil (500ml)',
    'প্রাণ খাঁটি সরিষার তেল (৫০০ মিলি)',
    'Traditional pungent mustard oil pressed from high-grade mustard seeds.',
    'ঐতিহ্যবাহী ঝাঁঝালো খাঁটি সরিষার তেল, ভর্তা ও আচার তৈরির অতুলনীয় সঙ্গী।',
    170.00,
    185.00,
    90,
    'বোতল',
    'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000002',
    'Aarong Dairy Pure Ghee (400g)',
    'আড়ং ডেইরি খাঁটি গাওয়া ঘি (৪০০ গ্রাম)',
    'Rich golden clarified butter made from fresh cows milk.',
    'খাঁটি গাভীর দুধের ননী দিয়ে তৈরি সুগন্ধি ও সুস্বাদু গাওয়া ঘি।',
    650.00,
    690.00,
    25,
    'জার',
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),

  -- Dal & Pulses
  (
    'p1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000003',
    'Deshi Masoor Dal (1kg)',
    'দেশি মসুর ডাল (১ কেজি)',
    'Small grain flavorful red lentils, cooks quickly and very nutritious.',
    'ছোট দানার লাল দেশি মসুর ডাল, দ্রুত সেদ্ধ হয় এবং পুষ্টিগুণে ভরপুর।',
    135.00,
    145.00,
    110,
    'কেজি',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000003',
    'Moong Dal Premium (500g)',
    'ভাজা মুগ ডাল প্রিমিয়াম (৫০০ গ্রাম)',
    'Lightly roasted yellow moong dal for delicious khichuri and soup.',
    'হালকা ভাজা সুস্বাদু মুগ ডাল, ভুনা খিচুড়ির জন্য আদর্শ।',
    85.00,
    95.00,
    75,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000003',
    'Kabuli Chola / Chickpeas (1kg)',
    'কাবুলি ছোলা (১ কেজি)',
    'Large chickpeas perfect for evening chola bhuna and salads.',
    'বড় দানার ফ্রেশ কাবুলি ছোলা, সুস্বাদু ছোলা ভুনার জন্য।',
    140.00,
    155.00,
    60,
    'কেজি',
    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),

  -- Spices & Masala
  (
    'p1000000-0000-0000-0000-000000000011',
    'c1000000-0000-0000-0000-000000000004',
    'Radhuni Turmeric Powder (200g)',
    'রাঁধুনী হলুদ গুঁড়ো (২০০ গ্রাম)',
    'Bright natural color and aroma from selected handpicked turmeric.',
    'বাছাইকৃত হলুদের খাঁটি গুঁড়ো, খাবারে আনে আকর্ষণীয় রং ও স্বাদ।',
    85.00,
    95.00,
    120,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000012',
    'c1000000-0000-0000-0000-000000000004',
    'Radhuni Red Chilli Powder (200g)',
    'রাঁধুনী মরিচ গুঁড়ো (২০০ গ্রাম)',
    'Spicy hot red chilli powder for rich color and fiery taste.',
    'ঝাল ও সুন্দর রঙের নিখুঁত সমন্বয়, যেকোনো তরকারির স্বাদ বাড়িয়ে দেয়।',
    110.00,
    120.00,
    100,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000013',
    'c1000000-0000-0000-0000-000000000004',
    'ACI Pure Iodized Salt (1kg)',
    'এসিআই পিওর আয়োডিনযুক্ত লবণ (১ কেজি)',
    'Vacuum evaporated high purity iodized white edible salt.',
    'ভ্যাকুয়াম বাষ্পীভূত ১০০% খাঁটি আয়োডিনযুক্ত চকচকে সাদা লবণ।',
    42.00,
    45.00,
    200,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),

  -- Fresh Vegetables
  (
    'p1000000-0000-0000-0000-000000000014',
    'c1000000-0000-0000-0000-000000000005',
    'Fresh Red Potatoes (1kg)',
    'নতুন লাল আলু (১ কেজি)',
    'Farm fresh firm red potatoes, ideal for curry and mashed aloo bhorta.',
    'খামার থেকে সদ্য আনা সুস্বাদু লাল আলু, ভর্তা ও তরকারির জন্য সেরা।',
    55.00,
    60.00,
    300,
    'কেজি',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000015',
    'c1000000-0000-0000-0000-000000000005',
    'Deshi Red Onion (1kg)',
    'দেশি পেঁয়াজ (১ কেজি)',
    'Sharp, fresh domestic red onions packed with strong natural flavor.',
    'তাজা দেশি লাল পেঁয়াজ, সুবাস ও ঝাঁঝে সেরা।',
    95.00,
    110.00,
    250,
    'কেজি',
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000016',
    'c1000000-0000-0000-0000-000000000005',
    'Fresh Tomatoes (1kg)',
    'পাকা টমেটো (১ কেজি)',
    'Juicy, ripe red farm tomatoes full of vitamin C.',
    'রসালো লাল পাকা টমেটো, সালাদ ও রান্নার জন্য দারুণ।',
    60.00,
    70.00,
    80,
    'কেজি',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),

  -- Dairy & Eggs
  (
    'p1000000-0000-0000-0000-000000000017',
    'c1000000-0000-0000-0000-000000000007',
    'Farm Fresh Brown Eggs (12 pcs)',
    'ফার্মের লাল ডিম (১২টি)',
    'Nutritious fresh brown chicken eggs, graded and cleaned.',
    'তাজা ও পুষ্টিকর ফার্মের লাল ডিম (১ ডজন)।',
    145.00,
    155.00,
    100,
    'ডজন',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),
  (
    'p1000000-0000-0000-0000-000000000018',
    'c1000000-0000-0000-0000-000000000007',
    'Aarong Pasteurized Liquid Milk (1L)',
    'আড়ং তরল দুধ (১ লিটার)',
    'Fresh, rich pasteurized whole milk ready to drink.',
    'খাঁটি ও স্বাস্থ্যসম্মত পাস্তুরিত তরল দুধ।',
    90.00,
    95.00,
    60,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000019',
    'c1000000-0000-0000-0000-000000000007',
    'Dano Daily Pushti Milk Powder (500g)',
    'ড্যানো ডেইলি পুষ্টি গুঁড়ো দুধ (৫০০ গ্রাম)',
    'Enriched milk powder with calcium, vitamins and protein for the whole family.',
    'ক্যালসিয়াম ও ভিটামিন সমৃদ্ধ পুষ্টিকর গুঁড়ো দুধ।',
    380.00,
    410.00,
    45,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),

  -- Tea & Beverages
  (
    'p1000000-0000-0000-0000-000000000020',
    'c1000000-0000-0000-0000-000000000008',
    'Ispahani Mirzapore Best Leaf Tea (400g)',
    'ইস্পাহানি মির্জাপুর বেস্ট লিফ চা (৪০০ গ্রাম)',
    'The most loved tea blend in Bangladesh for deep liquor and unmatched aroma.',
    'বাংলাদেশের সবচেয়ে জনপ্রিয় কড়া লিকার ও চমৎকার স্বাদের চা পাতা।',
    240.00,
    260.00,
    70,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),

  -- Snacks & Bakery
  (
    'p1000000-0000-0000-0000-000000000021',
    'c1000000-0000-0000-0000-000000000009',
    'Olympic Energy Plus Biscuits (Family Pack)',
    'অলিম্পিক এনার্জি প্লাস বিস্কুট (ফ্যামিলি প্যাক)',
    'Crunchy glucose biscuits enriched with vitamins, loved by children and adults.',
    'সুস্বাদু ও মুচমুচে গ্লুকোজ বিস্কুট, চায়ের সাথে জম্পেশ নাস্তা।',
    60.00,
    65.00,
    120,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000022',
    'c1000000-0000-0000-0000-000000000009',
    'Maggi 2-Minute Masala Noodles (8 in 1)',
    'ম্যাগি ২-মিনিট মসলা নুডলস (৮ প্যাক)',
    'Delicious instant snack packed with essential minerals and authentic taste.',
    'দ্রুত ক্ষুধা মেটাতে সুস্বাদু মসলা নুডলস। বাচ্চাদের পছন্দের শীর্ষে।',
    180.00,
    195.00,
    85,
    'প্যাক',
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    true,
    true
  ),

  -- Cleaning & Household
  (
    'p1000000-0000-0000-0000-000000000023',
    'c1000000-0000-0000-0000-000000000010',
    'Wheel 2in1 Clean & Fresh Washing Powder (1kg)',
    'হুইল টু ইন ওয়ান ওয়াশিং পাউডার (১ কেজি)',
    'Powerful lemon and floral detergent powder that keeps clothes bright and fragrant.',
    'কাপড় পরিষ্কার ও সুবাসিত রাখতে শক্তিশালী ওয়াশিং পাউডার।',
    140.00,
    150.00,
    90,
    'প্যাকেট',
    'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
    true,
    false
  ),
  (
    'p1000000-0000-0000-0000-000000000024',
    'c1000000-0000-0000-0000-000000000010',
    'Vim Dishwash Liquid Lemon (500ml)',
    'ভিম ডিশওয়াশ লিকুইড লেমন (৫০০ মিলি)',
    'Grease-cutting concentrated lemon dishwashing liquid for sparkling utensils.',
    'লেবুর শক্তিসম্পন্ন থালাবাসন ধোয়ার লিকুইড, তৈলাক্ত দাগ দূর করে নিমেষেই।',
    130.00,
    140.00,
    75,
    'বোতল',
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
    true,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  description = EXCLUDED.description,
  description_bn = EXCLUDED.description_bn,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  stock_quantity = EXCLUDED.stock_quantity,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured;

-- 3. Insert Default Shop Settings
INSERT INTO public.shop_settings (
  id, store_name, store_name_bn, phone, address, delivery_fee, free_delivery_threshold, open_hours, home_delivery_enabled, store_pickup_enabled, cod_enabled, pay_at_store_enabled
) VALUES (
  'default',
  'Tonmoy Varity Store',
  'তন্ময় ভ্যারাইটি স্টোর',
  '+880 1712-345678',
  'House 12, Road 4, Dhanmondi, Dhaka-1205',
  50.00,
  500.00,
  'শনি – বৃহস্পতিবার: সকাল ৮টা – রাত ১০টা',
  true,
  true,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  store_name_bn = EXCLUDED.store_name_bn,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  delivery_fee = EXCLUDED.delivery_fee,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  open_hours = EXCLUDED.open_hours,
  home_delivery_enabled = EXCLUDED.home_delivery_enabled,
  store_pickup_enabled = EXCLUDED.store_pickup_enabled,
  cod_enabled = EXCLUDED.cod_enabled,
  pay_at_store_enabled = EXCLUDED.pay_at_store_enabled;

-- =====================================================================
-- ADMIN ACCOUNT SETUP INSTRUCTIONS:
-- 1. Create a user via Supabase Dashboard -> Authentication -> Users (or register in the web app)
-- 2. Run the query below with your user email to promote to admin:
--
--    UPDATE public.profiles
--    SET role = 'admin'
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
-- =====================================================================
