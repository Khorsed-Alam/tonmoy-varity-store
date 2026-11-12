/**
 * Universal Multi-lingual Grocery Search Utility
 * Supports Bengali (বাংলা), English, and Banglish (phonetic Romanized Bengali).
 *
 * Examples:
 * - "chal" / "chaal" / "chawl" / "চাল" / "rice" -> matches Rice products
 * - "dal" / "daal" / "ডাল" / "lentil" -> matches Dal / Lentil products
 * - "tel" / "teyl" / "তেল" / "oil" / "soybean" -> matches Cooking oil
 * - "chini" / "cheeni" / "চিনি" / "sugar" -> matches Sugar
 * - "lobon" / "noon" / "লবণ" / "salt" -> matches Salt
 * - "alu" / "aaloo" / "আলু" / "potato" -> matches Potatoes
 * - "peyaj" / "piyaj" / "পেঁয়াজ" / "onion" -> matches Onions
 * - "roshun" / "roson" / "রসুন" / "garlic" -> matches Garlic
 * - "ata" / "aatta" / "আটা" / "flour" -> matches Atta / Flour
 * - "moyda" / "maida" / "ময়দা" -> matches Maida
 * - "suji" / "soojee" / "সুজি" / "semolina" -> matches Semolina
 * - "mosla" / "moshla" / "মসলা" / "spices" -> matches Spices (holud, morich, jira...)
 * - "shaban" / "saban" / "সাবান" / "soap" -> matches Soap & Detergent
 * - "shampu" / "shampoo" / "শ্যাম্পু" -> matches Shampoo
 * - "dudh" / "doodh" / "দুধ" / "milk" -> matches Milk & Powder milk
 * - "dim" / "deem" / "ডিম" / "egg" -> matches Eggs
 * - "biskut" / "বিস্কুট" / "biscuit" -> matches Biscuits & Cookies
 * - "cha" / "চা" / "tea" -> matches Tea
 */

// Normalized synonym groups: each word in a group expands to all other words in the same group
export const SYNONYM_GROUPS = [
  // Rice
  ['chal', 'chaal', 'chawl', 'cal', 'rice', 'bhat', 'bhaat', 'চাল', 'ভাত', 'মিনিকেট', 'নাজিরশাইল', 'চিনিগুড়া', 'চিনিগুড়া', 'পাইজাম', 'আতপ', 'পোলাও', 'পোলাওয়ের চাল', 'miniket', 'nazirshail', 'chinigura', 'paijam', 'atap', 'polao'],
  
  // Dal / Pulses
  ['dal', 'daal', 'dhal', 'lentil', 'lentils', 'pulse', 'pulses', 'ডাল', 'মসুর', 'মুগ', 'খেসারি', 'ছোলা', 'বুট', 'অড়হড়', 'moshur', 'mosur', 'masur', 'moog', 'mug', 'kheshari', 'chola', 'boot', 'chana'],
  
  // Cooking Oil & Ghee
  ['tel', 'teyl', 'tail', 'oil', 'edible oil', 'তেল', 'সয়াবিন', 'সয়াবিন', 'সরিষা', 'সরিষার তেল', 'রাইস ব্রান', 'তিল', 'তিলের তেল', 'soybean', 'soyabean', 'soya', 'mustard', 'sharisha', 'sorisha', 'shorisha', 'rice bran'],
  ['ghee', 'ghi', 'makhan', 'butter', 'ঘি', 'মাখন', 'aarong ghee', 'baghabari', 'clarified butter'],

  // Sugar & Salt
  ['chini', 'cheeni', 'cini', 'sugar', 'white sugar', 'brown sugar', 'deshi chini', 'চিনি', 'লাল চিনি', 'দেশি চিনি', 'গুড়', 'গুড়', 'gur', 'gud', 'jaggery', 'molasses'],
  ['lobon', 'lobun', 'laban', 'noon', 'nun', 'salt', 'pure salt', 'iodized salt', 'vacuum salt', 'লবণ', 'নুন', 'বিট লবণ', 'bit lobon', 'aci salt', 'molla salt'],

  // Flours & Grains
  ['ata', 'atta', 'aatta', 'flour', 'wheat flour', 'আটা', 'গম', 'গমের আটা', 'লাল আটা', 'teer atta', 'fresh atta'],
  ['moyda', 'maida', 'all purpose flour', 'ময়দা', 'ময়দা', 'white flour', 'refined flour'],
  ['suji', 'sooji', 'soojee', 'semolina', 'সুজি'],
  ['chira', 'chida', 'flattened rice', 'চিঁড়া', 'চিড়া', 'চিড়া'],
  ['muri', 'puffed rice', 'মুড়ি', 'মুড়ি'],

  // Spices & Condiments
  ['mosla', 'moshla', 'masala', 'spice', 'spices', 'curry powder', 'মসলা', 'মশলা', 'গুঁড়া মসলা', 'মিক্স মসলা'],
  ['holud', 'haldi', 'turmeric', 'yellow powder', 'হলুদ', 'হলুদের গুঁড়া', 'হলুদের গুড়া'],
  ['morich', 'moris', 'marich', 'chili', 'chilli', 'chilly', 'pepper', 'red chili', 'green chili', 'kacha morich', 'shukna morich', 'ঝাল', 'মরিচ', 'মরিচের গুঁড়া', 'মরিচের গুড়া', 'কাঁচা মরিচ', 'শুকনা মরিচ'],
  ['jira', 'jeera', 'zeera', 'cumin', 'cumin powder', 'জিরা', 'জিরার গুঁড়া', 'জিরার গুড়া'],
  ['dhonia', 'dhone', 'dhania', 'coriander', 'coriander powder', 'ধনিয়া', 'ধনে', 'ধনে গুঁড়া'],
  ['ada', 'adhaa', 'ginger', 'আদা', 'আদা বাটা'],
  ['roshun', 'roson', 'roshon', 'garlic', 'রসুন', 'রসুন বাটা'],
  ['peyaj', 'piyaj', 'piaj', 'peaj', 'pyaj', 'onion', 'onions', 'shallot', 'পেঁয়াজ', 'পিয়াজ', 'পেঁয়াজ'],
  ['alu', 'aaloo', 'aloo', 'potato', 'potatoes', 'আলু', 'গোল আলু'],
  ['elach', 'elachi', 'elaichi', 'cardamom', 'green cardamom', 'এলাচ', 'এলাচি'],
  ['daruchini', 'darchini', 'cinnamon', 'দারুচিনি'],
  ['lobongo', 'long', 'clove', 'cloves', 'লবঙ্গ'],
  ['tejpata', 'bay leaf', 'bay leaves', 'তেজপাতা'],
  ['gol morich', 'black pepper', 'গোল মরিচ', 'গোলমরিচ'],
  ['panch phoron', 'panchforon', 'পাঁচফোড়ন', 'পাঁচফোড়ন'],
  ['radhuni', 'রাঁধুনী', 'রাধুনি'],

  // Tea, Coffee & Beverages
  ['cha', 'chay', 'tea', 'tea bag', 'চা', 'চা পাতা', 'ispahani', 'taaza', 'finlay', 'mirzapore', 'green tea', 'গ্রিন টি'],
  ['kofi', 'coffee', 'nescafe', 'কফি'],
  ['dudh', 'doodh', 'milk', 'powder milk', 'liquid milk', 'cow milk', 'দুধ', 'গুঁড়ো দুধ', 'গুড়ো দুধ', 'তরল দুধ', 'dano', 'marks', 'diploma', 'fresh milk', 'aarong milk'],
  ['dim', 'deem', 'egg', 'eggs', 'farm egg', 'chicken egg', 'duck egg', 'ডিম', 'মুরগির ডিম', 'হাঁসের ডিম', 'ফার্মের ডিম', 'দেশি ডিম'],
  ['pani', 'water', 'mineral water', 'drinking water', 'পানি', 'জল', 'মিনারেল ওয়াটার', 'mum', 'kinley', 'spa'],
  ['juice', 'mango juice', 'orange juice', 'জুস', 'ম্যাংগো জুস', 'fruto', 'shezan', 'pran juice'],
  ['coke', 'coca cola', 'cola', 'pepsi', '7up', 'seven up', 'sprite', 'mojo', 'কোক', 'পেপসি', 'সেভেন আপ', 'মোজো'],

  // Snacks & Bakery
  ['biskut', 'biscuit', 'biscuits', 'cookie', 'cookies', 'cracker', 'crackers', 'toast', 'বিস্কুট', 'টোস্ট', 'কুকিজ', 'lexus', 'energy plus', 'dry cake', 'কেক'],
  ['chanachur', 'chanachoor', 'bombay sweets', 'চানাচুর', 'ঝাল চানাচুর', 'মিষ্টি চানাচুর'],
  ['chips', 'crisps', 'potata', 'kurkure', 'lays', 'চিপস', 'আলুর চিপস'],
  ['noodles', 'nuduls', 'nudles', 'maggi', 'doodles', 'নুডলস', 'ম্যাগি', 'ডুডলস', 'spaghetti', 'পাস্তা', 'pasta', 'macaroni', 'ম্যাকারনি'],
  ['shemai', 'semai', 'vermicelli', 'সেমাই', 'লাচ্ছা সেমাই', 'laccha semai'],
  ['misti', 'sweets', 'মিষ্টি'],
  ['chocolate', 'chocolates', 'chocobar', 'চকলেট'],

  // Cleaning, Hygiene & Personal Care
  ['shaban', 'saban', 'soap', 'bath soap', 'laundry soap', 'সাবান', 'গোসলের সাবান', 'কাপড় কাচা সাবান', 'lux', 'lifebuoy', 'dettol', 'savlon', 'sandalina', 'tibet'],
  ['detergent', 'washing powder', 'ডিটারজেন্ট', 'হুইল', 'সার্ফ এক্সেল', 'wheel', 'surf excel', 'surf', 'rin', 'chaka', 'tide', 'ariel'],
  ['dishwash', 'dish wash', 'vim', 'vim bar', 'vim liquid', 'ভিম', 'ডিশওয়াশ', 'বাসন মাজার সাবান'],
  ['harpic', 'toilet cleaner', 'bathroom cleaner', 'হারপিক', 'টয়লেট ক্লিনার', 'ক্লিনার'],
  ['shampu', 'shampoo', 'শ্যাম্পু', 'sunsilk', 'clear', 'dove', 'pantene', 'head & shoulders'],
  ['paste', 'toothpaste', 'tooth paste', 'দাঁতের পেস্ট', 'টুথপেস্ট', 'পেস্ট', 'close up', 'colgate', 'pepsodent', 'meswak', 'sensodyne'],
  ['brush', 'toothbrush', 'tooth brush', 'টুথব্রাশ', 'ব্রাশ'],
  ['tissue', 'facial tissue', 'toilet tissue', 'kitchen towel', 'টিস্যু', 'বসুন্ধরা টিস্যু', 'bashundhara'],
  ['diaper', 'pampers', 'baby diaper', 'ডায়াপার', 'প্যাম্পার্স'],
  ['pad', 'sanitary napkin', 'whisper', 'senora', 'প্যাড', 'স্যানিটারি ন্যাপকিন'],
  ['handwash', 'hand wash', 'হ্যান্ডওয়াশ', 'হ্যান্ড ওয়াশ'],
  ['coconut oil', 'narikel tel', 'parachute', 'নারকেল তেল', 'প্যারাস্যুট'],

  // Popular Grocery Brands
  ['teer', 'তীর'],
  ['fresh', 'ফ্রেশ'],
  ['rupchanda', 'রূপচাঁদা', 'রুপচাদা'],
  ['radhuni', 'রাঁধুনী', 'রাধুনি'],
  ['aci', 'এসিআই'],
  ['pran', 'প্রাণ'],
  ['bashundhara', 'বসুন্ধরা'],
  ['marks', 'মার্কস'],
  ['dano', 'ডানো'],
  ['aarong', 'আড়ং', 'আড়ং'],
  ['maggi', 'ম্যাগি'],
  ['nestle', 'নেসলে'],
  ['unilever', 'ইউনিলিভার'],
  ['square', 'স্কয়ার', 'স্কয়ার'],

  // Units
  ['kg', 'kilo', 'kilogram', 'কেজি', 'কিলোগ্রাম', 'কে.জি'],
  ['gm', 'g', 'gram', 'গ্রাম'],
  ['ltr', 'liter', 'litre', 'লিটার'],
  ['ml', 'milli', 'মিলি'],
  ['pcs', 'piece', 'টা', 'টি', 'পিস'],
  ['packet', 'pkt', 'প্যাকেট'],
  ['box', 'বক্স'],
  ['hali', 'হালি'],
  ['dozen', 'ডজন'],
]

// Pre-built index mapping every normalized term -> array of synonyms
const KEYWORD_SYNONYM_MAP = new Map()

// Populate lookup index
for (const group of SYNONYM_GROUPS) {
  const normalizedGroup = group.map(w => w.toLowerCase().trim()).filter(Boolean)
  for (const word of normalizedGroup) {
    if (!KEYWORD_SYNONYM_MAP.has(word)) {
      KEYWORD_SYNONYM_MAP.set(word, new Set())
    }
    const set = KEYWORD_SYNONYM_MAP.get(word)
    for (const other of normalizedGroup) {
      set.add(other)
    }
  }
}

/**
 * Phonetically simplify a Banglish word to match spelling variations
 * (e.g. chaal -> chal, doodh -> dudh, piyaj/peyaj -> piaj, shaban -> saban)
 */
export function phoneticBanglish(word) {
  if (!word || typeof word !== 'string') return ''
  let s = word.toLowerCase().trim()

  // Replace double vowels
  s = s.replace(/aa+/g, 'a')
  s = s.replace(/ee+/g, 'i')
  s = s.replace(/oo+/g, 'u')
  s = s.replace(/ou+/g, 'u')

  // Common Banglish consonant equivalences
  s = s.replace(/sh/g, 's')
  s = s.replace(/kh/g, 'k')
  s = s.replace(/gh/g, 'g')
  s = s.replace(/ch/g, 'c')
  s = s.replace(/jh/g, 'j')
  s = s.replace(/th/g, 't')
  s = s.replace(/dh/g, 'd')
  s = s.replace(/ph/g, 'f')
  s = s.replace(/bh/g, 'b')
  s = s.replace(/z/g, 'j')

  // Vowel variations
  s = s.replace(/ey/g, 'i')
  s = s.replace(/ay/g, 'e')
  s = s.replace(/oy/g, 'oi')
  s = s.replace(/y/g, 'i')
  s = s.replace(/w/g, 'o')
  s = s.replace(/v/g, 'b')

  return s
}

/**
 * Expand a single token into its matched synonyms (Bengali, English, and Banglish)
 */
export function expandToken(token) {
  const clean = token.toLowerCase().trim()
  if (!clean) return []

  const results = new Set([clean])

  // Direct dictionary hit
  if (KEYWORD_SYNONYM_MAP.has(clean)) {
    for (const syn of KEYWORD_SYNONYM_MAP.get(clean)) {
      results.add(syn)
    }
  }

  // Check phonetic variations against dictionary keys
  const phon = phoneticBanglish(clean)
  if (phon && phon !== clean) {
    results.add(phon)
    if (KEYWORD_SYNONYM_MAP.has(phon)) {
      for (const syn of KEYWORD_SYNONYM_MAP.get(phon)) {
        results.add(syn)
      }
    }
    // Also check if any key in map has the same phonetic
    for (const [key, synSet] of KEYWORD_SYNONYM_MAP.entries()) {
      if (phoneticBanglish(key) === phon) {
        for (const syn of synSet) {
          results.add(syn)
        }
      }
    }
  }

  return Array.from(results)
}

/**
 * Expand a full search query into sets of token alternatives.
 */
export function expandQuery(query) {
  if (!query || typeof query !== 'string') return []
  // Split query into individual words/tokens
  const rawTokens = query.toLowerCase().trim().split(/[\s,+/_-]+/).filter(Boolean)
  return rawTokens.map(expandToken)
}

/**
 * Build a unified searchable string from a product object
 */
export function buildProductSearchIndex(product) {
  if (!product) return ''
  const parts = [
    product.name || '',
    product.name_bn || '',
    product.description || '',
    product.unit || '',
    product.brand || '',
    product.subcategory || '',
    product.child_subcategory || '',
    product.tag || '',
    product.category_slug || '',
    product.categories?.name || '',
    product.categories?.name_bn || '',
    product.categories?.slug || '',
  ]

  // Add phonetic representations of english names
  const enPhonetic = phoneticBanglish(product.name || '')
  if (enPhonetic) parts.push(enPhonetic)

  return parts.join(' ').toLowerCase()
}

/**
 * Helper to test if a variant matches product text.
 * For short words (length <= 3 in English/ASCII or length <= 2 in Bengali), we enforce
 * boundary match so that "cha" does not falsely match inside "rupchanda", and "চা" does not match inside "চাল".
 */
function textMatchesVariant(productText, variant) {
  if (!productText || !variant) return false

  // For short words (length <= 3): test word boundaries
  if (variant.length <= 3) {
    try {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp('(^|[^\\p{L}\\p{N}])' + escaped + '($|[^\\p{L}\\p{N}])', 'u')
      return regex.test(productText)
    } catch {
      return productText.includes(variant)
    }
  }

  // For words length 4+: standard substring match
  if (productText.includes(variant)) return true

  // Also check phonetic match for Banglish words (e.g. moshla -> mosla)
  const pPhon = phoneticBanglish(variant)
  if (pPhon && pPhon.length >= 4 && productText.includes(pPhon)) {
    return true
  }

  return false
}

/**
 * Universal matcher for product search.
 * Returns true if the product matches the user's search query across
 * Bengali, English, and Banglish words.
 *
 * Rule: EVERY token in user query must have at least one synonym or variant
 * present in the product's search index.
 */
export function matchProductSearch(product, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return true
  if (!product) return false

  const tokenVariantsList = expandQuery(searchQuery)
  if (tokenVariantsList.length === 0) return true

  const productText = buildProductSearchIndex(product)

  // Every token from user query must match at least one of its variants
  return tokenVariantsList.every(variants => {
    return variants.some(variant => textMatchesVariant(productText, variant))
  })
}

/**
 * Order search matcher for Admin & Customer
 */
export function matchOrderSearch(order, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return true
  if (!order) return false

  const s = searchQuery.toLowerCase().trim()
  const orderNum = (order.order_number || '').toLowerCase()
  const name = (order.full_name || '').toLowerCase()
  const phone = (order.phone || '').toLowerCase()
  const address = (order.shipping_address || '').toLowerCase()
  const id = String(order.id || '').toLowerCase()

  // Remove leading +88 or 88 from phone for flexible matching
  const cleanPhone = phone.replace(/^\+?88/, '')
  const cleanQuery = s.replace(/^\+?88/, '')

  return (
    orderNum.includes(s) ||
    name.includes(s) ||
    phone.includes(s) ||
    cleanPhone.includes(cleanQuery) ||
    address.includes(s) ||
    id.includes(s)
  )
}
