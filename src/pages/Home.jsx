import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useProductSync, useBannerSync } from '../lib/syncEvents'
import { bannerService, DEFAULT_BANNERS } from '../services/bannerService'
import ProductCard from '../components/products/ProductCard'
import { ProductGridSkeleton } from '../components/products/ProductSkeleton'
import MarketListModal from '../components/common/MarketListModal'
import {
  MUDIKHANA_DOKAN_BANNER,
  HERO_BANNERS,
} from '../data/stitchMockData'
import { DEFAULT_CATEGORIES, ALLOWED_MAIN_SLUGS } from '../data/categories'
import toast from 'react-hot-toast'

export default function Home() {
  const { t } = useLang()
  const { addItem } = useCart()
  const navigate = useNavigate()

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deliveryMode, setDeliveryMode] = useState('delivery') // 'delivery' | 'pickup'
  const [isListModalOpen, setIsListModalOpen] = useState(false)

  // Banners & Carousel state
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [isBannerPaused, setIsBannerPaused] = useState(false)

  // Fetch dynamic banners from Supabase / LocalStorage
  const loadBanners = useCallback(async () => {
    try {
      const data = await bannerService.getBanners({ activeOnly: true })
      if (data && data.length > 0) {
        setBanners(data)
      }
    } catch (err) {
      console.warn('HomePage banner load warning:', err)
    }
  }, [])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  // Real-time synchronization when admin adds/edits/deletes a banner
  useBannerSync(loadBanners)

  // Auto-slide hero banner only when multiple banners exist & not paused by mouse hover
  useEffect(() => {
    if (banners.length <= 1 || isBannerPaused) return
    const bannerTimer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(bannerTimer)
  }, [banners.length, isBannerPaused])

  const load = useCallback(async () => {
    try {
      const [catRes, featRes, newRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').limit(16),
        supabase.from('products').select('*, categories(name, name_bn, slug)').eq('is_featured', true).or('is_active.eq.true,is_active.is.null').order('created_at', { ascending: false }).limit(12),
        supabase.from('products').select('*, categories(name, name_bn, slug)').or('is_active.eq.true,is_active.is.null').order('created_at', { ascending: false }).limit(12),
      ])

      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]').filter(p => p.is_active !== false)

      // Merge for New Products
      const dbNew = (newRes.data || []).filter(p => p.is_active !== false)
      const newIds = new Set(dbNew.map(p => p.id))
      const combinedNew = [...localCustom.filter(p => !newIds.has(p.id)), ...dbNew]

      // Merge for Featured Products (Custom products always take top priority so newly added products are immediately visible on the home page)
      const dbFeat = (featRes.data || []).filter(p => p.is_active !== false)
      const featIds = new Set(dbFeat.map(p => p.id))
      const combinedFeat = [
        ...localCustom.filter(p => !featIds.has(p.id)),
        ...dbFeat
      ]

      // Always strictly use the 7 official main categories
      let mainCats = DEFAULT_CATEGORIES
      if (catRes.data && catRes.data.length > 0) {
        const filtered = catRes.data.filter(c =>
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
      setFeaturedProducts(combinedFeat)
      setNewProducts(combinedNew)
    } catch (err) {
      console.warn('HomePage product load error:', err)
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]').filter(p => p.is_active !== false)
      setCategories(DEFAULT_CATEGORIES)
      setFeaturedProducts(localCustom.filter(p => p.is_featured))
      setNewProducts(localCustom)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Real-time synchronization across User End & Admin End
  useProductSync(load)

  const activeBanner = banners[activeBannerIndex] || banners[0] || DEFAULT_BANNERS[0]

  return (
    <div className="bg-surface font-sans text-on-surface flex flex-col min-h-screen">
      {/* Delivery / Pickup Mode Switcher */}
      <div className="page-container pt-3 pb-3">
        <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1 sm:gap-1.5 max-w-xl mx-auto md:max-w-none">
          <button
            type="button"
            onClick={() => setDeliveryMode('delivery')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              deliveryMode === 'delivery'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[18px]">electric_moped</span>
            <span className="truncate">
              {t('হোম ডেলিভারি', 'Home Delivery')}{' '}
              <span className="font-normal text-on-surface-variant text-[10px] sm:text-[11px]">(৩০-৬০ মিনিট)</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMode('pickup')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              deliveryMode === 'pickup'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[18px]">storefront</span>
            <span className="truncate">
              {t('দোকান পিকআপ', 'Store Pickup')}{' '}
              <span className="font-normal text-on-surface-variant text-[10px] sm:text-[11px]">(১০ মিনিট)</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. Official Signboard & Mudikhana Hero Banner Slider */}
      <div className="page-container pb-6">
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-card border border-outline-variant/40 flex flex-col relative group">
          {/* Main Banner Image Display */}
          <div 
            className="relative w-full overflow-hidden bg-gradient-to-r from-[#e1f3f7] via-[#ebf7fa] to-[#e1f3f7] flex items-center justify-center min-h-[140px] sm:min-h-[180px] md:min-h-[220px] lg:min-h-[260px]"
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
          >
            {activeBanner && (
              <Link 
                to={activeBanner.link_url || activeBanner.linkUrl || '/shop'} 
                className="block w-full text-center relative group/slide"
              >
                <img
                  src={activeBanner.image_url || activeBanner.imageUrl}
                  alt={activeBanner.title_bn || activeBanner.titleBN || activeBanner.alt || 'ব্যানার'}
                  className="w-full h-auto max-h-[380px] object-contain mx-auto transition-transform duration-700 group-hover/slide:scale-[1.008]"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = '/images/tonmoy-variety-store-hero-banner.jpg'
                  }}
                />

                {/* Offer floating badge if not standard official store */}
                {activeBanner.badge_text_bn && activeBanner.badge_text_bn !== 'অফিসিয়াল স্টোর' && (
                  <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 bg-primary/95 text-on-primary text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5 animate-fade-in">
                    <span className="material-symbols-outlined text-[14px] text-amber-300">sparkles</span>
                    <span>{activeBanner.badge_text_bn}</span>
                  </div>
                )}
              </Link>
            )}

            {/* Left / Right Navigation Arrows & Dots only if multiple banners */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-all active:scale-90 shadow-sm z-20"
                  aria-label="Previous Banner"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveBannerIndex((prev) => (prev + 1) % banners.length)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-all active:scale-90 shadow-sm z-20"
                  aria-label="Next Banner"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>

                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs z-20">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id || index}
                      type="button"
                      onClick={() => setActiveBannerIndex(index)}
                      className={`transition-all ${
                        activeBannerIndex === index
                          ? 'w-6 h-2 bg-secondary-fixed rounded-full'
                          : 'w-2 h-2 bg-white/60 hover:bg-white rounded-full'
                      }`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Action Ribbon Under the Banner */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low flex flex-col lg:flex-row items-center justify-between gap-3 border-t border-outline-variant/30">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-on-surface text-center lg:text-left">
              <span className="inline-flex items-center justify-center gap-1 font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-xs">
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">verified</span>
                <span>{MUDIKHANA_DOKAN_BANNER.proprietorBN} ({MUDIKHANA_DOKAN_BANNER.roleBN})</span>
              </span>
              <span className="inline-flex items-center justify-center gap-1 text-on-surface-variant text-[11px] sm:text-xs">
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-primary">place</span>
                <span>{MUDIKHANA_DOKAN_BANNER.locationBN}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
              <a
                href={MUDIKHANA_DOKAN_BANNER.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">chat</span>
                <span className="truncate">{t('WhatsApp', 'WhatsApp')}</span>
              </a>
              <a
                href={`tel:${MUDIKHANA_DOKAN_BANNER.phone}`}
                className="flex items-center justify-center gap-1 sm:gap-1.5 bg-primary hover:bg-secondary text-on-primary px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">call</span>
                <span className="truncate">{MUDIKHANA_DOKAN_BANNER.phoneBN}</span>
              </a>
              <Link
                to={activeBanner?.link_url || activeBanner?.linkUrl || '/shop'}
                className="flex items-center justify-center gap-1 bg-surface-container-lowest text-primary px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-xs active:scale-95 transition-all hover:bg-surface-container-high whitespace-nowrap border border-outline-variant/30"
              >
                <span className="truncate">{t(activeBanner?.button_text_bn || 'বাজার করুন', activeBanner?.button_text || 'Shop Now')}</span>
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Mudikhana Categories (জনপ্রিয় ক্যাটাগরি) */}
      <section className="page-container pb-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-primary" />
            <h3 className="text-base sm:text-lg font-bold text-on-surface">
              {t('জনপ্রিয় ক্যাটাগরি', 'Popular Categories')}
            </h3>
          </div>
          <Link to="/shop" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
            <span>{t('সবগুলো', 'All')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </Link>
        </div>

        {/* Category Grid: Responsive 4 cols on mobile, 7 cols on tablet & desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3">
          {categories.slice(0, 7).map((cat) => (
            <Link
              key={cat.id || cat.slug}
              to={`/shop/category/${cat.slug}`}
              className="flex flex-col items-center bg-surface-container-lowest rounded-2xl p-2.5 sm:p-3 text-center group active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Circular Icon Container matching Tonmoy / Chaldal style */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-105 transition-all mb-1.5 shadow-xs">
                {cat.icon && !cat.icon_name ? (
                  <span className="text-[22px] sm:text-[26px]">{cat.icon}</span>
                ) : (
                  <span className="material-symbols-outlined text-[22px] sm:text-[26px] text-emerald-700">
                    {cat.icon_name || 'shopping_bag'}
                  </span>
                )}
              </div>

              {/* Bengali Name (Primary Title) */}
              <span className="text-[11px] sm:text-xs font-bold text-on-surface leading-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                {t(cat.name_bn || cat.name, cat.name)}
              </span>

              {/* English Subtitle */}
              <span className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium line-clamp-1 mt-0.5">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Everyday Essentials / নিত্যপ্রয়োজনীয় বাজার */}
      <section className="page-container pb-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-primary" />
            <h3 className="text-base sm:text-lg font-bold text-on-surface">
              {t('নিত্যপ্রয়োজনীয় বাজার', 'Everyday Essentials')}
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-0.5 rounded-full text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
            <span>{t('১০০% খাঁটি', '100% Authentic')}</span>
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant">
            {t('বর্তমানে কোনো পণ্য পাওয়া যায়নি। নতুন পণ্য যোগ করুন।', 'No featured products found yet.')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Newly Added Products / নতুন আগমন */}
      {newProducts.length > 0 && (
        <section className="page-container pb-6">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-secondary" />
              <h3 className="text-base sm:text-lg font-bold text-on-surface">
                {t('নতুন আগমন ও সংগ্রহ', 'New Arrivals & Fresh Stock')}
              </h3>
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold">
                {t('নতুন', 'NEW')}
              </span>
            </div>
            <Link to="/shop?sort=newest" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
              <span>{t('সবগুলো দেখুন', 'View All')}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
              {newProducts.slice(0, 12).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Neighborhood Mudikhana Trust Badges */}
      <section className="page-container pb-6">
        <div className="bg-surface-container-low rounded-2xl p-3.5 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border border-outline-variant/30">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">verified</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                {t('১০০% খাঁটি মান', '100% Quality Assured')}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant truncate sm:whitespace-normal">
                {t('মিল ও কোম্পানি সোর্সড পণ্য', 'Factory direct authentic groceries')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">price_check</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                {t('ন্যায্য পাইকারি দাম', 'Fair Wholesale Prices')}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant truncate sm:whitespace-normal">
                {t('বাজারে সেরা মূল্যে মুদিপণ্য', 'Best market price with zero hidden fee')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">schedule</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                {t('৬০ মিনিটে ডেলিভারি', '60-Min Local Delivery')}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant truncate sm:whitespace-normal">
                {t('নিজস্ব লোকাল রাইডার', 'Fastest delivery right to your door')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">storefront</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                {t('সহজ দোকান পিকআপ', 'Quick Store Pickup')}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant truncate sm:whitespace-normal">
                {t('১০ মিনিটে রেডি পার্সেল নিন', 'Ready at counter in 10 minutes')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Store Helpline & WhatsApp Market List Strip */}
      <section className="page-container pb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(25,51,40,0.06)] border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">chat</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-on-surface text-sm sm:text-base leading-tight">
                {t('বাজারে লিস্ট লিখে পাঠাবেন?', 'Want to send a handwritten grocery list?')}
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5">
                {t(
                  'হোয়াটসঅ্যাপে কাগজের লিস্টের ছবি দিন, আমরা গুছিয়ে পাঠাবো!',
                  'Send photo of your paper list on WhatsApp, we pack and deliver!'
                )}
              </span>
            </div>
          </div>
          <a
            href={MUDIKHANA_DOKAN_BANNER.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm whitespace-nowrap hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{t('হোয়াটসঅ্যাপে পাঠান', 'Send on WhatsApp')}</span>
          </a>
        </div>
      </section>

      {/* Market List Modal */}
      <MarketListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
      />
    </div>
  )
}
