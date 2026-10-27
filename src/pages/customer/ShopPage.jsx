import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../contexts/LanguageContext'
import ProductCard from '../../components/product/ProductCard'
import { ProductGridSkeleton } from '../../components/product/ProductSkeleton'
import EmptyState from '../../components/ui/EmptyState'

const SORT_OPTIONS = [
  { value: 'created_at:desc', labelBN: 'নতুন আগে', labelEN: 'Newest First' },
  { value: 'price:asc', labelBN: 'দাম: কম থেকে বেশি', labelEN: 'Price: Low to High' },
  { value: 'price:desc', labelBN: 'দাম: বেশি থেকে কম', labelEN: 'Price: High to Low' },
  { value: 'name:asc', labelBN: 'নাম: A–Z', labelEN: 'Name: A–Z' },
]

export default function ShopPage() {
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug } = useParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  const q = searchParams.get('q') || ''
  const featured = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'created_at:desc'
  const categorySlug = slug || searchParams.get('category') || ''
  const page = Number(searchParams.get('page') || '1')
  const PAGE_SIZE = 20

  const [sortVal, sortDir] = sort.split(':')

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data || []))
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, categories!inner(name, name_bn, slug)', { count: 'exact' })
      .eq('is_active', true)

    if (q) query = query.or(`name.ilike.%${q}%,name_bn.ilike.%${q}%,description.ilike.%${q}%`)
    if (featured) query = query.eq('is_featured', true)
    if (categorySlug) query = query.eq('categories.slug', categorySlug)

    const from = (page - 1) * PAGE_SIZE
    query = query.order(sortVal || 'created_at', { ascending: sortDir === 'asc' })
      .range(from, from + PAGE_SIZE - 1)

    const { data, count, error } = await query
    if (!error) {
      setProducts(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [q, featured, categorySlug, sort, page])

  useEffect(() => { loadProducts() }, [loadProducts])

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const selectedCat = categories.find(c => c.slug === categorySlug)

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">
            {selectedCat ? t(selectedCat.name_bn || selectedCat.name, selectedCat.name)
              : q ? `"${q}"` : t('সব পণ্য', 'All Products')}
          </h1>
          <p className="text-brand-muted text-sm">{totalCount} {t('টি পণ্য', 'products found')}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
              className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer min-w-[160px]"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{t(o.labelBN, o.labelEN)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden flex items-center gap-2 btn-secondary py-2 px-3 text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('ফিল্টার', 'Filter')}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`
          ${filterOpen ? 'fixed inset-0 z-50 bg-black/50 flex items-end' : 'hidden'} 
          md:relative md:block md:inset-auto md:bg-transparent md:z-auto md:flex-none
        `}>
          <div
            className={`
              w-full max-w-sm md:w-64 bg-white rounded-t-3xl md:rounded-2xl p-5 shadow-xl md:shadow-card
              animate-slide-up md:animate-none md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto
            `}
          >
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="font-semibold">{t('ফিল্টার', 'Filters')}</h3>
              <button onClick={() => setFilterOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-semibold text-brand-dark mb-3 text-sm">{t('ক্যাটাগরি', 'Category')}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => { setParam('category', ''); setFilterOpen(false) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${!categorySlug ? 'bg-brand-dark text-white' : 'hover:bg-brand-mint text-brand-dark'}`}
                >
                  {t('সব ক্যাটাগরি', 'All Categories')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setParam('category', cat.slug); setFilterOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                      ${categorySlug === cat.slug ? 'bg-brand-dark text-white' : 'hover:bg-brand-mint text-brand-dark'}`}
                  >
                    <span>{cat.icon}</span>
                    {t(cat.name_bn || cat.name, cat.name)}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setParam('featured', e.target.checked ? 'true' : '')}
                  className="accent-brand-fresh w-4 h-4"
                />
                <span className="text-sm text-brand-dark">{t('শুধু ফিচার্ড', 'Featured only')}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {/* Active filters */}
          {(q || categorySlug || featured) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {q && (
                <span className="badge bg-brand-mint text-brand-dark">
                  🔍 {q}
                  <button onClick={() => setParam('q', '')} className="ml-1.5">×</button>
                </span>
              )}
              {categorySlug && selectedCat && (
                <span className="badge bg-brand-mint text-brand-dark">
                  {selectedCat.icon} {t(selectedCat.name_bn || selectedCat.name, selectedCat.name)}
                  <button onClick={() => setParam('category', '')} className="ml-1.5">×</button>
                </span>
              )}
              {featured && (
                <span className="badge bg-yellow-100 text-yellow-800">
                  ⭐ {t('ফিচার্ড', 'Featured')}
                  <button onClick={() => setParam('featured', '')} className="ml-1.5">×</button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔍"
              title={t('কোনো পণ্য পাওয়া যায়নি', 'No products found')}
              subtitle={t('অন্য কিছু খোঁজার চেষ্টা করুন', 'Try searching for something else')}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n })}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors
                    ${p === page ? 'gradient-brand text-white' : 'bg-white text-brand-dark hover:bg-brand-mint'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
