import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Truck, Store, Shield, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../contexts/LanguageContext'
import ProductCard from '../../components/product/ProductCard'
import { ProductGridSkeleton } from '../../components/product/ProductSkeleton'

export default function HomePage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      const [catRes, featRes, newRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(8),
        supabase.from('products').select('*, categories(name, name_bn)').eq('is_featured', true).eq('is_active', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('products').select('*, categories(name, name_bn)').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      ])
      setCategories(catRes.data || [])
      setFeaturedProducts(featRes.data || [])
      setNewProducts(newRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const features = [
    { icon: Truck, titleBN: 'দ্রুত ডেলিভারি', titleEN: 'Fast Delivery', descBN: 'আপনার দোরগোড়ায়', descEN: 'Right to your doorstep' },
    { icon: Store, titleBN: 'স্টোর পিকআপ', titleEN: 'Store Pickup', descBN: 'নিজে এসে নিন', descEN: 'Pick up yourself' },
    { icon: Shield, titleBN: 'নিরাপদ পেমেন্ট', titleEN: 'Safe Payment', descBN: 'ক্যাশ অন ডেলিভারি', descEN: 'Cash on Delivery' },
    { icon: Star, titleBN: 'তাজা পণ্য', titleEN: 'Fresh Products', descBN: 'সর্বোচ্চ মান', descEN: 'Best quality guaranteed' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="page-container py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              🛍️ {t('বাংলাদেশের সেরা মুদিখানা', "Bangladesh's Best Grocery")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 text-shadow-sm">
              {t('তাজা পণ্য,', 'Fresh Products,')}
              <br />
              <span className="text-yellow-300">{t('সেরা দামে!', 'Best Prices!')}</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl mb-8">
              {t(
                'তন্ময় ভ্যারাইটি স্টোরে স্বাগতম। তাজা শাকসবজি, মুদিপণ্য এবং দৈনন্দিন সামগ্রী এখন অনলাইনে।',
                'Welcome to Tonmoy Varity Store. Fresh vegetables, groceries & daily essentials now online.'
              )}
            </p>

            {/* Hero Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('কী খুঁজছেন?', 'What are you looking for?')}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-brand-dark placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <button type="submit" className="bg-brand-accent hover:bg-yellow-500 text-white px-6 py-4 rounded-xl font-semibold transition-colors">
                {t('খুঁজুন', 'Search')}
              </button>
            </form>

            <div className="flex gap-4 mt-6">
              <Link to="/shop" className="btn-secondary bg-white/15 border-white/30 text-white hover:bg-white/25 py-2.5 px-5 text-sm">
                {t('সব পণ্য দেখুন', 'Browse All')} <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-white border-b border-brand-light">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, titleBN, titleEN, descBN, descEN }) => (
              <div key={titleBN} className="flex items-center gap-3 p-4 rounded-xl hover:bg-brand-mint transition-colors">
                <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-brand-dark text-sm">{t(titleBN, titleEN)}</div>
                  <div className="text-xs text-brand-muted">{t(descBN, descEN)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">{t('ক্যাটাগরি', 'Categories')}</h2>
            <p className="section-subtitle">{t('পছন্দের বিভাগ থেকে কেনাকাটা করুন', 'Shop by your favorite category')}</p>
          </div>
          <Link to="/shop" className="text-brand-fresh text-sm font-semibold hover:underline flex items-center gap-1">
            {t('সব দেখুন', 'See all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {categories.length === 0 && !loading ? null : (
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white hover:bg-brand-mint hover:shadow-card transition-all duration-200 group"
              >
                <span className="text-3xl">{cat.icon || '🛒'}</span>
                <span className="text-xs font-medium text-brand-dark text-center leading-tight group-hover:text-brand-fresh transition-colors">
                  {t(cat.name_bn || cat.name, cat.name)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-10 bg-brand-mint/30">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">{t('ফিচার্ড পণ্য', 'Featured Products')}</h2>
              <p className="section-subtitle">{t('আমাদের সেরা বাছাই', 'Our top picks for you')}</p>
            </div>
            <Link to="/shop?featured=true" className="text-brand-fresh text-sm font-semibold hover:underline flex items-center gap-1">
              {t('সব দেখুন', 'See all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={10} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-10 page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">{t('নতুন পণ্য', 'New Arrivals')}</h2>
            <p className="section-subtitle">{t('সদ্য যোগ হওয়া পণ্যসমূহ', 'Recently added products')}</p>
          </div>
          <Link to="/shop" className="text-brand-fresh text-sm font-semibold hover:underline flex items-center gap-1">
            {t('সব দেখুন', 'See all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {newProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="py-10 page-container">
        <div className="gradient-brand rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('আজই অর্ডার করুন!', 'Order Today!')}
            </h2>
            <p className="text-white/80 mb-6">
              {t('৳৫০০ এর উপরে ফ্রি হোম ডেলিভারি', 'Free home delivery on orders over ৳500')}
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-brand-dark px-8 py-3 rounded-xl font-semibold hover:bg-brand-mint transition-colors">
              {t('কেনাকাটা শুরু করুন', 'Start Shopping')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
