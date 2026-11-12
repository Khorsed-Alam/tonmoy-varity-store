import { matchProductSearch } from '../src/lib/searchUtils.js'

const products = [
  { id: 1, name: 'Miniket Rice 25kg', name_bn: 'মিনিকেট চাল ২৫ কেজি', category_slug: 'cooking-essentials' },
  { id: 2, name: 'Rupchanda Fortified Soybean Oil 5 Liter', name_bn: 'রূপচাঁদা ফর্টিফাইড সয়াবিন তেল ৫ লিটার', category_slug: 'cooking-essentials' },
  { id: 3, name: 'ACI Pure Salt 1kg', name_bn: 'এসিআই পিওর লবণ ১ কেজি', category_slug: 'cooking-essentials' },
  { id: 4, name: 'Deshi Sugar 1kg', name_bn: 'দেশি চিনি ১ কেজি', category_slug: 'cooking-essentials' },
  { id: 5, name: 'Teer Whole Wheat Atta 2kg', name_bn: 'তীর আটা ২ কেজি', category_slug: 'cooking-essentials' },
  { id: 6, name: 'Red Lentil (Mosur Dal) 1kg', name_bn: 'মসুর ডাল ১ কেজি', category_slug: 'cooking-essentials' },
  { id: 7, name: 'Potato 1kg', name_bn: 'গোল আলু ১ কেজি', category_slug: 'cooking-essentials' },
  { id: 8, name: 'Local Onion 1kg', name_bn: 'দেশি পেঁয়াজ ১ কেজি', category_slug: 'cooking-essentials' },
  { id: 9, name: 'Wheel Soap 130g', name_bn: 'হুইল সাবান ১৩০ গ্রাম', category_slug: 'cleaning' },
  { id: 10, name: 'Farm Egg 1 Hali (4 pcs)', name_bn: 'ফার্মের ডিম ১ হালি (৪ টি)', category_slug: 'dairy-eggs' },
  { id: 11, name: 'Marks Full Cream Milk Powder 500g', name_bn: 'মার্কস ফুল ক্রিম মিল্ক পাউডার ৫০০ গ্রাম', category_slug: 'dairy-eggs' },
  { id: 12, name: 'Lexus Biscuit 200g', name_bn: 'লেক্সাস বিস্কুট ২০০ গ্রাম', category_slug: 'snacks' },
  { id: 13, name: 'Ispahani Mirzapore Tea 400g', name_bn: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম', category_slug: 'snacks' },
  { id: 14, name: 'Radhuni Turmeric Powder 200g', name_bn: 'রাঁধুনী হলুদের গুঁড়া ২০০ গ্রাম', category_slug: 'cooking-essentials' },
  { id: 15, name: 'Pran Garlic 500g', name_bn: 'রসুন ৫০০ গ্রাম', category_slug: 'cooking-essentials' },
]

const testQueries = [
  // Bengali queries
  { q: 'চাল', expectId: 1 },
  { q: 'তেল', expectId: 2 },
  { q: 'লবণ', expectId: 3 },
  { q: 'চিনি', expectId: 4 },
  { q: 'আটা', expectId: 5 },
  { q: 'ডাল', expectId: 6 },
  { q: 'আলু', expectId: 7 },
  { q: 'পেঁয়াজ', expectId: 8 },
  { q: 'সাবান', expectId: 9 },
  { q: 'ডিম', expectId: 10 },
  { q: 'দুধ', expectId: 11 },
  { q: 'বিস্কুট', expectId: 12 },
  { q: 'চা', expectId: 13 },
  { q: 'হলুদ', expectId: 14 },
  { q: 'রসুন', expectId: 15 },

  // English queries
  { q: 'rice', expectId: 1 },
  { q: 'oil', expectId: 2 },
  { q: 'salt', expectId: 3 },
  { q: 'sugar', expectId: 4 },
  { q: 'flour', expectId: 5 },
  { q: 'lentil', expectId: 6 },
  { q: 'potato', expectId: 7 },
  { q: 'onion', expectId: 8 },
  { q: 'soap', expectId: 9 },
  { q: 'egg', expectId: 10 },
  { q: 'milk', expectId: 11 },
  { q: 'biscuit', expectId: 12 },
  { q: 'tea', expectId: 13 },
  { q: 'turmeric', expectId: 14 },
  { q: 'garlic', expectId: 15 },

  // Banglish queries (single word)
  { q: 'chal', expectId: 1 },
  { q: 'chaal', expectId: 1 },
  { q: 'chawl', expectId: 1 },
  { q: 'tel', expectId: 2 },
  { q: 'teyl', expectId: 2 },
  { q: 'lobon', expectId: 3 },
  { q: 'noon', expectId: 3 },
  { q: 'chini', expectId: 4 },
  { q: 'cheeni', expectId: 4 },
  { q: 'ata', expectId: 5 },
  { q: 'aatta', expectId: 5 },
  { q: 'dal', expectId: 6 },
  { q: 'daal', expectId: 6 },
  { q: 'alu', expectId: 7 },
  { q: 'aaloo', expectId: 7 },
  { q: 'peyaj', expectId: 8 },
  { q: 'piyaj', expectId: 8 },
  { q: 'shaban', expectId: 9 },
  { q: 'saban', expectId: 9 },
  { q: 'dim', expectId: 10 },
  { q: 'deem', expectId: 10 },
  { q: 'dudh', expectId: 11 },
  { q: 'doodh', expectId: 11 },
  { q: 'biskut', expectId: 12 },
  { q: 'holud', expectId: 14 },
  { q: 'roshun', expectId: 15 },

  // Multi-term queries
  { q: 'teer ata', expectId: 5 },
  { q: 'rupchanda tel', expectId: 2 },
  { q: 'miniket chal', expectId: 1 },
  { q: 'mosur dal', expectId: 6 },
  { q: 'aci lobon', expectId: 3 },
]

console.log('--- Testing Multi-lingual Universal Search ---')
let passed = 0
let failed = 0

for (const test of testQueries) {
  const matches = products.filter(p => matchProductSearch(p, test.q))
  const found = matches.some(p => p.id === test.expectId)
  if (found) {
    passed++
    console.log(`[PASS] "${test.q}" matched product #${test.expectId} (${matches[0].name})`)
  } else {
    failed++
    console.error(`[FAIL] "${test.q}" did not match product #${test.expectId}! Found: ${matches.map(m => m.name).join(', ') || 'none'}`)
  }
}

console.log(`\nSummary: ${passed}/${testQueries.length} passed. Failed: ${failed}`)
if (failed > 0) process.exit(1)

