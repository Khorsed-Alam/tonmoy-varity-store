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
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../lib/utils'
import { useProductSync } from '../lib/syncEvents'
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_MAP, ALLOWED_MAIN_SLUGS } from '../data/categories'
import toast from 'react-hot-toast'

export default function Shop() {
  const { t } = useLang()
  const { items, itemCount, subtotal, addItem, updateQuantity } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug } = useParams()
  const navigate = useNavigate()

  // State
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [dbProducts, setDbProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOpen, setSortOpen] = useState(false)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [subcatDropdownOpen, setSubcatDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [stockOnly, setStockOnly] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  // Query Params
  const q = searchParams.get('q') || ''
  const categorySlug = slug || searchParams.get('category') || 'all'
  const subcategory = searchParams.get('subcat') || 'সকল'
  const level3Item = searchParams.get('item') || ''
  const sort = searchParams.get('sort') || 'popular'

  // Accordion state for sidebar categories & subcategories
  const [expandedCats, setExpandedCats] = useState({})
  const [expandedSubcats, setExpandedSubcats] = useState({})
  const [hoveredCat, setHoveredCat] = useState(null)

  // Automatically expand active category when categorySlug changes
  useEffect(() => {
    if (categorySlug && categorySlug !== 'all') {
      setExpandedCats(prev => ({
        ...prev,
        [categorySlug]: true
      }))
    }
  }, [categorySlug])

  // Automatically expand active subcategory when subcategory changes
  useEffect(() => {
    if (subcategory && subcategory !== 'সকল' && subcategory !== 'All') {
      setExpandedSubcats(prev => ({
        ...prev,
        [subcategory]: true
      }))
    }
  }, [subcategory])

  // Toggle category dropdown in sidebar
  const toggleCategoryExpand = useCallback((catSlug) => {
    setExpandedCats(prev => ({
      ...prev,
      [catSlug]: !prev[catSlug]
    }))
  }, [])

  // Toggle subcategory dropdown in sidebar
  const toggleSubcatExpand = useCallback((subSlug) => {
    setExpandedSubcats(prev => ({
      ...prev,
      [subSlug]: !prev[subSlug]
    }))
  }, [])

  // Refs for click outside
  const sortRef = useRef(null)
  const catDropdownRef = useRef(null)
  const subcatDropdownRef = useRef(null)

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false)
      }
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false)
      }
      if (subcatDropdownRef.current && !subcatDropdownRef.current.contains(e.target)) {
        setSubcatDropdownOpen(false)
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

      // Always ensure the 7 official main categories are used
      let mainCats = DEFAULT_CATEGORIES
      if (catData && catData.length > 0) {
        const filtered = catData.filter(c =>
          ALLOWED_MAIN_SLUGS.includes(c.slug) && (!c.level || c.level === 1)
        )
        if (filtered.length >= 7) {
          mainCats = filtered.sort((a, b) => {
            const idxA = ALLOWED_MAIN_SLUGS.indexOf(a.slug)
            const idxB = ALLOWED_MAIN_SLUGS.indexOf(b.slug)
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
          })
        }
      }

      setCategories(mainCats)

      // Fetch products from DB
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*, categories(name, name_bn, slug)')
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false })

      if (prodErr) {
        console.warn('Supabase products fetch warning:', prodErr)
      }

      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]').filter(p => p.is_active !== false)
      const dbItems = (prodData || []).filter(p => p.is_active !== false)
      const customIds = new Set(localCustom.map(p => p.id))
      const combined = [...localCustom]

      for (const item of dbItems) {
        if (!customIds.has(item.id)) {
          combined.push(item)
          customIds.add(item.id)
        }
      }

      setDbProducts(combined)
    } catch (err) {
      console.warn('Using fallback products:', err)
      setCategories(DEFAULT_CATEGORIES)
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]').filter(p => p.is_active !== false)
      setDbProducts(localCustom)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time synchronization across User End & Admin End
  useProductSync(fetchData)

  // Check if a category is currently active (supporting slug aliases and legacy mapping)
  const isCatActive = useCallback((catSlug) => {
    if (categorySlug === catSlug) return true
    if (LEGACY_CATEGORY_MAP[categorySlug]?.mainSlug === catSlug) return true
    if (LEGACY_CATEGORY_MAP[catSlug]?.mainSlug === categorySlug) return true
    return false
  }, [categorySlug])

  // Clean category navigation
  const handleSelectCategory = useCallback((targetSlug) => {
    const params = new URLSearchParams(searchParams)
    params.delete('subcat')
    params.delete('item')
    params.delete('category')
    const queryString = params.toString() ? `?${params.toString()}` : ''

    if (!targetSlug || targetSlug === 'all') {
      navigate(`/shop${queryString}`)
    } else {
      navigate(`/shop/category/${targetSlug}${queryString}`)
    }
  }, [navigate, searchParams])

  // Selected Category Info
  const selectedCat = useMemo(() => {
    if (categorySlug === 'all') {
      return {
        slug: 'all',
        name: 'All Products',
        name_bn: 'সকল মুদি পণ্য',
        description_bn: 'তন্ময় ভ্যারাইটি স্টোরের সকল খাঁটি ও তাজা মুদিপণ্য সামগ্রী',
        icon: '🛒',
        icon_name: 'storefront',
        subcategories: [],
        item_count: dbProducts.length
      }
    }
    const matched = DEFAULT_CATEGORIES.find(c =>
      c.slug === categorySlug ||
      c.id === categorySlug ||
      LEGACY_CATEGORY_MAP[categorySlug]?.mainSlug === c.slug
    )
    if (matched) return matched

    const dbMatch = categories.find(c => c.slug === categorySlug || c.id === categorySlug)
    if (dbMatch) {
      const def = DEFAULT_CATEGORIES.find(c => c.slug === dbMatch.slug || c.name === dbMatch.name)
      return {
        ...dbMatch,
        subcategories: (dbMatch.subcategories && dbMatch.subcategories.length > 0 && typeof dbMatch.subcategories[0] === 'object')
          ? dbMatch.subcategories
          : (def?.subcategories || dbMatch.subcategories || []),
        icon_name: dbMatch.icon_name || def?.icon_name || 'inventory_2',
        description_bn: dbMatch.description_bn || def?.description_bn || ''
      }
    }

    return DEFAULT_CATEGORIES[0]
  }, [categorySlug, categories, dbProducts.length])

  // Active subcategory object if selected
  const activeSubcatObj = useMemo(() => {
    if (!subcategory || subcategory === 'সকল' || subcategory === 'All') return null
    if (!selectedCat?.subcategories) return null
    return selectedCat.subcategories.find(s => {
      if (typeof s === 'string') return s === subcategory
      if (s.slug === subcategory || s.name?.toLowerCase() === subcategory.toLowerCase() || s.name_bn === subcategory) return true
      if (s.items?.some(it => it.toLowerCase() === subcategory.toLowerCase())) return true
      if (s.items_bn?.some(it => it === subcategory)) return true
      return false
    }) || null
  }, [selectedCat, subcategory])

  // Strictly filter to the 7 allowed main categories for sidebar & dropdown
  const mainCategories = useMemo(() => {
    const list = categories.filter(c => (!c.level || c.level === 1) && ALLOWED_MAIN_SLUGS.includes(c.slug))
    return list.length >= 7 ? list : DEFAULT_CATEGORIES
  }, [categories])

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    const source = dbProducts
    let filtered = [...source]

    // 1. Category Filter (Show all if 'all' OR if searching)
    if (categorySlug && categorySlug !== 'all' && !q.trim()) {
      filtered = filtered.filter(p => {
        const pSlug = p.category_slug || (p.categories && p.categories.slug) || (categories.find(c => c.id === p.category_id)?.slug) || ''
        const pCatId = p.category_id || ''
        const bnName = p.name_bn || ''
        const enName = (p.name || '').toLowerCase()

        // Direct slug or id match
        if (pSlug === categorySlug || pCatId === categorySlug) return true

        // Legacy mapping match
        const mappedMain = LEGACY_CATEGORY_MAP[pSlug]?.mainSlug
        if (mappedMain && mappedMain === categorySlug) return true

        // Explicit Category Rules
        if (categorySlug === 'cooking-essentials') {
          if (['rice-dal', 'edible-oil', 'spices', 'flour', 'essentials', 'sugar-salt', 'rice-atta-grains', 'dal-pulses', 'oil-ghee', 'spices-masala'].includes(pSlug)) return true
          if (bnName.includes('চাল') || bnName.includes('ডাল') || bnName.includes('তেল') || bnName.includes('আটা') || bnName.includes('ময়দা') || bnName.includes('লবণ') || bnName.includes('চিনি') || bnName.includes('মসলা') || bnName.includes('হলুদ') || bnName.includes('মরিচ') || bnName.includes('সরিষা') || bnName.includes('সয়াবিন')) return true
          if (enName.includes('rice') || enName.includes('dal') || enName.includes('oil') || enName.includes('flour') || enName.includes('salt') || enName.includes('sugar') || enName.includes('spice') || enName.includes('atta') || enName.includes('mustard')) return true
          return false
        }
        if (categorySlug === 'dairy-eggs') {
          if (bnName.includes('দুধ') || bnName.includes('ডিম') || bnName.includes('মাখন') || bnName.includes('ঘি') || bnName.includes('পনির') || bnName.includes('দই')) return true
          if (enName.includes('milk') || enName.includes('egg') || enName.includes('butter') || enName.includes('ghee') || enName.includes('cheese') || enName.includes('yogurt') || enName.includes('cream')) return true
          return false
        }
        if (categorySlug === 'snacks-beverages') {
          if (['snacks-tea', 'snacks-bakery', 'tea-beverages'].includes(pSlug)) return true
          if (bnName.includes('চা') || bnName.includes('বিস্কুট') || bnName.includes('চিপস') || bnName.includes('জুস') || bnName.includes('চকোলেট') || bnName.includes('কফি') || bnName.includes('ড্রিঙ্ক') || bnName.includes('পানি')) return true
          if (enName.includes('tea') || enName.includes('biscuit') || enName.includes('chips') || enName.includes('juice') || enName.includes('chocolate') || enName.includes('coffee') || enName.includes('water') || enName.includes('coke') || enName.includes('beverage')) return true
          return false
        }
        if (categorySlug === 'cleaning-household' || categorySlug === 'cleaning-supplies') {
          if (['soap-cleaning', 'cleaning-household', 'cleaning-supplies'].includes(pSlug)) return true
          if (bnName.includes('সাবান') || bnName.includes('ক্লিনার') || bnName.includes('ডিটারজেন্ট') || bnName.includes('হারপিক') || bnName.includes('হুইল') || bnName.includes('টিস্যু') || bnName.includes('ফিনাইল') || bnName.includes('মপ') || bnName.includes('ঝাড়ু') || bnName.includes('পলিশ') || bnName.includes('ডাস্টবিন') || bnName.includes('ফ্রেশনার') || bnName.includes('কয়েল') || bnName.includes('অ্যারোসল') || bnName.includes('স্প্রে') || bnName.includes('বাস্কেট') || bnName.includes('ন্যাপকিন')) return true
          if (enName.includes('cleaner') || enName.includes('detergent') || enName.includes('soap') || enName.includes('tissue') || enName.includes('harpic') || enName.includes('wheel') || enName.includes('rin') || enName.includes('mop') || enName.includes('broom') || enName.includes('polish') || enName.includes('bin') || enName.includes('basket') || enName.includes('freshener') || enName.includes('pest') || enName.includes('shoe') || enName.includes('napkin') || enName.includes('trash') || enName.includes('foil')) return true
          return false
        }
        if (categorySlug === 'baby-care') {
          if (bnName.includes('ডায়পার') || bnName.includes('বেবি') || bnName.includes('বাচ্চা')) return true
          if (enName.includes('baby') || enName.includes('diaper') || enName.includes('wipes')) return true
          return false
        }
        if (categorySlug === 'beauty-personal-care') {
          if (bnName.includes('শ্যাম্পু') || bnName.includes('ক্রিম') || bnName.includes('লোশন') || bnName.includes('পেস্ট') || bnName.includes('ব্রাশ') || bnName.includes('ফেসওয়াশ')) return true
          if (enName.includes('shampoo') || enName.includes('lotion') || enName.includes('cream') || enName.includes('toothpaste') || enName.includes('facewash') || enName.includes('soap')) return true
          return false
        }
        if (categorySlug === 'stationery-lifestyle') {
          if (bnName.includes('খাতা') || bnName.includes('কলম') || bnName.includes('পেন্সিল') || bnName.includes('ব্যাটারি') || bnName.includes('আঠা')) return true
          if (enName.includes('pen') || enName.includes('pencil') || enName.includes('battery') || enName.includes('notebook') || enName.includes('glue')) return true
          return false
        }

        // Backward compatibility for single legacy category names
        if ((categorySlug === 'essentials' || categorySlug === 'sugar-salt') && (pSlug === 'essentials' || pSlug === 'sugar-salt')) return true
        if ((categorySlug === 'rice-dal') && (pSlug === 'rice-dal')) return true
        if ((categorySlug === 'edible-oil') && (pSlug === 'edible-oil')) return true
        if ((categorySlug === 'spices') && (pSlug === 'spices')) return true
        if ((categorySlug === 'flour') && (pSlug === 'flour')) return true
        if ((categorySlug === 'snacks-tea') && (pSlug === 'snacks-tea')) return true
        if ((categorySlug === 'soap-cleaning') && (pSlug === 'soap-cleaning')) return true

        return false
      })
    }

    // 2. Subcategory Filter (Level 2)
    if (subcategory && subcategory !== 'সকল' && subcategory !== 'All') {
      filtered = filtered.filter(p => {
        const pSub = p.subcategory || ''
        const pTag = p.tag || ''
        const bnName = p.name_bn || ''
        const enName = (p.name || '').toLowerCase()
        const subLower = subcategory.toLowerCase()

        if (pSub === subcategory || pSub.toLowerCase() === subLower) return true
        if (activeSubcatObj) {
          if (pSub === activeSubcatObj.name || pSub === activeSubcatObj.name_bn || pSub === activeSubcatObj.slug) return true
          if (activeSubcatObj.items?.some(it => enName.includes(it.toLowerCase()) || pTag.toLowerCase().includes(it.toLowerCase()))) return true
          if (activeSubcatObj.items_bn?.some(it => bnName.includes(it) || pTag.includes(it))) return true
          if (bnName.includes(activeSubcatObj.name_bn) || enName.includes(activeSubcatObj.name.toLowerCase())) return true
        }

        if (bnName.includes(subcategory) || enName.includes(subLower) || pTag.includes(subcategory)) return true
        return false
      })
    }

    // 3. Level 3 Child Category Filter
    if (level3Item && level3Item !== 'সকল' && level3Item !== 'All') {
      filtered = filtered.filter(p => {
        const pChild = p.child_subcategory || ''
        const pTag = p.tag || ''
        const bnName = p.name_bn || ''
        const enName = (p.name || '').toLowerCase()
        const targetLower = level3Item.toLowerCase()

        if (pChild === level3Item || pChild.toLowerCase() === targetLower) return true
        if (pTag === level3Item || pTag.toLowerCase() === targetLower) return true
        if (bnName.includes(level3Item) || enName.includes(targetLower)) return true
        return false
      })
    }

    // 4. Search Query Filter (Searches name, name_bn, subcategory, child_subcategory, tag, category)
    if (q.trim()) {
      const query = q.toLowerCase().trim()
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.name_bn && p.name_bn.toLowerCase().includes(query)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
        (p.child_subcategory && p.child_subcategory.toLowerCase().includes(query)) ||
        (p.tag && p.tag.toLowerCase().includes(query)) ||
        (p.categories?.name && p.categories.name.toLowerCase().includes(query)) ||
        (p.categories?.name_bn && p.categories.name_bn.includes(query))
      )
    }

    // 5. Stock Filter
    if (stockOnly) {
      filtered = filtered.filter(p => (p.stock_quantity ?? 1) > 0)
    }

    // 6. Sorting (Newest & custom products on top by default)
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
  }, [dbProducts, categories, categorySlug, subcategory, level3Item, activeSubcatObj, q, stockOnly, sort])

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
    if (categorySlug && categorySlug !== 'all') count++
    if (subcategory && subcategory !== 'সকল') count++
    if (level3Item && level3Item !== 'সকল') count++
    if (stockOnly) count++
    if (sort !== 'popular') count++
    if (q.trim()) count++
    return count
  }, [categorySlug, subcategory, level3Item, stockOnly, sort, q])

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

              {/* Category Dropdown Button */}
              <div className="relative" ref={catDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCatDropdownOpen(!catDropdownOpen)
                    setSubcatDropdownOpen(false)
                    setSortOpen(false)
                  }}
                  className={`flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap ${
                    categorySlug !== 'all'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="text-[14px]">{selectedCat.icon || '🛒'}</span>
                  <span className="max-w-[120px] truncate">
                    {categorySlug === 'all'
                      ? t('ক্যাটাগরি: সকল', 'Category: All')
                      : t(selectedCat.name_bn || selectedCat.name, selectedCat.name)}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {catDropdownOpen && (
                  <div className="absolute top-10 left-0 w-56 sm:w-64 bg-surface-container-lowest rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-1 border border-outline-variant/30 animate-fade-in max-h-80 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCategory('all')
                        setCatDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        categorySlug === 'all'
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🛒</span>
                        <span>{t('সকল পণ্য (All Products)', 'All Products')}</span>
                      </span>
                      {categorySlug === 'all' && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                    <div className="h-px bg-outline-variant/20 my-0.5" />
                    {mainCategories.map((cat) => {
                      const isActive = isCatActive(cat.slug)
                      return (
                        <button
                          key={cat.id || cat.slug}
                          type="button"
                          onClick={() => {
                            handleSelectCategory(cat.slug)
                            setCatDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-base">{cat.icon || '📦'}</span>
                            <span className="truncate">{t(cat.name_bn || cat.name, cat.name)}</span>
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Subcategory Dropdown Button */}
              <div className="relative" ref={subcatDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setSubcatDropdownOpen(!subcatDropdownOpen)
                    setCatDropdownOpen(false)
                    setSortOpen(false)
                  }}
                  className={`flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap ${
                    subcategory && subcategory !== 'সকল'
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 opacity-80" />
                  <span className="max-w-[140px] truncate">
                    {level3Item
                      ? `${activeSubcatObj ? t(activeSubcatObj.name_bn || activeSubcatObj.name, activeSubcatObj.name) : subcategory} › ${level3Item}`
                      : (subcategory && subcategory !== 'সকল'
                          ? (activeSubcatObj ? t(activeSubcatObj.name_bn || activeSubcatObj.name, activeSubcatObj.name) : subcategory)
                          : t('উপ-ক্যাটাগরি: সকল', 'Subcat: All'))}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {subcatDropdownOpen && (
                  <div className="absolute top-10 left-0 w-64 sm:w-72 bg-surface-container-lowest rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 border border-outline-variant/30 animate-fade-in max-h-96 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        updateParam({ subcat: 'সকল', item: null })
                        setSubcatDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        !subcategory || subcategory === 'সকল'
                          ? 'bg-secondary/15 text-secondary font-bold'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="font-semibold">{t('সকল উপ-ক্যাটাগরি (All Subcategories)', 'All Subcategories')}</span>
                      {(!subcategory || subcategory === 'সকল') && <Check className="w-3.5 h-3.5 text-secondary" />}
                    </button>
                    <div className="h-px bg-outline-variant/20 my-1" />

                    {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 ? (
                      selectedCat.subcategories.map((sub) => {
                        if (typeof sub === 'string') {
                          const isSubActive = subcategory === sub
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                updateParam({ subcat: sub, item: null })
                                setSubcatDropdownOpen(false)
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                isSubActive
                                  ? 'bg-secondary/15 text-secondary font-bold'
                                  : 'text-on-surface hover:bg-surface-container'
                              }`}
                            >
                              <span className="truncate">{sub}</span>
                              {isSubActive && <Check className="w-3.5 h-3.5 text-secondary shrink-0" />}
                            </button>
                          )
                        }

                        const groupName = t(sub.name_bn || sub.name, sub.name)
                        const isGroupActive = subcategory === sub.slug || subcategory === sub.name || subcategory === sub.name_bn
                        const items = sub.items || []

                        return (
                          <div key={sub.slug || sub.name} className="py-1">
                            {/* Subcategory Group Header */}
                            <button
                              type="button"
                              onClick={() => {
                                updateParam({ subcat: sub.slug, item: null })
                                setSubcatDropdownOpen(false)
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between font-bold transition-colors ${
                                isGroupActive
                                  ? 'bg-secondary/20 text-secondary'
                                  : 'text-on-surface hover:bg-surface-container'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="text-[11px] text-primary">📁</span>
                                <span>{groupName}</span>
                              </span>
                              {isGroupActive && <Check className="w-3.5 h-3.5 text-secondary shrink-0" />}
                            </button>

                            {/* Subcategory Items List */}
                            {items.length > 0 && (
                              <div className="pl-4 pr-1 py-0.5 flex flex-col gap-0.5 border-l-2 border-primary/20 ml-2 mt-0.5">
                                {items.map((item, idx) => {
                                  const itemBn = sub.items_bn?.[idx] || item
                                  const itemLabel = t(itemBn, item)
                                  const isItemActive = level3Item === item || level3Item === itemBn
                                  return (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        updateParam({ subcat: sub.slug, item: itemBn })
                                        setSubcatDropdownOpen(false)
                                      }}
                                      className={`w-full text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between transition-colors ${
                                        isItemActive
                                          ? 'bg-primary/15 text-primary font-bold'
                                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                                      }`}
                                    >
                                      <span className="truncate">{itemLabel}</span>
                                      {isItemActive && <Check className="w-3 h-3 text-primary shrink-0" />}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="px-3 py-3 text-center text-xs text-on-surface-variant">
                        {categorySlug === 'all'
                          ? t('উপ-ক্যাটাগরি দেখতে প্রথমে একটি ক্যাটাগরি বাছুন', 'Select a category to view subcategories')
                          : t('কোনো উপ-ক্যাটাগরি নেই', 'No subcategories')}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
        {/* Left Sidebar: Exact Chaldal Demo Style */}
        <aside className="w-48 sm:w-56 md:w-60 lg:w-64 flex-shrink-0 bg-white py-3 px-1 sm:px-2 flex flex-col sticky top-[138px] md:top-[146px] h-[calc(100vh-160px)] overflow-y-auto no-scrollbar border-r border-outline-variant/20 font-sans text-on-surface">
          {/* Quick Links at the top (like Demo) */}
          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className={`w-full text-left py-2 px-3 text-[13.5px] sm:text-[14px] transition-colors rounded-lg flex items-center justify-between ${
              categorySlug === 'all'
                ? 'text-primary font-bold'
                : 'text-gray-800 hover:text-primary font-medium'
            }`}
          >
            <span>{t('জনপ্রিয় পণ্য', 'Popular')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSelectCategory('all')
              setStockOnly(true)
            }}
            className={`w-full text-left py-2 px-3 text-[13.5px] sm:text-[14px] transition-colors rounded-lg flex items-center justify-between ${
              stockOnly
                ? 'text-primary font-bold'
                : 'text-gray-800 hover:text-primary font-medium'
            }`}
          >
            <span>{t('ফ্ল্যাশ সেলস', 'Flash Sales')}</span>
          </button>

          <div className="h-px bg-gray-100 my-1 mx-2" />

          {/* Main Categories (Level 1) & Subcategories (Level 2) Accordion */}
          {mainCategories.map((cat) => {
            const isActive = isCatActive(cat.slug)
            const isExpanded = !!expandedCats[cat.slug]
            const isHovered = hoveredCat === cat.slug
            const isCatOpen = isExpanded || isHovered || isActive
            const subs = cat.subcategories || []

            return (
              <div
                key={cat.id || cat.slug}
                className="flex flex-col relative"
                onMouseEnter={() => setHoveredCat(cat.slug)}
                onMouseLeave={() => setHoveredCat((prev) => (prev === cat.slug ? null : prev))}
              >
                {/* Main Category Row */}
                <div
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors cursor-pointer group ${
                    isActive
                      ? 'text-primary font-bold bg-primary/5'
                      : isCatOpen
                      ? 'text-primary font-semibold'
                      : 'text-gray-800 hover:text-primary font-medium'
                  }`}
                  onClick={() => {
                    handleSelectCategory(cat.slug)
                    toggleCategoryExpand(cat.slug)
                  }}
                >
                  <span className="text-[13.5px] sm:text-[14px] truncate flex-1 text-left select-none">
                    {t(cat.name_bn || cat.name, cat.name)}
                  </span>

                  {/* Dropdown Indicator Icon on the far right */}
                  {subs.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategoryExpand(cat.slug)
                      }}
                      className="p-1 -mr-1 text-gray-400 group-hover:text-primary hover:text-primary transition-colors flex items-center justify-center shrink-0"
                      aria-label={isCatOpen ? 'Collapse category' : 'Expand category'}
                    >
                      {isCatOpen ? (
                        <ChevronDown className="w-4 h-4 text-primary stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2]" />
                      )}
                    </button>
                  )}
                </div>

                {/* Subcategories (Level 2) Indented List */}
                {isCatOpen && subs.length > 0 && (
                  <div className="pl-3.5 pr-1 py-1 flex flex-col gap-0.5 animate-fade-in border-l-2 border-primary/20 ml-3.5 my-0.5">
                    {subs.map((sub) => {
                      const subName = typeof sub === 'string' ? sub : t(sub.name_bn || sub.name, sub.name)
                      const subSlug = typeof sub === 'string' ? sub : sub.slug
                      const isSubActive = isActive && (subcategory === subSlug || subcategory === sub.name || subcategory === sub.name_bn)
                      const hasL3 = typeof sub === 'object' && sub.items && sub.items.length > 0
                      const isSubExpanded = !!expandedSubcats[subSlug] || (isSubActive && !!level3Item)

                      return (
                        <div key={subSlug} className="flex flex-col">
                          {/* Subcategory Row (Level 2) */}
                          <div
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer group ${
                              isSubActive
                                ? 'text-primary font-bold bg-primary/10'
                                : 'text-gray-700 hover:text-primary font-normal hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (categorySlug !== cat.slug) {
                                navigate(`/shop/category/${cat.slug}?subcat=${encodeURIComponent(subSlug)}`)
                              } else {
                                updateParam({ subcat: subSlug, item: null })
                              }
                            }}
                          >
                            <span className="text-[13px] sm:text-[13.5px] truncate flex-1 text-left">
                              {subName}
                            </span>

                            {/* Dropdown Button for Subcategory under Subcategory (Level 3) */}
                            {hasL3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSubcatExpand(subSlug)
                                }}
                                className="p-1 -mr-1 text-gray-400 hover:text-primary group-hover:text-primary transition-colors flex items-center justify-center shrink-0"
                                aria-label={isSubExpanded ? 'Collapse subcategory' : 'Expand subcategory'}
                              >
                                {isSubExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Level 3 items: Subcategory under Subcategory */}
                          {isSubExpanded && hasL3 && (
                            <div className="pl-3 pr-1 py-1 flex flex-col gap-0.5 border-l-2 border-emerald-300/70 ml-2.5 my-1 animate-fade-in">
                              {sub.items.map((itEn, idx) => {
                                const itBn = sub.items_bn?.[idx] || itEn
                                const itName = t(itBn, itEn)
                                const isL3Active = isSubActive && (level3Item === itBn || level3Item === itEn)

                                return (
                                  <button
                                    key={itEn}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (categorySlug !== cat.slug) {
                                        navigate(`/shop/category/${cat.slug}?subcat=${encodeURIComponent(subSlug)}&item=${encodeURIComponent(itBn)}`)
                                      } else {
                                        updateParam({ subcat: subSlug, item: itBn })
                                      }
                                    }}
                                    className={`w-full text-left py-1 px-2 text-[12px] sm:text-[12.5px] rounded transition-colors flex items-center gap-1.5 ${
                                      isL3Active
                                        ? 'text-primary font-bold bg-primary/15'
                                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isL3Active ? 'bg-primary' : 'bg-gray-300'}`} />
                                    <span className="truncate">{itName}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        {/* Right Feed: Sub-categories & Product Cards Listing */}
        <section className="flex-1 flex flex-col min-w-0 px-2.5 sm:px-4 md:px-6 pt-2 pb-16">
          {/* 3-Tier Breadcrumbs Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2 px-1 overflow-x-auto no-scrollbar py-0.5" aria-label="Breadcrumb">
            <Link
              to="/"
              className="hover:text-primary transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <span>🏠</span>
              <span>{t('হোম', 'Home')}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`hover:text-primary transition-colors whitespace-nowrap font-medium ${
                categorySlug === 'all' ? 'text-primary font-bold' : ''
              }`}
            >
              {t('শপ (সব পণ্য)', 'Shop')}
            </button>
            {categorySlug !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    updateParam({ subcat: 'সকল', item: null })
                  }}
                  className={`hover:text-primary transition-colors whitespace-nowrap font-medium ${
                    (!subcategory || subcategory === 'সকল') ? 'text-primary font-bold' : ''
                  }`}
                >
                  {t(selectedCat.name_bn || selectedCat.name, selectedCat.name)}
                </button>
              </>
            )}
            {subcategory && subcategory !== 'সকল' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    updateParam({ item: null })
                  }}
                  className={`hover:text-primary transition-colors whitespace-nowrap font-medium ${
                    (!level3Item || level3Item === 'সকল') ? 'text-primary font-bold' : ''
                  }`}
                >
                  {activeSubcatObj ? (t(activeSubcatObj.name_bn || activeSubcatObj.name, activeSubcatObj.name)) : subcategory}
                </button>
              </>
            )}
            {level3Item && level3Item !== 'সকল' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                <span className="text-primary font-bold whitespace-nowrap">
                  {level3Item}
                </span>
              </>
            )}
          </nav>

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

          {/* Top Sidebar: Level 3 Child Categories / Subcategories */}
          {activeSubcatObj && activeSubcatObj.items && activeSubcatObj.items.length > 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-3 sm:p-3.5 shadow-sm border border-outline-variant/30 mb-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-4 rounded-full bg-primary" />
                  <span className="text-xs sm:text-sm font-bold text-on-surface">
                    {t(activeSubcatObj.name_bn || activeSubcatObj.name, activeSubcatObj.name)} — {t('নির্দিষ্ট প্রকারভেদ (Level 3 Types):', 'Item Types (Level 3):')}
                  </span>
                </div>
                {level3Item && (
                  <button
                    type="button"
                    onClick={() => updateParam({ item: null })}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('সকল প্রকার দেখান', 'Show All Types')}</span>
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Level 3 Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => updateParam({ item: null })}
                  className={`h-8 sm:h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                    !level3Item || level3Item === 'সকল'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span>🏷️</span>
                  <span>{t('সকল প্রকার', 'All Types')}</span>
                </button>
                {activeSubcatObj.items.map((item, idx) => {
                  const itemBn = activeSubcatObj.items_bn?.[idx] || item
                  const isItemActive = level3Item === item || level3Item === itemBn
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateParam({ item: itemBn })}
                      className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border ${
                        isItemActive
                          ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-primary/50 hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="text-[10px] text-primary font-bold">•</span>
                      <span>{t(itemBn, item)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : selectedCat && selectedCat.slug !== 'all' && selectedCat.subcategories && selectedCat.subcategories.length > 0 ? (
            /* When in a main category but no subcategory picked yet, show quick subcategory selector */
            <div className="bg-surface-container-lowest rounded-2xl p-2.5 sm:p-3 shadow-sm border border-outline-variant/30 mb-3 animate-fade-in">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 rounded-full bg-primary" />
                  <span>{t('উপ-ক্যাটাগরি বাছুন:', 'Select Subcategory:')}</span>
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {selectedCat.subcategories.length} {t('টি উপ-ক্যাটাগরি', 'subcategories')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => updateParam({ subcat: 'সকল', item: null })}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all ${
                    (!subcategory || subcategory === 'সকল')
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t('সকল', 'All')} ({displayedProducts.length})
                </button>
                {selectedCat.subcategories.map((sub) => {
                  const subName = typeof sub === 'string' ? sub : (t(sub.name_bn || sub.name, sub.name))
                  const subValue = typeof sub === 'string' ? sub : sub.slug
                  const isSubActive = subcategory === subValue || subcategory === sub.name || subcategory === sub.name_bn
                  return (
                    <button
                      key={typeof sub === 'string' ? sub : sub.slug}
                      type="button"
                      onClick={() => updateParam({ subcat: subValue, item: null })}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all border ${
                        isSubActive
                          ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container'
                      }`}
                    >
                      <span>{subName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Active Filters Bar with 1-Click Clear All */}
          {(categorySlug !== 'all' || (subcategory && subcategory !== 'সকল') || (level3Item && level3Item !== 'সকল') || stockOnly || q.trim()) && (
            <div className="flex items-center justify-between gap-2 bg-primary-container/20 border border-primary/20 px-3 py-1.5 rounded-xl mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-bold text-primary flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{t('সক্রিয় ফিল্টার:', 'Active Filters:')}</span>
                </span>
                {categorySlug !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest text-primary px-2 py-0.5 rounded-md font-semibold text-[11px] shadow-xs border border-outline-variant/30">
                    {t(selectedCat.name_bn || selectedCat.name, selectedCat.name)}
                    <button type="button" onClick={() => handleSelectCategory('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {subcategory && subcategory !== 'সকল' && (
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest text-primary px-2 py-0.5 rounded-md font-semibold text-[11px] shadow-xs border border-outline-variant/30">
                    {activeSubcatObj ? (t(activeSubcatObj.name_bn || activeSubcatObj.name, activeSubcatObj.name)) : subcategory}
                    <button type="button" onClick={() => updateParam({ subcat: 'সকল', item: null })} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {level3Item && level3Item !== 'সকল' && (
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest text-secondary px-2 py-0.5 rounded-md font-semibold text-[11px] shadow-xs border border-outline-variant/30">
                    <span className="text-[10px]">↳</span>
                    {level3Item}
                    <button type="button" onClick={() => updateParam({ item: null })} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {stockOnly && (
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest text-secondary px-2 py-0.5 rounded-md font-semibold text-[11px] shadow-xs border border-outline-variant/30">
                    {t('তাজা স্টক', 'Fresh Stock')}
                    <button type="button" onClick={() => setStockOnly(false)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {q.trim() && (
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest text-primary px-2 py-0.5 rounded-md font-semibold text-[11px] shadow-xs border border-outline-variant/30">
                    "{q.trim()}"
                    <button type="button" onClick={() => updateParam({ q: '' })} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  updateParam({ q: '', subcat: 'সকল', item: null, sort: 'popular' })
                  setStockOnly(false)
                  handleSelectCategory('all')
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 underline flex items-center gap-0.5 ml-auto"
              >
                <X className="w-3 h-3" />
                <span>{t('সকল ফিল্টার মুছুন', 'Clear All Filters')}</span>
              </button>
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
                  updateParam({ q: '', subcat: 'সকল' })
                  setStockOnly(false)
                  handleSelectCategory('all')
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
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
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
                          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
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
