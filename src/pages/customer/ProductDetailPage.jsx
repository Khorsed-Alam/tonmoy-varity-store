import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  Truck,
  ShieldCheck,
  Scale,
  Sparkles,
  PhoneCall
} from 'lucide-react'
import { supabaseClient as supabase } from '../../lib/supabaseClient'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../../lib/utils'
import { useProductSync } from '../../lib/syncEvents'
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_MAP } from '../../data/categories'
import toast from 'react-hot-toast'

// Helper to extract base product name for matching
function getBaseName(text = '') {
  return text
    .replace(/[০-৯0-9]+\s*(?:গ্রাম|কেজি|লিটার|মিলি|প্যাক|পিস|gm|g|kg|ltr|l|ml|pcs|pack)/gi, '')
    .trim()
}

// Helper to detect Level 3 category from product or category data
function detectLevel3(product) {
  if (!product) return ''
  if (product.child_subcategory && product.child_subcategory.trim()) {
    return product.child_subcategory.trim()
  }
  if (product.tag && product.tag.trim()) {
    return product.tag.trim()
  }
  // Try matching items_bn in DEFAULT_CATEGORIES
  const text = `${product.name_bn || ''} ${product.name || ''}`.toLowerCase()
  for (const cat of DEFAULT_CATEGORIES) {
    for (const sub of cat.subcategories || []) {
      if (sub.items_bn) {
        for (const itemBn of sub.items_bn) {
          if (text.includes(itemBn.toLowerCase())) return itemBn
        }
      }
      if (sub.items) {
        for (const itemEn of sub.items) {
          if (text.includes(itemEn.toLowerCase())) return itemEn
        }
      }
    }
  }
  return ''
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { addItem, items, updateQuantity } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])

  // Main product loader with cross-catalog level 3 category suggestions
  const loadProduct = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch current product
      let currentItem = null
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_bn, slug)')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        currentItem = data
      } else {
        const { data: rawItem } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (rawItem) currentItem = rawItem
      }

      // Check local custom products fallback if still not found
      if (!currentItem) {
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const found = localCustom.find(p => p.id === id)
        if (found) currentItem = found
      }

      setProduct(currentItem)

      // 2. Fetch suggestions:
      // Match level 3 category across the whole database (WITHOUT category_id restriction)
      // to find different weights/sizes (e.g. 100g, 200g, 500g) of this item
      if (currentItem) {
        const level3 = detectLevel3(currentItem)
        const baseName = getBaseName(currentItem.name_bn || currentItem.name)
        const gathered = []
        const gatheredIds = new Set([currentItem.id])

        // A. Match by exact level 3 category (child_subcategory or tag)
        if (level3) {
          const { data: l3Matches } = await supabase
            .from('products')
            .select('*, categories(name, name_bn, slug)')
            .or('is_active.eq.true,is_active.is.null')
            .or(`child_subcategory.eq.${level3},tag.eq.${level3}`)
            .neq('id', currentItem.id)
            .limit(20)

          if (l3Matches) {
            for (const item of l3Matches) {
              if (!gatheredIds.has(item.id)) {
                gatheredIds.add(item.id)
                gathered.push(item)
              }
            }
          }
        }

        // B. Match by base name across all products (e.g. "রাঁধুনী মরিচের গুঁড়া")
        if (baseName && baseName.length >= 3 && gathered.length < 8) {
          const { data: nameMatches } = await supabase
            .from('products')
            .select('*, categories(name, name_bn, slug)')
            .or('is_active.eq.true,is_active.is.null')
            .ilike('name_bn', `%${baseName}%`)
            .neq('id', currentItem.id)
            .limit(15)

          if (nameMatches) {
            for (const item of nameMatches) {
              if (!gatheredIds.has(item.id)) {
                gatheredIds.add(item.id)
                gathered.push(item)
              }
            }
          }
        }

        // C. Fill remaining slots with same subcategory or category items
        if (gathered.length < 12 && (currentItem.subcategory || currentItem.category_id)) {
          let catQuery = supabase
            .from('products')
            .select('*, categories(name, name_bn, slug)')
            .or('is_active.eq.true,is_active.is.null')
            .neq('id', currentItem.id)
            .limit(20)

          if (currentItem.subcategory) {
            catQuery = catQuery.eq('subcategory', currentItem.subcategory)
          } else if (currentItem.category_id) {
            catQuery = catQuery.eq('category_id', currentItem.category_id)
          }

          const { data: catMatches } = await catQuery
          if (catMatches) {
            for (const item of catMatches) {
              if (!gatheredIds.has(item.id)) {
                gatheredIds.add(item.id)
                gathered.push(item)
              }
            }
          }
        }

        // Include local custom products that match
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        for (const loc of localCustom) {
          if (
            !gatheredIds.has(loc.id) &&
            loc.id !== currentItem.id &&
            ((level3 && (loc.child_subcategory === level3 || loc.tag === level3)) ||
              (baseName && (loc.name_bn || loc.name || '').includes(baseName)))
          ) {
            gatheredIds.add(loc.id)
            gathered.push(loc)
          }
        }

        // Sort so exact level 3 matches and price variants come first
        gathered.sort((a, b) => {
          const aL3 = a.child_subcategory === level3 || a.tag === level3 ? 0 : 1
          const bL3 = b.child_subcategory === level3 || b.tag === level3 ? 0 : 1
          if (aL3 !== bL3) return aL3 - bL3
          return (a.price || 0) - (b.price || 0)
        })

        setSuggestions(gathered)
      }
    } catch (err) {
      console.warn('Error loading product details:', err)
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const found = localCustom.find(p => p.id === id)
      if (found) setProduct(found)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProduct()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [loadProduct])

  // Real-time synchronization
  useProductSync(loadProduct)

  const cartItem = items.find(i => i.product_id === product?.id)
  const imageUrl = getProductImageUrl(supabase, product?.image_url)
  const isOutOfStock = (product?.stock_quantity ?? 1) <= 0
  const level3Name = detectLevel3(product)

  const handleAddToCart = (targetProd = product) => {
    if (!targetProd || targetProd.stock_quantity <= 0) return
    addItem({
      product_id: targetProd.id,
      name: targetProd.name,
      name_bn: targetProd.name_bn,
      price: targetProd.price,
      image_url: targetProd.image_url,
      stock_quantity: targetProd.stock_quantity,
      unit: targetProd.unit,
    })
    toast.success(t('কার্টে যোগ হয়েছে! 🛒', 'Added to cart! 🛒'))
  }

  if (loading) {
    return (
      <div className="page-container py-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="skeleton rounded-2xl aspect-square w-full" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-36 rounded" />
            <div className="skeleton h-10 w-full rounded" />
            <div className="skeleton h-8 w-28 rounded" />
            <div className="skeleton h-20 w-full rounded-xl" />
            <div className="skeleton h-12 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page-container py-20 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
          {t('পণ্যটি পাওয়া যায়নি', 'Product not found')}
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          {t('সম্ভবত পণ্যটি স্টক শেষ হয়ে গেছে বা সরানো হয়েছে। আমাদের স্টোরে অন্যান্য পণ্য দেখুন।', 'The product may be out of stock or removed. Browse other groceries in our shop.')}
        </p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('দোকানে ফিরুন', 'Back to Shop')}</span>
        </Link>
      </div>
    )
  }

  // Category breadcrumbs data
  const matchedCat = product.categories ||
    DEFAULT_CATEGORIES.find(c => c.id === product.category_id || c.slug === product.category_slug) ||
    (product.category_slug ? DEFAULT_CATEGORIES.find(c => c.slug === LEGACY_CATEGORY_MAP[product.category_slug]?.mainSlug) : null)
  const catSlug = matchedCat?.slug || product.category_slug || 'all'
  const catNameBn = matchedCat?.name_bn || matchedCat?.name || ''
  const catNameEn = matchedCat?.name || ''

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-16 pt-2">
      <div className="page-container max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        
        {/* 1. Breadcrumbs Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4 overflow-x-auto no-scrollbar py-1">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <span>{t('হোম', 'Home')}</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">
            {t('সব পণ্য', 'All Products')}
          </Link>
          {catSlug && catSlug !== 'all' && (
            <>
              <span className="text-outline-variant">/</span>
              <Link to={`/shop/category/${catSlug}`} className="hover:text-primary transition-colors font-medium">
                {t(catNameBn, catNameEn)}
              </Link>
            </>
          )}
          {product.subcategory && (
            <>
              <span className="text-outline-variant">/</span>
              <Link
                to={`/shop/category/${catSlug}?subcat=${encodeURIComponent(product.subcategory)}`}
                className="hover:text-primary transition-colors"
              >
                {product.subcategory}
              </Link>
            </>
          )}
          {level3Name && (
            <>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium">{level3Name}</span>
            </>
          )}
          <span className="text-outline-variant">/</span>
          <span className="font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">
            {t(product.name_bn || product.name, product.name)}
          </span>
        </nav>

        {/* 2. Main Product Card: Pure Single Product Only */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 md:p-8 shadow-card border border-outline-variant/30 grid md:grid-cols-2 gap-6 lg:gap-10">
          
          {/* Left: Product Image & Prominent Weight Badge */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square bg-gradient-to-b from-surface-container-low via-surface-container to-surface-container-low rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-outline-variant/20 shadow-inner group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name_bn || product.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-outline">🛒</div>
              )}

              {/* Prominent Unit/Weight Badge at Top Left */}
              {product.unit && (
                <div className="absolute top-3 left-3 bg-primary text-on-primary font-bold text-xs sm:text-sm px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 animate-fade-in">
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  <span>{product.unit}</span>
                </div>
              )}

              {/* Status / Discount Badges */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {isOutOfStock ? (
                  <span className="bg-error text-on-error text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {t('স্টক নেই', 'Out of Stock')}
                  </span>
                ) : (product.original_price || product.compare_at_price) && (product.original_price || product.compare_at_price) > product.price ? (
                  <span className="bg-error text-on-error text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    ৳{(product.original_price || product.compare_at_price) - product.price} {t('ছাড়', 'OFF')}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quick Guarantees under Image */}
            <div className="grid grid-cols-2 gap-2 w-full mt-4 text-[11px] sm:text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5 bg-surface-container p-2 rounded-xl">
                <Truck className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{t('৬০ মিনিটে ডেলিভারি', '60-Min Delivery')}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container p-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{t('১০০% খাঁটি পণ্য', '100% Quality')}</span>
              </div>
            </div>
          </div>

          {/* Right: Product Information & Direct Cart Stepper */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category & Level 3 Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {product.subcategory && (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                    {product.subcategory}
                  </span>
                )}
                {level3Name && (
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    {level3Name}
                  </span>
                )}
                {!isOutOfStock && (
                  <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>{t('স্টকে আছে', 'In Stock')}</span>
                  </span>
                )}
              </div>

              {/* Product Titles */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface leading-snug">
                {t(product.name_bn || product.name, product.name)}
              </h1>
              {product.name && product.name_bn && (
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-medium">
                  {product.name}
                </p>
              )}

              {/* Price Banner */}
              <div className="flex items-baseline gap-3 my-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {(product.original_price || product.compare_at_price) && (product.original_price || product.compare_at_price) > product.price && (
                  <span className="text-sm sm:text-base text-outline line-through">
                    {formatCurrency(product.original_price || product.compare_at_price)}
                  </span>
                )}
                {product.unit && (
                  <span className="text-xs text-on-surface-variant font-medium ml-auto">
                    {t('প্রতি প্যাক / ইউনিট:', 'Per pack:')} <strong className="text-on-surface">{product.unit}</strong>
                  </span>
                )}
              </div>

              {/* Description */}
              {(product.description_bn || product.description) && (
                <div className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed bg-surface-container/50 p-3 rounded-xl border border-outline-variant/20">
                  <h4 className="font-bold text-on-surface text-xs mb-1">
                    {t('পণ্যের বিবরণ:', 'Product Details:')}
                  </h4>
                  <p className="whitespace-pre-line">
                    {t(product.description_bn || product.description, product.description)}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Quantity / Add to Cart */}
            <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {cartItem ? (
                <div className="flex items-center justify-between sm:justify-start bg-primary text-on-primary rounded-xl p-1 shadow-md w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-lg active:scale-95 transition-all text-white font-bold"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-base px-6 text-white min-w-[3rem] text-center">
                    {cartItem.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-lg active:scale-95 transition-all text-white font-bold"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                    isOutOfStock
                      ? 'bg-outline-variant/50 text-outline cursor-not-allowed'
                      : 'bg-primary hover:bg-secondary text-on-primary'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isOutOfStock ? t('স্টক শেষ', 'Out of Stock') : t('কার্টে যোগ করুন', 'Add to Cart')}</span>
                </button>
              )}

              {/* Direct Checkout or Phone support link */}
              <Link
                to="/cart"
                className="py-3 px-4 rounded-xl border border-outline-variant/40 hover:border-primary text-xs font-semibold text-center text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{t('কার্ট দেখুন', 'View Cart')}</span>
                <span>({items.reduce((s, i) => s + (i.quantity || 1), 0)})</span>
              </Link>
            </div>

            {/* Back link & phone call */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-on-surface-variant">
              <Link to="/shop" className="hover:text-primary flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('আরও পণ্য দেখুন', 'Explore more')}</span>
              </Link>
              <a href="tel:01717999460" className="flex items-center gap-1 text-primary hover:underline">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t('ফোনে অর্ডার: ০১৭১৭-৯৯৯৪৬০', 'Order: 01717-999460')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. Below Product Card: Level 3 Category Matching Products & Size Variants */}
        {suggestions.length > 0 && (
          <section className="mt-8 sm:mt-12 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-primary" />
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-on-surface flex items-center gap-2">
                    <span>
                      {level3Name
                        ? t(`${level3Name} - বিভিন্ন সাইজ ও পরামর্শ`, `${level3Name} - Available Sizes & Suggestions`)
                        : t('একই ধরণের বিভিন্ন সাইজ ও পরামর্শ', 'Available Sizes & Suggestions')}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t(
                      `এই পণ্যের বিভিন্ন ওজন (যেমনঃ ১০০ গ্রাম, ২০০ গ্রাম, ৫০০ গ্রাম ইত্যাদি) ও অন্যান্য সাইজ`,
                      `Different weights/sizes (e.g. 100g, 200g, 500g) & related choices`
                    )}
                  </p>
                </div>
              </div>
              <Link to={`/shop/category/${catSlug}`} className="text-xs font-semibold text-primary hover:underline shrink-0">
                {t('সবগুলো দেখুন', 'View All')} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {suggestions.map((rel) => {
                const relImg = getProductImageUrl(supabase, rel.image_url)
                const inRelCart = items.find(i => i.product_id === rel.id)
                const relUnit = rel.unit || (rel.name_bn?.match(/[০-৯0-9]+\s*(?:গ্রাম|কেজি|লিটার|মিলি|প্যাক|gm|g|kg|l|ml)/i)?.[0])

                return (
                  <article
                    key={rel.id}
                    className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-[0_1px_6px_rgba(25,51,40,0.05)] hover:shadow-card-hover transition-all group border border-outline-variant/30 relative"
                  >
                    <div>
                      {/* Thumbnail & Prominent Weight Badge */}
                      <Link to={`/product/${rel.id}`} className="relative block aspect-square bg-surface-container-low rounded-lg overflow-hidden mb-2">
                        {relImg ? (
                          <img
                            src={relImg}
                            alt={rel.name_bn || rel.name}
                            className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                        )}

                        {/* Prominent Weight Badge */}
                        {relUnit && (
                          <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <Scale className="w-2.5 h-2.5" />
                            <span>{relUnit}</span>
                          </span>
                        )}
                      </Link>

                      {/* Titles */}
                      <Link to={`/product/${rel.id}`} className="block group-hover:text-primary transition-colors">
                        <h4 className="font-bold text-xs sm:text-sm text-on-surface line-clamp-2 leading-tight">
                          {t(rel.name_bn || rel.name, rel.name)}
                        </h4>
                      </Link>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                        {rel.name}
                      </p>
                    </div>

                    {/* Price & Add button */}
                    <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-primary">
                          {formatCurrency(rel.price)}
                        </span>
                        {rel.original_price && rel.original_price > rel.price && (
                          <span className="text-[9px] text-outline line-through">
                            {formatCurrency(rel.original_price)}
                          </span>
                        )}
                      </div>

                      {inRelCart ? (
                        <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              updateQuantity(rel.id, inRelCart.quantity - 1)
                            }}
                            className="w-5 h-5 flex items-center justify-center text-on-surface hover:text-primary"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-bold text-primary px-1">
                            {inRelCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              updateQuantity(rel.id, inRelCart.quantity + 1)
                            }}
                            className="w-5 h-5 flex items-center justify-center text-on-surface hover:text-primary"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddToCart(rel)
                          }}
                          className="bg-primary hover:bg-secondary text-on-primary p-1.5 rounded-lg shadow-xs active:scale-95 transition-all"
                          title={t('কার্টে যোগ করুন', 'Add to Cart')}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
