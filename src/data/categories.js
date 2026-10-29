// Complete 7 Main Categories, Subcategories, and Detailed Subcategories (Chaldal Style)
// for Tonmoy Variety Store

export const DEFAULT_CATEGORIES = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Dairy & Eggs',
    name_bn: 'দুধ ও ডিম',
    slug: 'dairy-eggs',
    icon: '🥛',
    icon_name: 'egg_alt',
    description: 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম',
    description_bn: 'তাজা খাঁটি দুধ, ঘি, মাখন, পনির ও পুষ্টিকর ডিম',
    sort_order: 1,
    is_active: true,
    item_count: 24,
    level: 1,
    subcategories: [
      {
        name: 'Milk',
        name_bn: 'দুধ',
        slug: 'milk',
        items: ['Full Cream Milk', 'Low-Fat Milk', 'UHT Milk', 'Powdered Milk', 'Flavored Milk', 'Condensed Milk'],
        items_bn: ['ফুল ক্রিম দুধ', 'লো-ফ্যাট দুধ', 'ইউএইচটি দুধ', 'গুঁড়ো দুধ', 'ফ্লেভার্ড মিল্ক', 'কনডেন্সড মিল্ক']
      },
      {
        name: 'Yogurt',
        name_bn: 'দই',
        slug: 'yogurt',
        items: ['Plain Yogurt', 'Sweetened Yogurt', 'Greek-Style Yogurt', 'Flavored Yogurt'],
        items_bn: ['টক দই', 'মিষ্টি দই', 'গ্রিক ইয়োগার্ট', 'ফ্লেভার্ড দই']
      },
      {
        name: 'Butter & Ghee',
        name_bn: 'মাখন ও ঘি',
        slug: 'butter-ghee',
        items: ['Salted Butter', 'Unsalted Butter', 'Dairy Ghee', 'Pure Ghee'],
        items_bn: ['সল্টেড বাটার', 'আনসল্টেড বাটার', 'গাওয়া ঘি', 'খাঁটি ঘি']
      },
      {
        name: 'Cheese',
        name_bn: 'পনির ও চিজ',
        slug: 'cheese',
        items: ['Sliced Cheese', 'Cheese Blocks', 'Cheese Spread', 'Mozzarella', 'Processed Cheese'],
        items_bn: ['স্লাইসড চিজ', 'চিজ ব্লক', 'চিজ স্প্রেড', 'মোজারেলা চিজ', 'প্রসেসড চিজ']
      },
      {
        name: 'Cream',
        name_bn: 'ক্রিম',
        slug: 'cream',
        items: ['Fresh Cream', 'Whipping Cream', 'Cooking Cream'],
        items_bn: ['ফ্রেশ ক্রিম', 'হুইপিং ক্রিম', 'কুকিং ক্রিম']
      },
      {
        name: 'Eggs',
        name_bn: 'ডিম',
        slug: 'eggs',
        items: ['Chicken Eggs', 'Duck Eggs', 'Quail Eggs'],
        items_bn: ['মুরগির ডিম', 'হাঁসের ডিম', 'কোয়েলের ডিম']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Cooking Essentials',
    name_bn: 'রান্নার সামগ্রী',
    slug: 'cooking-essentials',
    icon: '🌾',
    icon_name: 'restaurant',
    description: 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি',
    description_bn: 'চাল, ডাল, আটা, তেল, চিনি, লবণ ও খাঁটি মসলাপাতি',
    sort_order: 2,
    is_active: true,
    item_count: 58,
    level: 1,
    subcategories: [
      {
        name: 'Rice',
        name_bn: 'চাল',
        slug: 'rice',
        items: ['Miniket Rice', 'Nazirshail Rice', 'Basmati Rice', 'Brown Rice', 'Parboiled Rice', 'Aromatic Rice'],
        items_bn: ['মিনিকেট চাল', 'নাজিরশাইল চাল', 'বাসমতী চাল', 'ব্রাউন রাইস / লাল চাল', 'সিদ্ধ চাল', 'সুগন্ধি পোলাও চাল']
      },
      {
        name: 'Lentils & Pulses',
        name_bn: 'ডাল ও ডালজাতীয়',
        slug: 'lentils-pulses',
        items: ['Masoor Dal', 'Moong Dal', 'Chana Dal', 'Urad Dal', 'Chickpeas', 'Dried Peas'],
        items_bn: ['মসুর ডাল', 'মুগ ডাল', 'ছোলার ডাল', 'মাষকলাই ডাল', 'ছোলা বুট', 'মটর ডাল']
      },
      {
        name: 'Flour',
        name_bn: 'আটা ও ময়দা',
        slug: 'flour',
        items: ['Atta', 'Maida', 'Whole Wheat Flour', 'Rice Flour', 'Besan', 'Semolina (Suji)'],
        items_bn: ['আটা', 'ময়দা', 'লাল আটা', 'চালের গুঁড়া', 'বেসন', 'সুজি']
      },
      {
        name: 'Cooking Oil',
        name_bn: 'ভোজ্য তেল',
        slug: 'cooking-oil',
        items: ['Soybean Oil', 'Mustard Oil', 'Sunflower Oil', 'Olive Oil', 'Rice Bran Oil', 'Coconut Oil'],
        items_bn: ['সয়াবিন তেল', 'সরিষার তেল', 'সূর্যমুখী তেল', 'অলিভ অয়েল', 'রাইস ব্রান তেল', 'নারকেল তেল']
      },
      {
        name: 'Salt & Sugar',
        name_bn: 'লবণ ও চিনি',
        slug: 'salt-sugar',
        items: ['Iodized Salt', 'Rock Salt', 'White Sugar', 'Brown Sugar', 'Powdered Sugar', 'Sugar Substitutes'],
        items_bn: ['আয়োডিনযুক্ত লবণ', 'সৈন্ধব লবণ / বিট লবণ', 'সাদা চিনি', 'দেশি লাল চিনি', 'আইসিং সুগার', 'জিরো ক্যালরি সুগার']
      },
      {
        name: 'Spices',
        name_bn: 'মসলাপাতি',
        slug: 'spices',
        items: ['Turmeric Powder', 'Chili Powder', 'Coriander Powder', 'Cumin', 'Garam Masala', 'Whole Spices', 'Spice Mixes'],
        items_bn: ['হলুদ গুঁড়া', 'মরিচ গুঁড়া', 'ধনে গুঁড়া', 'জিরা', 'গরম মসলা', 'আস্ত মসলা', 'রেডি মসলা মিক্স']
      },
      {
        name: 'Sauces & Condiments',
        name_bn: 'সস ও আচার',
        slug: 'sauces-condiments',
        items: ['Tomato Ketchup', 'Soy Sauce', 'Chili Sauce', 'Mayonnaise', 'Mustard', 'Vinegar', 'Pickles', 'Chutney'],
        items_bn: ['টমেটো সস', 'সয়া সস', 'মরিচ সস', 'মেয়োনিজ', 'সরিষার কাসুন্দি', 'ভিনেগার', 'আচার', 'চাটনি']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Snacks & Beverages',
    name_bn: 'নাস্তা ও পানীয়',
    slug: 'snacks-beverages',
    icon: '🍪',
    icon_name: 'fastfood',
    description: 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়',
    description_bn: 'বিস্কুট, চিপস, চকলেট, চা, কফি, জুস ও কোমল পানীয়',
    sort_order: 3,
    is_active: true,
    item_count: 42,
    level: 1,
    subcategories: [
      {
        name: 'Chips & Savory Snacks',
        name_bn: 'চিপস ও চানাচুর',
        slug: 'chips-snacks',
        items: ['Potato Chips', 'Corn Chips', 'Chanachur', 'Nuts & Seeds', 'Popcorn', 'Crackers'],
        items_bn: ['আলু চিপস', 'কর্ন চিপস', 'চানাচুর', 'বাদাম ও বীজ', 'পপকর্ন', 'নোনতা ক্র্যাকার্স']
      },
      {
        name: 'Biscuits & Cookies',
        name_bn: 'বিস্কুট ও কুকিজ',
        slug: 'biscuits-cookies',
        items: ['Sweet Biscuits', 'Salty Biscuits', 'Cream Biscuits', 'Cookies', 'Wafers', 'Crackers'],
        items_bn: ['মিষ্টি বিস্কুট', 'নোনতা বিস্কুট', 'ক্রিম বিস্কুট', 'কুকিজ', 'ওয়েফার', 'টোস্ট ও ক্র্যাকার্স']
      },
      {
        name: 'Chocolates & Candy',
        name_bn: 'চকলেট ও ক্যান্ডি',
        slug: 'chocolates-candy',
        items: ['Chocolate Bars', 'Boxed Chocolates', 'Toffees', 'Lollipops', 'Chewing Gum', 'Mints'],
        items_bn: ['চকলেট বার', 'বক্স চকলেট', 'টফি', 'ললিপপ', 'চুয়িংগাম', 'মিন্ট ক্যান্ডি']
      },
      {
        name: 'Tea & Coffee',
        name_bn: 'চা ও কফি',
        slug: 'tea-coffee',
        items: ['Black Tea', 'Green Tea', 'Tea Bags', 'Instant Coffee', 'Ground Coffee', 'Coffee Mixes', 'Milk Tea Mix'],
        items_bn: ['ব্ল্যাক টি / পাতা চা', 'গ্রিন টি', 'টি ব্যাগ', 'ইনস্ট্যান্ট কফি', 'গ্রাউন্ড কফি', 'কফি মিক্স', 'দুধ চা মিক্স']
      },
      {
        name: 'Juice',
        name_bn: 'জুস ও পানীয়',
        slug: 'juice',
        items: ['Fruit Juice', 'Juice Drinks', 'Coconut Water', 'Concentrated Juice'],
        items_bn: ['ফলের জুস', 'জুস ড্রিংকস', 'ডাবের পানি', 'কনসেনট্রেটেড স্কোয়াশ']
      },
      {
        name: 'Soft Drinks',
        name_bn: 'কোমল পানীয়',
        slug: 'soft-drinks',
        items: ['Cola', 'Lemon-Lime Drinks', 'Orange Drinks', 'Soda Water', 'Energy Drinks', 'Malt Drinks'],
        items_bn: ['কোলা', 'লেমন-লাইম ড্রিংক', 'অরেঞ্জ ড্রিংক', 'সোডা ওয়াটার', 'এনার্জি ড্রিংক', 'মল্ট ড্রিংকস']
      },
      {
        name: 'Water',
        name_bn: 'খাবার পানি',
        slug: 'water',
        items: ['Mineral Water', 'Purified Drinking Water', 'Sparkling Water', 'Large Water Bottles'],
        items_bn: ['মিনারেল ওয়াটার', 'বিশুদ্ধ পানি', 'স্পার্কলিং ওয়াটার', 'বড় পানির জার']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Baby Care',
    name_bn: 'শিশুর যত্ন',
    slug: 'baby-care',
    icon: '👶',
    icon_name: 'child_care',
    description: 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন',
    description_bn: 'ডায়াপার, বেবি ওয়াইপস, শিশুর পুষ্টিকর খাবার ও লোশন',
    sort_order: 4,
    is_active: true,
    item_count: 28,
    level: 1,
    subcategories: [
      {
        name: 'Diapers',
        name_bn: 'ডায়াপার',
        slug: 'diapers',
        items: ['Newborn Diapers', 'Small Size', 'Medium Size', 'Large Size', 'Extra-Large Size', 'Diaper Pants', 'Cloth Diapers'],
        items_bn: ['নবজাতকের ডায়াপার', 'এস সাইজ', 'এম সাইজ', 'এল সাইজ', 'এক্সএল সাইজ', 'প্যান্ট ডায়াপার', 'কাপড়ের ডায়াপার']
      },
      {
        name: 'Baby Wipes',
        name_bn: 'বেবি ওয়াইপস',
        slug: 'baby-wipes',
        items: ['Sensitive-Skin Wipes', 'Fragrance-Free Wipes', 'Water-Based Wipes', 'Travel Pack Wipes'],
        items_bn: ['সেনসিটিভ স্কিন ওয়াইপস', 'সুগন্ধিমুক্ত ওয়াইপস', 'ওয়াটার বেসড ওয়াইপস', 'ট্রাভেল প্যাক ওয়াইপস']
      },
      {
        name: 'Baby Food & Formula',
        name_bn: 'শিশুর খাবার ও ফর্মুলা',
        slug: 'baby-food',
        items: ['Infant Formula', 'Follow-On Formula', 'Growing-Up Milk', 'Baby Cereal', 'Baby Puree', 'Baby Snacks', 'Baby Food Pouches'],
        items_bn: ['ইনফ্যান্ট ফর্মুলা দুধ', 'ফলো-অন ফর্মুলা', 'গ্রোয়িং-আপ মিল্ক', 'সেরেল্যাক / বেবি সিরিয়াল', 'বেবি পিউরি', 'শিশুর নাস্তা', 'ফুড পাউচ']
      },
      {
        name: 'Baby Bath & Skin Care',
        name_bn: 'শিশুর গোসল ও ত্বক',
        slug: 'baby-bath-skin',
        items: ['Baby Shampoo', 'Baby Body Wash', 'Baby Lotion', 'Baby Oil', 'Diaper Rash Cream', 'Baby Powder', 'Baby Soap'],
        items_bn: ['বেবি শ্যাম্পু', 'বেবি বডি ওয়াশ', 'বেবি লোশন', 'বেবি অয়েল', 'র‍্যাশ ক্রিম', 'বেবি পাউডার', 'বেবি সোপ']
      },
      {
        name: 'Baby Accessories',
        name_bn: 'শিশুর অনুষঙ্গ',
        slug: 'baby-accessories',
        items: ['Feeding Bottles', 'Nipples & Teats', 'Pacifiers', 'Bibs', 'Baby Spoons & Bowls', 'Bottle Cleaning Brushes', 'Baby Nail Clippers'],
        items_bn: ['ফিডার বোতল', 'নিপল ও টিট', 'প্যাসিফায়ার', 'শিশুর বিব', 'চামচ ও বাটি', 'বোতল পরিষ্কারের ব্রাশ', 'নেইল ক্লিপার']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Beauty & Personal Care',
    name_bn: 'সৌন্দর্য ও ব্যক্তিগত যত্ন',
    slug: 'beauty-personal-care',
    icon: '💄',
    icon_name: 'face',
    description: 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন',
    description_bn: 'স্কিন কেয়ার, শ্যাম্পু, টুথপেস্ট, সাবান ও ব্যক্তিগত যত্ন',
    sort_order: 5,
    is_active: true,
    item_count: 36,
    level: 1,
    subcategories: [
      {
        name: 'Skin Care',
        name_bn: 'ত্বকের যত্ন',
        slug: 'skin-care',
        items: ['Face Wash', 'Moisturizers', 'Sunscreen', 'Face Cream', 'Serums', 'Toner', 'Face Masks', 'Lip Care'],
        items_bn: ['ফেস ওয়াশ', 'ময়েশ্চারাইজার', 'সানস্ক্রিন', 'ফেস ক্রিম', 'সিরাম', 'টোনার', 'ফেস মাস্ক', 'লিপ কেয়ার / বাম']
      },
      {
        name: 'Hair Care',
        name_bn: 'চুলের যত্ন',
        slug: 'hair-care',
        items: ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Color', 'Hair Gel & Wax', 'Hair Masks'],
        items_bn: ['শ্যাম্পু', 'কন্ডিশনার', 'চুলের তেল', 'হেয়ার সিরাম', 'হেয়ার কালার', 'হেয়ার জেল ও ওয়াক্স', 'হেয়ার মাস্ক']
      },
      {
        name: 'Oral Care',
        name_bn: 'মুখের যত্ন',
        slug: 'oral-care',
        items: ['Toothpaste', 'Toothbrushes', 'Mouthwash', 'Dental Floss', 'Toothpowder', 'Tongue Cleaners'],
        items_bn: ['টুথপেস্ট', 'টুথব্রাশ', 'মাউথওয়াশ', 'ডেন্টাল ফ্লস', 'টুথপাউডার', 'জিহ্বা পরিষ্কারক']
      },
      {
        name: 'Bath & Body',
        name_bn: 'গোসল ও শরীর',
        slug: 'bath-body',
        items: ['Bath Soap', 'Body Wash', 'Body Lotion', 'Body Scrub', 'Hand Wash', 'Hand Cream', 'Talcum Powder'],
        items_bn: ['গোসলের সাবান', 'বডি ওয়াশ', 'বডি লোশন', 'বডি স্ক্রাব', 'হ্যান্ড ওয়াশ', 'হ্যান্ড ক্রিম', 'ট্যালকম পাউডার']
      },
      {
        name: 'Shaving & Grooming',
        name_bn: 'শেভিং ও গ্রুমিং',
        slug: 'shaving-grooming',
        items: ['Razors', 'Shaving Cream', 'Shaving Foam', 'Aftershave', 'Beard Oil', 'Hair Removal Products'],
        items_bn: ['রেজর / ব্লেড', 'শেভিং ক্রিম', 'শেভিং ফোম', 'আফটারশেভ', 'দাড়ির তেল', 'হেয়ার রিমুভাল ক্রিম']
      },
      {
        name: 'Deodorants',
        name_bn: 'সুগন্ধি ও ডিওডোরেন্ট',
        slug: 'deodorants',
        items: ['Roll-On', 'Spray Deodorant', 'Stick Deodorant', 'Body Mist', 'Perfume'],
        items_bn: ['রোল-অন', 'বডি স্প্রে', 'স্টিক ডিওডোরেন্ট', 'বডি মিস্ট', 'পারফিউম / আতর']
      },
      {
        name: 'Feminine Care',
        name_bn: 'নারীর ব্যক্তিগত যত্ন',
        slug: 'feminine-care',
        items: ['Sanitary Pads', 'Pantyliners', 'Tampons', 'Menstrual Cups', 'Intimate Wash', 'Maternity Pads'],
        items_bn: ['স্যানিটারি ন্যাপকিন', 'প্যান্টিলাইনার', 'ট্যাম্পন', 'মেনস্ট্রুয়াল কাপ', 'ইন্টিমেট ওয়াশ', 'ম্যাটারনিটি প্যাড']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Cleaning & Household',
    name_bn: 'ক্লিনিং ও গৃহস্থালি',
    slug: 'cleaning-household',
    icon: '🧹',
    icon_name: 'cleaning_services',
    description: 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ',
    description_bn: 'ডিটারজেন্ট, ফ্লোর ক্লিনার, টয়লেট ক্লিনার, টিস্যু ও ব্যাগ',
    sort_order: 6,
    is_active: true,
    item_count: 32,
    level: 1,
    subcategories: [
      {
        name: 'Dishwashing Supplies',
        name_bn: 'বাসন মাজার সামগ্রী',
        slug: 'dishwashing-supplies',
        items: ['Dishwashing Liquid', 'Dishwashing Bar', 'Dishwashing Powder', 'Dishwasher Tablets', 'Sponges & Scrubbers'],
        items_bn: ['ডিশওয়াশ লিকুইড', 'ডিশওয়াশ বার / সাবান', 'ডিশওয়াশ পাউডার', 'ডিশওয়াশার ট্যাবলেট', 'স্পঞ্জ ও স্ক্রাবার']
      },
      {
        name: 'Laundry',
        name_bn: 'লন্ড্রি ও কাপড় ধোয়া',
        slug: 'laundry',
        items: ['Detergent Powder', 'Liquid Detergent', 'Detergent Bars', 'Fabric Softener', 'Stain Remover', 'Bleach', 'Cloth Pegs & Clips'],
        items_bn: ['ডিটারজেন্ট পাউডার', 'লিকুইড ডিটারজেন্ট', 'কাপড় কাচার সাবান', 'ফ্যাব্রিক সফটনার', 'দাগ দূরকারক', 'ব্লিচিং পাউডার', 'কাপড়ের ক্লিপ ও পিন']
      },
      {
        name: 'Toilet Cleaners',
        name_bn: 'টয়লেট ক্লিনার',
        slug: 'toilet-cleaners',
        items: ['Toilet Cleaning Liquid', 'Toilet Cleaning Gel', 'Toilet Blocks', 'Bathroom Cleaner', 'Drain Cleaner'],
        items_bn: ['টয়লেট লিকুইড ক্লিনার', 'টয়লেট জেল', 'ফ্লাশ ব্লক', 'বাথরুম ক্লিনার', 'ড্রেন ক্লিনার']
      },
      {
        name: 'Napkins & Paper Products',
        name_bn: 'ন্যাপকিন ও পেপার সামগ্রী',
        slug: 'napkins-paper-products',
        items: ['Facial Tissue', 'Toilet Tissue', 'Kitchen Paper Towels', 'Paper Napkins', 'Wet Wipes', 'Hand Towels'],
        items_bn: ['ফেসিয়াল টিস্যু', 'টয়লেট টিস্যু রোল', 'কিচেন পেপার টাওয়েল', 'পেপার ন্যাপকিন', 'ওয়েট ওয়াইপস', 'হ্যান্ড টাওয়েল']
      },
      {
        name: 'Pest Control',
        name_bn: 'মশা ও কীটনাশক',
        slug: 'pest-control',
        items: ['Mosquito Aerosol', 'Mosquito Coils', 'Liquid Vaporizer & Refill', 'Cockroach & Ant Killer', 'Rat Killer', 'Insect Repellent Chalk'],
        items_bn: ['মশার অ্যারোসল / স্প্রে', 'মশার কয়েল', 'লিকুইড ভ্যাপোরাইজার ও রিফিল', 'তেলাপোকা ও পিঁপড়া মারার স্প্রে', 'ইঁদুর মারার বিষ / ফাঁদ', 'কীটনাশক চক ও পাউডার']
      },
      {
        name: 'Floor & Glass Cleaners',
        name_bn: 'মেঝে ও গ্লাস ক্লিনার',
        slug: 'floor-glass-cleaners',
        items: ['Floor Cleaner', 'Glass Cleaner', 'Multi-Purpose Cleaner', 'Disinfectant Spray', 'Kitchen Degreaser', 'Furniture Polish'],
        items_bn: ['ফ্লোর ক্লিনার', 'গ্লাস ক্লিনার', 'মাল্টি-পারপাস ক্লিনার', 'জীবাণুনাশক স্প্রে ও ফিনাইল', 'কিচেন ক্লিনার', 'ফার্নিচার পলিশ']
      },
      {
        name: 'Cleaning Accessories',
        name_bn: 'পরিষ্কারের সরঞ্জাম',
        slug: 'cleaning-accessories',
        items: ['Floor Mops & Wipers', 'Brooms & Dustpans', 'Scrubbers & Sponges', 'Cleaning Cloths & Dusters', 'Toilet Brushes', 'Rubber Gloves'],
        items_bn: ['ফ্লোর মপ ও ওয়াইপার', 'ঝাড়ু ও ডাস্টপ্যান', 'স্ক্রাবার ও স্পঞ্জ', 'মুছার কাপড় ও ডাস্টার', 'টয়লেট ব্রাশ', 'ক্লিনিং রাবার গ্লাভস']
      },
      {
        name: 'Air Fresheners',
        name_bn: 'এয়ার ফ্রেশনার',
        slug: 'air-fresheners',
        items: ['Room Spray', 'Aerosol Freshener', 'Gel Freshener', 'Toilet Fresheners / Odonil', 'Electric Diffusers', 'Car Freshener'],
        items_bn: ['রুম স্প্রে', 'অ্যারোসল ফ্রেশনার', 'জেল ফ্রেশনার', 'টয়লেট ফ্রেশনার ও ওডোনিল', 'ডিফিউজার ও রিফিল', 'কার ফ্রেশনার']
      },
      {
        name: 'Disposables & Trash Bags',
        name_bn: 'ডিসপোজেবল ও ট্র্যাশ ব্যাগ',
        slug: 'disposables-trash-bags',
        items: ['Garbage Bags', 'Drawstring Trash Bags', 'Aluminum Foil', 'Cling Film / Food Wrap', 'Disposable Gloves', 'Disposable Food Boxes'],
        items_bn: ['ময়লার ব্যাগ / ট্র্যাশ ব্যাগ', 'ড্রস্ট্রিং ডাস্টবিন ব্যাগ', 'অ্যালুমিনিয়াম ফয়েল', 'ফুড র‍্যাপিং পেপার / ক্লিঙ ফিল্ম', 'ডিসপোজেবল গ্লাভস', 'ডিসপোজেবল বক্স']
      },
      {
        name: 'Shoe Care',
        name_bn: 'জুতার যত্ন',
        slug: 'shoe-care',
        items: ['Black Shoe Polish', 'Brown Shoe Polish', 'Shoe Shiner Sponge', 'Liquid Shoe Polish', 'Shoe Brush', 'Shoe Cream'],
        items_bn: ['কালো জুতার পলিশ', 'বাদামী জুতার পলিশ', 'ইনস্ট্যান্ট জুতার শাইনার', 'লিকুইড শু পলিশ', 'জুতার ব্রাশ', 'শু ক্রিম']
      },
      {
        name: 'Trash Bin & Basket',
        name_bn: 'ডাস্টবিন ও ঝুড়ি',
        slug: 'trash-bin-basket',
        items: ['Pedal Trash Bins', 'Open Waste Bins', 'Bathroom Dustbins', 'Laundry Baskets', 'Storage Baskets'],
        items_bn: ['প্যাডেল ডাস্টবিন', 'ওপেন ডাস্টবিন', 'বাথরুমের ছোট বিন', 'লন্ড্রি বাস্কেট', 'স্টোরেজ ঝুড়ি']
      }
    ]
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    name: 'Stationery & Lifestyle',
    name_bn: 'স্টেশনারি ও লাইফস্টাইল',
    slug: 'stationery-lifestyle',
    icon: '✏️',
    icon_name: 'menu_book',
    description: 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি',
    description_bn: 'খাতা, কলম, ফাইল, ব্যাটারি, লাইটার ও গৃহস্থালি টুকিটাকি',
    sort_order: 7,
    is_active: true,
    item_count: 22,
    level: 1,
    subcategories: [
      {
        name: 'Pens & Writing',
        name_bn: 'কলম ও লেখার সামগ্রী',
        slug: 'pens-writing',
        items: ['Ballpoint Pens', 'Gel Pens', 'Pencils', 'Highlighters', 'Permanent Markers', 'Whiteboard Markers'],
        items_bn: ['বলপয়েন্ট কলম', 'জেল কলম', 'পেন্সিল', 'হাইলাইটার', 'স্থায়ী মার্কার', 'হোয়াইটবোর্ড মার্কার']
      },
      {
        name: 'Notebooks & Paper',
        name_bn: 'খাতা ও কাগজ',
        slug: 'notebooks-paper',
        items: ['Exercise Books', 'Spiral Notebooks', 'Sticky Notes', 'A4 Paper', 'Diary & Planners'],
        items_bn: ['খাতা', 'স্পাইরাল নোটবুক', 'স্টিকি নোট', 'এ৪ পেপার', 'ডায়েরি ও প্ল্যানার']
      },
      {
        name: 'Office Supplies',
        name_bn: 'অফিস সামগ্রী',
        slug: 'office-supplies',
        items: ['Staplers & Pins', 'Paper Clips', 'Scissors & Cutters', 'Glue & Adhesive Tape', 'Calculators', 'Files & Folders'],
        items_bn: ['স্ট্যাপলার ও পিন', 'পেপার ক্লিপ', 'কাঁচি ও কাটার', 'আঠা ও স্কচটেপ', 'ক্যালকুলেটর', 'ফাইল ও ফোল্ডার']
      },
      {
        name: 'Art & Craft',
        name_bn: 'আর্ট ও ক্রাফট',
        slug: 'art-craft',
        items: ['Color Pencils', 'Crayons', 'Watercolor Sets', 'Sketchbooks', 'Craft Paper'],
        items_bn: ['রং পেন্সিল', 'মোম রং / ক্রেয়ন', 'জলরং সেট', 'স্কেচবুক', 'ক্রাফট পেপার']
      },
      {
        name: 'Party Supplies',
        name_bn: 'পার্টি সামগ্রী',
        slug: 'party-supplies',
        items: ['Balloons', 'Birthday Candles', 'Party Poppers', 'Disposable Plates & Cups', 'Gift Wraps & Bags'],
        items_bn: ['বেলুন', 'জন্মদিনের মোমবাতি', 'পার্টি পপার', 'ডিসপোজেবল প্লেট ও কাপ', 'গিফট র‍্যাপ ও ব্যাগ']
      }
    ]
  }
]

// Backward-compatible alias resolver for older product slugs
// Exactly 7 Allowed Main Category Slugs (as strictly required)
export const ALLOWED_MAIN_SLUGS = [
  'dairy-eggs',
  'cooking-essentials',
  'snacks-beverages',
  'baby-care',
  'beauty-personal-care',
  'cleaning-household',
  'stationery-lifestyle'
]

// Backward-compatible alias resolver for older product slugs
export const LEGACY_CATEGORY_MAP = {
  'rice-dal': { mainSlug: 'cooking-essentials', subcat: 'Rice' },
  'edible-oil': { mainSlug: 'cooking-essentials', subcat: 'Cooking Oil' },
  'spices': { mainSlug: 'cooking-essentials', subcat: 'Spices' },
  'flour': { mainSlug: 'cooking-essentials', subcat: 'Flour' },
  'essentials': { mainSlug: 'cooking-essentials', subcat: 'Salt & Sugar' },
  'snacks-tea': { mainSlug: 'snacks-beverages', subcat: 'Tea & Coffee' },
  'soap-cleaning': { mainSlug: 'cleaning-household', subcat: 'Laundry' },
  'cleaning-supplies': { mainSlug: 'cleaning-household', subcat: 'Dishwashing Supplies' },
  'laundry-detergent': { mainSlug: 'cleaning-household', subcat: 'Laundry' },
  'dishwashing': { mainSlug: 'cleaning-household', subcat: 'Dishwashing Supplies' },
  'floor-surface-cleaner': { mainSlug: 'cleaning-household', subcat: 'Floor & Glass Cleaners' },
  'toilet-cleaner': { mainSlug: 'cleaning-household', subcat: 'Toilet Cleaners' },
  'tissue-paper': { mainSlug: 'cleaning-household', subcat: 'Napkins & Paper Products' },
  'garbage-bags': { mainSlug: 'cleaning-household', subcat: 'Disposables & Trash Bags' },
}

// Helper to extract Level 2 subcategories for a given main category
export function getLevel2Subcategories(category) {
  if (!category || !category.subcategories) return []
  return category.subcategories.map(sub => {
    if (typeof sub === 'string') {
      return {
        name: sub,
        name_bn: sub,
        slug: sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        items: [],
        items_bn: []
      }
    }
    return sub
  })
}

// Helper to extract Level 3 child items for a specific subcategory
export function getLevel3Items(category, subcategoryNameOrSlug) {
  if (!category || !subcategoryNameOrSlug) return []
  const subcats = getLevel2Subcategories(category)
  const matched = subcats.find(s => 
    s.slug === subcategoryNameOrSlug || 
    s.name?.toLowerCase() === subcategoryNameOrSlug.toLowerCase() || 
    s.name_bn === subcategoryNameOrSlug
  )
  if (!matched || !matched.items) return []
  return matched.items.map((item, idx) => ({
    name: item,
    name_bn: matched.items_bn?.[idx] || item,
    slug: item.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }))
}

// Generate flattened 3-level list for database inserts with parent_id, parent_category_id & level
export function generateFlatCategoryList() {
  const flat = []

  DEFAULT_CATEGORIES.forEach((mainCat, mainIdx) => {
    // Level 1: Main Category
    const mainId = mainCat.id
    flat.push({
      id: mainId,
      name: mainCat.name,
      name_bn: mainCat.name_bn,
      slug: mainCat.slug,
      icon: mainCat.icon,
      icon_name: mainCat.icon_name,
      description: mainCat.description,
      description_bn: mainCat.description_bn,
      parent_id: null,
      parent_category_id: null,
      level: 1,
      sort_order: mainIdx + 1,
      is_active: true,
      subcategories: mainCat.subcategories.map(s => s.name_bn || s.name),
    })

    // Level 2: Subcategories
    mainCat.subcategories.forEach((sub, subIdx) => {
      const subId = `c2000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-000000000000`
      flat.push({
        id: subId,
        name: sub.name,
        name_bn: sub.name_bn,
        slug: `${mainCat.slug}-${sub.slug}`,
        icon: mainCat.icon,
        icon_name: mainCat.icon_name,
        description: `${sub.name_bn || sub.name} - ${mainCat.name_bn}`,
        description_bn: `${sub.name_bn || sub.name} - ${mainCat.name_bn}`,
        parent_id: mainId,
        parent_category_id: mainId,
        level: 2,
        sort_order: subIdx + 1,
        is_active: true,
        subcategories: sub.items_bn || sub.items || [],
      })

      // Level 3: Child Subcategories / Specific Product Types
      if (sub.items && sub.items.length > 0) {
        sub.items.forEach((item, itemIdx) => {
          const itemBn = sub.items_bn?.[itemIdx] || item
          const itemSlug = `${mainCat.slug}-${sub.slug}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          const itemId = `c3000000-${String(mainIdx + 1).padStart(4, '0')}-${String(subIdx + 1).padStart(4, '0')}-${String(itemIdx + 1).padStart(4, '0')}0000`
          flat.push({
            id: itemId,
            name: item,
            name_bn: itemBn,
            slug: itemSlug,
            icon: mainCat.icon,
            icon_name: mainCat.icon_name,
            description: `${itemBn} - ${sub.name_bn || sub.name}`,
            description_bn: `${itemBn} - ${sub.name_bn || sub.name}`,
            parent_id: subId,
            parent_category_id: mainId,
            level: 3,
            sort_order: itemIdx + 1,
            is_active: true,
            subcategories: [],
          })
        })
      }
    })
  })

  return flat
}

export default DEFAULT_CATEGORIES
