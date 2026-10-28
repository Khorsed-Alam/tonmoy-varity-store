import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Mic,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Sparkles,
  Truck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  LayoutGrid,
  List,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../contexts/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../../lib/utils'
import {
  STITCH_CATEGORIES,
  STITCH_SHOP_PRODUCTS,
  STITCH_ESSENTIALS,
  STITCH_FLASH_DEALS
} from '../../data/stitchMockData'
import { useProductSync } from '../../lib/syncEvents'
import toast from 'react-hot-toast'

export default function ShopPage() {
  const { t } = useLang()
  const { items, itemCount, subtotal, addItem, updateQuantity } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug } = useParams()
  const navigate = useNavigate()

  // State
  const [categories, setCategories] = useState(STITCH_CATEGORIES)
  const [dbProducts, setDbProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOpen, setSortOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [stockOnly, setStockOnly] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)

  // Query Params
  const q = searchParams.get('q') || ''
  const categorySlug = slug || searchParams.get('category') || 'all'
  const subcategory = searchParams.get('subcat') || 'সকল'
  const sort = searchParams.get('sort') || 'popular'

  // Ref for click outside sort
  const sortRef = useRef(null)

  // Close sort menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load Categories & Products from Supabase or Fallback
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch categories from DB if available
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (catData && catData.length > 0) {
        const seenSlugs = new Set()
        const mergedList = []
        for (const c of catData) {
          seenSlugs.add(c.slug)
          const stitchMatch = STITCH_CATEGORIES.find(sc => sc.slug === c.slug)
          mergedList.push({
            ...c,
            icon_name: c.icon_name || stitchMatch?.icon_name || 'inventory_2',
            subcategories: c.subcategories && c.subcategories.length > 0 ? c.subcategories : (stitchMatch?.subcategories || ['সকল'])
          })
        }
        for (const sc of STITCH_CATEGORIES) {
          if (!seenSlugs.has(sc.slug)) {
            mergedList.push(sc)
          }
        }
        setCategories(mergedList)
      } else {
        setCategories(STITCH_CATEGORIES)
      }

      // Fetch products from DB
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name, name_bn, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]').filter(p => p.is_active !== false)
      const dbItems = prodData || []
      const customIds = new Set(localCustom.map(p => p.id))
      const combined = [...localCustom]

      for (const item of dbItems) {
        if (!customIds.has(item.id)) {
          combined.push(item)
          customIds.add(item.id)
        }
      }

      for (const mockItem of STITCH_SHOP_PRODUCTS) {
        if (!customIds.has(mockItem.id) && !combined.some(p => (p.name || '').toLowerCase().trim() === (mockItem.name || '').toLowerCase().trim())) {
          combined.push(mockItem)
        }
      }

      setDbProducts(combined)
    } catch (err) {
      console.warn('Using fallback products:', err)
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      setDbProducts([...localCustom, ...STITCH_SHOP_PRODUCTS])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time synchronization across User End & Admin End
  useProductSync(fetchData)

  // Selected Category Info
  const selectedCat = useMemo(() => {
    if (categorySlug === 'all') {
      return {
        slug: 'all',
        name: 'All Products',
        name_bn: 'সকল মুদি পণ্য',
        description_bn: 'তন্ময় ভ্যারাইটি স্টোরের সকল খাঁটি ও তাজা মুদিপণ্য সামগ্রী',
        icon_name: 'storefront',
        subcategories: ['সকল'],
        item_count: dbProducts.length
      }
    }
    return categories.find(c => c.slug === categorySlug) || categories[0] || STITCH_CATEGORIES[0]
  }, [categories, categorySlug, dbProducts.length])

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    const source = dbProducts.length > 0 ? dbProducts : STITCH_SHOP_PRODUCTS
    let filtered = [...source]

    // 1. Category Filter (Show all if 'all' OR if searching)
    if (categorySlug && categorySlug !== 'all' && !q.trim()) {
      filtered = filtered.filter(p => {
        const pSlug = p.category_slug || (p.categories && p.categories.slug) || (categories.find(c => c.id === p.category_id)?.slug)
        if (pSlug === categorySlug) return true
        if (p.category_id === categorySlug) return true
        if ((categorySlug === 'rice-dal' || categorySlug === 'rice-atta-grains') && (pSlug === 'rice-dal' || pSlug === 'rice-atta-grains')) return true
        if ((categorySlug === 'edible-oil' || categorySlug === 'oil-ghee') && (pSlug === 'edible-oil' || pSlug === 'oil-ghee')) return true
        if ((categorySlug === 'spices' || categorySlug === 'spices-masala') && (pSlug === 'spices' || pSlug === 'spices-masala')) return true
        if ((categorySlug === 'snacks-tea' || categorySlug === 'snacks-bakery' || categorySlug === 'tea-beverages') && (pSlug === 'snacks-tea' || pSlug === 'snacks-bakery' || pSlug === 'tea-beverages')) return true
        if ((categorySlug === 'soap-cleaning' || categorySlug === 'cleaning-household') && (pSlug === 'soap-cleaning' || pSlug === 'cleaning-household')) return true
        if (categorySlug === 'essentials' && (pSlug === 'essentials' || (p.name_bn || '').includes('চিনি') || (p.name_bn || '').includes('লবণ'))) return true
        if (categorySlug === 'flour' && (pSlug === 'flour' || (p.name_bn || '').includes('আটা') || (p.name_bn || '').includes('ময়দা'))) return true
        return false
      })
    }

    // 2. Subcategory Filter
    if (subcategory && subcategory !== 'সকল' && subcategory !== 'All') {
      filtered = filtered.filter(p => p.subcategory === subcategory)
    }

    // 3. Search Query Filter
    if (q.trim()) {
      const query = q.toLowerCase().trim()
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.name_bn && p.name_bn.toLowerCase().includes(query)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(query))
      )
    }

    // 4. Stock Filter
    if (stockOnly) {
      filtered = filtered.filter(p => (p.stock_quantity ?? 1) > 0)
    }

    // 5. Sorting (Newest & custom products on top by default)
    filtered.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'newest') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      }
      // default: custom products and newest products stay prominently on top
      const aTime = a.created_at ? new Date(a.created_at).getTime() : (String(a.id).startsWith('prod-') ? 9999999999999 : 0)
      const bTime = b.created_at ? new Date(b.created_at).getTime() : (String(b.id).startsWith('prod-') ? 9999999999999 : 0)
      return bTime - aTime
    })

    return filtered
  }, [dbProducts, categories, categorySlug, subcategory, q, stockOnly, sort])

  // Helper to update query params
  const updateParam = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        next.delete(key)
      } else {
        next.set(key, val)
      }
    })
    setSearchParams(next)
  }

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast(t('আপনার ব্রাউজারে ভয়েস সার্চ সমর্থন করে না', 'Voice search not supported in this browser'), { icon: '🎤' })
      return
    }
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'bn-BD'
      recognition.interimResults = false

      recognition.onstart = () => {
        setVoiceActive(true)
        toast(t('বলুন, আমরা শুনছি...', 'Listening...'), { icon: '🎙️' })
      }

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript
        updateParam({ q: spoken })
        toast.success(`"${spoken}"`)
        setVoiceActive(false)
      }

      recognition.onerror = () => {
        setVoiceActive(false)
        toast.error(t('ভয়েস সনাক্ত করা যায়নি', 'Could not recognize voice'))
      }

      recognition.onend = () => {
        setVoiceActive(false)
      }

      recognition.start()
    } catch {
      setVoiceActive(false)
    }
  }

  // Add to cart with toast
  const handleAddToCart = (product) => {
    addItem({
      product_id: product.id,
      name: product.name,
      name_bn: product.name_bn,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity ?? 50,
      unit: product.unit,
    })
    toast.success(
      t(`কার্টে যোগ হয়েছে: ${product.name_bn || product.name}`, `Added to cart: ${product.name}`)
    )
  }

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (subcategory && subcategory !== 'সকল') count++
    if (stockOnly) count++
    if (sort !== 'popular') count++
    return count
  }, [subcategory, stockOnly, sort])

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col pb-28 pt-2">
      {/* 1. Top Search & Fast Filter Header Section */}
      <div className="sticky top-14 md:top-16 z-30 bg-surface/95 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2.5 border-b border-outline-variant/30 shadow-[0_4px_12px_rgba(25,51,40,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Search Bar Row */}
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-1.5 shadow-sm border border-outline-variant/40">
            <Search className="w-5 h-5 text-outline flex-shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => updateParam({ q: e.target.value })}
              placeholder={t('যেকোনো পণ্য খুঁজুন... (Search 500+ items)', 'Search 500+ items (চাল, ডাল, তেল...)')}
              className="w-full bg-transparent text-on-surface font-body-md text-sm placeholder:text-outline focus:outline-none"
            />
            {q && (
              <button
                type="button"
                onClick={() => updateParam({ q: '' })}
                className="w-6 h-6 rounded-full hover:bg-surface-container flex items-center justify-center text-outline"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                voiceActive
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-surface-container-high text-primary hover:bg-primary-container hover:text-on-primary'
              }`}
              title={t('ভয়েস সার্চ', 'Voice Search')}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Sort, Filters & Express Delivery Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 flex-nowrap">
              {/* Filter Active Pill */}
              <button
                type="button"
                onClick={() => {
                  if (activeFiltersCount > 0) {
                    updateParam({ subcat: 'সকল', sort: 'popular' })
                    setStockOnly(false)
                  }
                }}
                className={`flex items-center gap-1 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-semibold shadow-sm transition-transform active:scale-95 ${
                  activeFiltersCount > 0
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t('ফিল্টার', 'Filter')}</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-surface-container-lowest text-on-surface-variant font-medium text-xs shadow-sm hover:text-on-surface active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">swap_vert</span>
                  <span>
                    {sort === 'price-asc'
                      ? t('কম দাম', 'Price: Low')
                      : sort === 'price-desc'
                      ? t('বেশি দাম', 'Price: High')
                      : sort === 'newest'
                      ? t('নতুন', 'Newest')
                      : t('জনপ্রিয়', 'Popular')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-outline" />
                </button>

                {sortOpen && (
                  <div className="absolute top-10 left-0 w-36 bg-surface-container-lowest rounded-xl shadow-xl p-1.5 z-40 flex flex-col gap-1 border border-outline-variant/30 animate-fade-in">
                    {[
                      { key: 'popular', labelBN: 'জনপ্রিয়', labelEN: 'Popular' },
                      { key: 'price-asc', labelBN: 'কম দাম', labelEN: 'Price: Low to High' },
                      { key: 'price-desc', labelBN: 'বেশি দাম', labelEN: 'Price: High to Low' },
                      { key: 'newest', labelBN: 'নতুন আগে', labelEN: 'Newest First' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          updateParam({ sort: opt.key })
                          setSortOpen(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          sort === opt.key
                            ? 'bg-surface-container-low text-primary font-bold'
                            : 'text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span>{t(opt.labelBN, opt.labelEN)}</span>
                        {sort === opt.key && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Express Stock Chip */}
              <button
                type="button"
                onClick={() => setStockOnly(!stockOnly)}
                className={`flex items-center gap-1 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap active:scale-95 transition-all ${
                  stockOnly
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-lowest text-secondary hover:bg-surface-container'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                <span>{t('তাজা স্টক', 'Fresh Stock')}</span>
              </button>
            </div>

            {/* Right Tools: Delivery Trust Hint & View Switcher */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1 text-primary text-xs font-semibold bg-surface-container-low/70 px-2.5 py-1 rounded-full whitespace-nowrap">
                <Truck className="w-3.5 h-3.5" />
                <span>{t('৬০ মি. ডেলিভারি • বগুড়া', '60m Delivery • Bogura')}</span>
              </div>

              {/* View Switcher (List / Grid) */}
              <div className="flex items-center bg-surface-container-high p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title={t('লিস্ট ভিউ', 'List View')}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title={t('গ্রিড ভিউ', 'Grid View')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dual-Pane Grocery Category & Products Workspace */}
      <div className="max-w-7xl mx-auto w-full flex flex-1 min-h-[calc(100vh-210px)]">
        {/* Left Sidebar: Sticky Category Navigator (Tactile mudikhana style) */}
        <aside className="w-[84px] sm:w-28 md:w-36 lg:w-44 flex-shrink-0 bg-surface-container-low/70 py-2 sm:py-3 flex flex-col items-center gap-1.5 sm:gap-2 sticky top-[138px] md:top-[146px] h-[calc(100vh-160px)] overflow-y-auto no-scrollbar border-r border-outline-variant/30">
          {/* All Products Option (সকল পণ্য) */}
          <button
            type="button"
            onClick={() => {
              updateParam({ category: 'all', subcat: 'সকল' })
            }}
            className={`w-[74px] sm:w-[98px] md:w-[130px] lg:w-[156px] flex flex-col items-center justify-center p-2 rounded-2xl transition-all relative group ${
              categorySlug === 'all'
                ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {categorySlug === 'all' && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-105 ${
                categorySlug === 'all'
                  ? 'bg-secondary-container/60 text-primary'
                  : 'bg-surface-container text-outline'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: categorySlug === 'all' ? "'FILL' 1" : "'FILL' 0" }}
              >
                storefront
              </span>
            </div>
            <span className="font-label-sm text-[12px] text-center leading-tight">
              {t('সকল পণ্য', 'All Products')}
            </span>
            <span className="text-[9px] text-outline mt-0.5">
              {dbProducts.length} {t('পণ্য', 'items')}
            </span>
          </button>

          {categories.map((cat) => {
            const isActive = categorySlug === cat.slug
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => {
                  updateParam({ category: cat.slug, subcat: 'সকল' })
                }}
                className={`w-[74px] sm:w-[98px] md:w-[130px] lg:w-[156px] flex flex-col items-center justify-center p-2 rounded-2xl transition-all relative group ${
                  isActive
                    ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                )}

                {/* Circular Icon Container */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-secondary-container/60 text-primary'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {cat.icon_name || 'grain'}
                  </span>
                </div>

                {/* Title */}
                <span className="font-label-sm text-[12px] text-center leading-tight">
                  {t(cat.name_bn || cat.name, cat.name)}
                </span>

                {/* Item Count Badge */}
                <span className="text-[9px] text-outline mt-0.5">
                  {cat.item_count ? `${cat.item_count} ${t('পণ্য', 'items')}` : t('পণ্য', 'items')}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Right Feed: Sub-categories & Product Cards Listing */}
        <section className="flex-1 flex flex-col min-w-0 px-2.5 sm:px-4 md:px-6 pt-2 pb-16">
          {/* Current Category Banner */}
          <div className="bg-surface-container-lowest rounded-2xl p-3 sm:p-4 shadow-sm mb-3 flex items-center justify-between border border-outline-variant/20">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-headline-sm text-base sm:text-lg md:text-xl text-primary font-bold truncate">
                  {t(selectedCat.name_bn || selectedCat.name, selectedCat.name)}
                </h2>
                <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[11px] font-semibold text-on-surface-variant">
                  {selectedCat.name}
                </span>
              </div>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {selectedCat.description_bn || t('তাজা ও খাঁটি মানের সেরা মুদিপণ্য', 'Fresh & authentic grocery essentials')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-primary ml-2">
              <span className="material-symbols-outlined text-[22px]">
                {selectedCat.icon_name || 'inventory_2'}
              </span>
            </div>
          </div>

          {/* Sub-filter horizontal carousel */}
          {selectedCat.subcategories && selectedCat.subcategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
              {selectedCat.subcategories.map((sub) => {
                const isSubActive = subcategory === sub || (sub === 'সকল' && (!subcategory || subcategory === 'সকল'))
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => updateParam({ subcat: sub })}
                    className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all active:scale-95 ${
                      isSubActive
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {sub === 'সকল'
                      ? `${t('সকল', 'All')} (${displayedProducts.length})`
                      : sub}
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {displayedProducts.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center my-6 shadow-sm border border-outline-variant/20">
              <span className="text-4xl block mb-2">🔍</span>
              <h3 className="font-bold text-on-surface text-base">
                {t('কোনো পণ্য পাওয়া যায়নি', 'No products found')}
              </h3>
              <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
                {t('অনুগ্রহ করে অন্য কোনো ক্যাটাগরি বা সার্চ কিওয়ার্ড দিয়ে চেষ্টা করুন।', 'Please try searching for something else or pick another category.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  updateParam({ q: '', subcat: 'সকল', category: 'rice-dal' })
                  setStockOnly(false)
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
              >
                {t('সব পণ্য দেখুন', 'View All Items')}
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Tactile Mudikhana List Flow (Exact Stitch Screen Layout) */
            <div className="flex flex-col gap-2.5">
              {displayedProducts.map((product) => {
                const cartItem = items.find((i) => i.product_id === product.id)
                const inCart = Boolean(cartItem && cartItem.quantity > 0)
                const imageUrl = getProductImageUrl(supabase, product.image_url)

                return (
                  <article
                    key={product.id}
                    className="bg-surface-container-lowest rounded-2xl p-2.5 sm:p-3 shadow-sm flex items-center gap-3 relative overflow-hidden transition-all hover:shadow-md border border-outline-variant/20 group"
                  >
                    {/* Thumbnail Image with Weight Badge */}
                    <Link
                      to={`/product/${product.id}`}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 block"
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                        alt={product.name_bn || product.name}
                        loading="lazy"
                      />
                      {product.unit && (
                        <span className="absolute top-1 left-1 bg-primary text-on-primary text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {product.unit}
                        </span>
                      )}
                    </Link>

                    {/* Product Details & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        {/* Status Badge & Subcategory */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inCart ? (
                            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 bg-surface-container-low px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              <span>{t('কার্টে আছে', 'In Cart')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-secondary flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              <span>{product.tag || t('স্টকে আছে', 'In Stock')}</span>
                            </span>
                          )}
                          {product.subcategory && (
                            <span className="text-[10px] text-outline font-medium">
                              {product.subcategory}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link to={`/product/${product.id}`} className="block group-hover:text-primary transition-colors">
                          <h3 className="font-label-lg text-sm sm:text-base text-on-surface font-bold truncate mt-0.5">
                            {product.name_bn || product.name}
                          </h3>
                        </Link>
                        <p className="font-body-sm text-xs text-on-surface-variant truncate">
                          {product.name}
                        </p>
                      </div>

                      {/* Price & Stepper / Add to Cart */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/10">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-price-md text-base sm:text-lg text-primary font-bold">
                              {formatCurrency(product.price)}
                            </span>
                            {product.original_price && (
                              <span className="text-[11px] text-outline line-through">
                                {formatCurrency(product.original_price)}
                              </span>
                            )}
                          </div>
                          {product.unit && (
                            <span className="text-[10px] text-outline">
                              {product.unit} {t('প্রতি', 'per pack')}
                            </span>
                          )}
                        </div>

                        {/* Stepper or Add Button */}
                        {inCart ? (
                          <div className="flex items-center bg-surface-container-low rounded-xl p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-bold active:scale-90 transition-transform shadow-xs hover:bg-surface"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="counter-value px-2.5 font-price-md text-sm text-primary font-bold">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold active:scale-90 transition-transform shadow-xs hover:bg-primary-container"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="h-9 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all hover:bg-primary-container"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>{t('যোগ করুন', 'Add')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            /* Responsive Grid Mode */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {displayedProducts.map((product) => {
                const cartItem = items.find((i) => i.product_id === product.id)
                const inCart = Boolean(cartItem && cartItem.quantity > 0)
                const imageUrl = getProductImageUrl(supabase, product.image_url)

                return (
                  <article
                    key={product.id}
                    className="bg-surface-container-lowest rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-col justify-between border border-outline-variant/20 hover:shadow-md transition-all group"
                  >
                    <div>
                      <Link
                        to={`/product/${product.id}`}
                        className="relative w-full aspect-square rounded-xl bg-surface-container overflow-hidden flex items-center justify-center block mb-2"
                      >
                        <img
                          src={imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                          alt={product.name_bn || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {product.unit && (
                          <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {product.unit}
                          </span>
                        )}
                        {product.tag && (
                          <span className="absolute top-1.5 right-1.5 bg-secondary-container text-on-secondary-container text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {product.tag}
                          </span>
                        )}
                      </Link>

                      <Link to={`/product/${product.id}`} className="block group-hover:text-primary transition-colors">
                        <h3 className="font-label-lg text-xs sm:text-sm text-on-surface font-bold line-clamp-2 leading-tight">
                          {product.name_bn || product.name}
                        </h3>
                      </Link>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate mt-0.5">
                        {product.name}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-outline-variant/15 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-price-md text-sm sm:text-base text-primary font-bold">
                          {formatCurrency(product.price)}
                        </span>
                        {product.original_price && (
                          <span className="text-[10px] text-outline line-through">
                            {formatCurrency(product.original_price)}
                          </span>
                        )}
                      </div>

                      {inCart ? (
                        <div className="flex items-center bg-surface-container-low rounded-xl p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-bold active:scale-90 transition-transform"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-bold text-xs text-primary">{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold active:scale-90 transition-transform"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="h-8 px-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{t('যোগ', 'Add')}</span>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Neighborhood Mudikhana Assurance Card */}
          <div className="mt-6 bg-surface-container-low rounded-2xl p-3 sm:p-4 flex items-center gap-3 border border-secondary-container/40">
            <div className="w-10 h-10 rounded-full bg-secondary-container/60 flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-label-md text-xs sm:text-sm text-primary font-bold">
                {t('পছন্দ না হলে ইনস্ট্যান্ট বদল', 'Instant replacement if unsatisfied')}
              </h4>
              <p className="font-body-sm text-[11px] sm:text-xs text-on-surface-variant">
                {t(
                  'ওজনে ও মানে আমাদের গ্যারান্টি। ডেলিভারিম্যান সামনে থাকতেই যাচাই করুন। মেসার্স তন্ময় ভ্যারাইটি স্টোর, নারুয়ামালা হাট, গাবতলী, বগুড়া।',
                  'Guaranteed purity and correct weight. Verify with the delivery person. Tonmoy Variety Store, Bogura.'
                )}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Floating Sticky Mini-Cart Bar */}
      {itemCount > 0 && (
        <aside className="fixed bottom-16 md:bottom-6 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto bg-primary text-on-primary rounded-2xl p-2.5 px-3.5 sm:px-4 shadow-[0_8px_24px_rgba(0,81,40,0.35)] flex items-center justify-between backdrop-blur-md transition-all active:scale-[0.99] border border-primary-container">
            {/* Cart summary preview */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary relative flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-xs sm:text-sm font-bold truncate">
                    {itemCount} {t('টি পণ্য কার্টে', 'items in cart')}
                  </span>
                  <span className="text-secondary-fixed text-xs font-bold">•</span>
                  <span className="font-price-md text-xs sm:text-sm font-bold text-secondary-fixed">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <span className="text-[11px] text-on-primary-container truncate">
                  {subtotal >= 500
                    ? t('🛵 ফ্রি ডেলিভারি প্রযোজ্য!', '🛵 Free delivery applicable!')
                    : t(`ফ্রি ডেলিভারি পেতে আর ${formatCurrency(500 - subtotal)} বাকি`, `Add ${formatCurrency(500 - subtotal)} more for free delivery`)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Link
              to="/cart"
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs sm:text-sm font-bold flex items-center gap-1.5 flex-shrink-0 shadow-sm active:scale-95 transition-all hover:bg-secondary-container"
            >
              <span>{t('কার্ট দেখুন', 'View Cart')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      )}
    </div>
  )
}
