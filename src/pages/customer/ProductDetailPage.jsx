import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Scale,
  Sparkles,
  Layers,
  PhoneCall
} from 'lucide-react'
import { supabaseClient as supabase } from '../../lib/supabaseClient'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../../lib/utils'
import { useProductSync } from '../../lib/syncEvents'
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_MAP } from '../../data/categories'
import toast from 'react-hot-toast'

// Helper to extract base product name for intelligent weight/size matching
function getBaseName(text = '') {
  return text
    .replace(/[০-৯0-9]+\s*(?:গ্রাম|কেজি|লিটার|মিলি|প্যাক|পিস|gm|g|kg|ltr|l|ml|pcs|pack)/gi, '')
    .trim()
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { addItem, items, updateQuantity } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [siblings, setSiblings] = useState([])

  // Main product loader with robust fallback so it NEVER fails on schema joins
  const loadProduct = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Try fetching product with category details (without nonexistent image_url on categories table)
      let currentItem = null
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, name_bn, slug)')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        currentItem = data
      } else {
        // Fallback: direct product select
        const { data: rawItem } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (rawItem) currentItem = rawItem
      }

      // 2. Check local custom products cache if still not found
      if (!currentItem) {
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const found = localCustom.find(p => p.id === id)
        if (found) currentItem = found
      }

      setProduct(currentItem)

      // 3. Fetch sibling products in same category/subcategory for size variants & recommendations
      if (currentItem?.category_id || currentItem?.category_slug) {
        let query = supabase
          .from('products')
          .select('*, categories(name, name_bn, slug)')
          .or('is_active.eq.true,is_active.is.null')
          .limit(36)

        if (currentItem.category_id) {
          query = query.eq('category_id', currentItem.category_id)
        }

        const { data: siblingData } = await query
        const localSiblings = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
          .filter(p => p.category_id === currentItem.category_id && p.is_active !== false)

        const allSiblings = [...(siblingData || [])]
        const existingIds = new Set(allSiblings.map(p => p.id))
        for (const loc of localSiblings) {
          if (!existingIds.has(loc.id)) {
            allSiblings.push(loc)
          }
        }
        setSiblings(allSiblings)
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

  // Calculate intelligent size/weight variants of this exact product line
  const { weightVariants, relatedProducts } = useMemo(() => {
    if (!product) return { weightVariants: [], relatedProducts: [] }

    const targetBase = getBaseName(product.name_bn || product.name)
    const targetChild = product.child_subcategory

    // Same product line in different weights/sizes
    const variants = siblings.filter(p => {
      if (targetChild && p.child_subcategory === targetChild) return true
      if (targetBase && getBaseName(p.name_bn || p.name) === targetBase) return true
      return false
    })

    // Sort variants by price
    variants.sort((a, b) => (a.price || 0) - (b.price || 0))

    // Other related products in same category/subcategory (excluding variants)
    const variantIds = new Set(variants.map(v => v.id))
    const others = siblings.filter(p => !variantIds.has(p.id) && p.id !== product.id)

    return {
      weightVariants: variants.length > 1 ? variants : [],
      relatedProducts: others.slice(0, 12)
    }
  }, [product, siblings])

  const cartItem = items.find(i => i.product_id === product?.id)
  const imageUrl = getProductImageUrl(supabase, product?.image_url)
  const isOutOfStock = (product?.stock_quantity ?? 1) <= 0
  const isLowStock = !isOutOfStock && (product?.stock_quantity ?? 99) <= 5

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
          <span className="text-outline-variant">/</span>
          <span className="font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">
            {t(product.name_bn || product.name, product.name)}
          </span>
        </nav>

        {/* 2. Main Product Showcase & Interactive Size Selector */}
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

          {/* Right: Product Details, Multi-Weight Selector & Add to Cart */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category & Subcategory Tag */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {product.subcategory && (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                    {product.subcategory}
                  </span>
                )}
                {product.child_subcategory && (
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    {product.child_subcategory}
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

              {/* 3. MULTI-WEIGHT / SIZE VARIANT SELECTOR */}
              {weightVariants.length > 0 && (
                <div className="mb-6 p-3.5 bg-surface-container-low rounded-xl border-2 border-primary/20 animate-fade-in">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-primary" />
                      <span>{t('উপলব্ধ সাইজ ও ওজন (Select Available Size):', 'Available Sizes & Weights:')}</span>
                    </span>
                    <span className="text-[11px] text-primary font-semibold">
                      {weightVariants.length} {t('টি সাইজ আছে', 'sizes available')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {weightVariants.map((v) => {
                      const isCurrent = v.id === product.id
                      const vUnit = v.unit || (v.name_bn?.match(/[০-৯0-9]+\s*(?:গ্রাম|কেজি|লিটার|মিলি|প্যাক|gm|g|kg|l|ml)/i)?.[0]) || t('সাইজ', 'Size')
                      
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) navigate(`/product/${v.id}`)
                          }}
                          className={`p-2 rounded-xl text-left transition-all flex flex-col justify-between border ${
                            isCurrent
                              ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/40'
                              : 'bg-surface-container-lowest text-on-surface hover:border-primary border-outline-variant/30 hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-on-surface'}`}>
                              {vUnit}
                            </span>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                          </div>
                          <span className={`text-xs font-semibold mt-1 ${isCurrent ? 'text-amber-200' : 'text-primary'}`}>
                            {formatCurrency(v.price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {(product.description_bn || product.description) && (
                <div className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed bg-surface-container/50 p-3 rounded-xl border border-outline-variant/20">
                  <h4 className="font-bold text-on-surface text-xs mb-1">
                    {t('পণ্যের বিবরণ:', 'Product Details:')}
                  </h4>
                  <p>{t(product.description_bn || product.description, product.description)}</p>
                </div>
              )}
            </div>

            {/* Add to Cart Actions */}
            <div className="pt-4 border-t border-outline-variant/20">
              {cartItem ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-surface-container rounded-xl p-1 shadow-inner">
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface hover:text-primary transition-all active:scale-95 shadow-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-base text-primary">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      disabled={cartItem.quantity >= (product.stock_quantity || 99)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface hover:text-primary transition-all active:scale-95 shadow-xs disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to="/cart"
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-on-primary py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('কার্ট দেখুন ও অর্ডার করুন', 'View Cart & Order')}</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary disabled:bg-gray-400 text-on-primary py-3 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isOutOfStock ? t('স্টক নেই', 'Out of Stock') : t('কার্টে যোগ করুন', 'Add to Cart')}</span>
                </button>
              )}

              {/* Call to Order shortcut */}
              <div className="flex items-center justify-between text-xs text-on-surface-variant mt-4 pt-3 border-t border-outline-variant/15">
                <Link to="/shop" className="hover:text-primary flex items-center gap-1 font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('আরও পণ্য দেখুন', 'Continue Shopping')}</span>
                </Link>
                <a href="tel:01717999460" className="flex items-center gap-1 text-primary font-bold hover:underline">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t('ফোনে অর্ডার: ০১৭১৭-৯৯৯৪৬০', 'Order: 01717-999460')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SAME CATEGORY & DIFFERENT WEIGHTS RECOMMENDATIONS GRID */}
        {(weightVariants.length > 0 || relatedProducts.length > 0) && (
          <section className="mt-12">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-primary" />
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-on-surface">
                  {t('একই ক্যাটাগরির অন্যান্য সাইজ ও পণ্য', 'Available Sizes & Similar Products')}
                </h3>
              </div>
              <Link to={`/shop/category/${catSlug}`} className="text-xs font-semibold text-primary hover:underline">
                {t('সবগুলো দেখুন', 'View All')} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[...weightVariants.filter(v => v.id !== product.id), ...relatedProducts].slice(0, 12).map((rel) => {
                const relImg = getProductImageUrl(supabase, rel.image_url)
                const inRelCart = items.find(i => i.product_id === rel.id)
                const relUnit = rel.unit || (rel.name_bn?.match(/[০-৯0-9]+\s*(?:গ্রাম|কেজি|লিটার|মিলি|প্যাক|gm|g|kg|l|ml)/i)?.[0])

                return (
                  <article
                    key={rel.id}
                    className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-[0_1px_6px_rgba(25,51,40,0.05)] hover:shadow-card-hover transition-all group border border-outline-variant/30 relative"
                  >
                    <div>
                      {/* Thumbnail & Weight Badge */}
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
                          <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            {relUnit}
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
