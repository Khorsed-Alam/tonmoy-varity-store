import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, ArrowLeft, Package } from 'lucide-react'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../lib/utils'
import { useProductSync } from '../lib/syncEvents'
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_MAP } from '../data/categories'
import toast from 'react-hot-toast'

export default function ProductDetails() {
  const { id } = useParams()
  const { t } = useLang()
  const { addItem, items, updateQuantity } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState([])

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, name_bn, slug, image_url)')
        .eq('id', id)
        .single()

      if (data) {
        setProduct(data)
        if (data?.category_id) {
          const { data: rel } = await supabase
            .from('products')
            .select('*, categories(name, name_bn)')
            .eq('category_id', data.category_id)
            .eq('is_active', true)
            .neq('id', id)
            .limit(6)
          setRelated(rel || [])
        }
      } else {
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const found = localCustom.find(p => p.id === id)
        if (found) setProduct(found)
      }
    } catch {
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const found = localCustom.find(p => p.id === id)
      if (found) setProduct(found)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Real-time synchronization
  useProductSync(load)

  const cartItem = items.find(i => i.product_id === id)
  const imageUrl = getProductImageUrl(supabase, product?.image_url)

  const handleAddToCart = () => {
    if (!product || product.stock_quantity <= 0) return
    addItem({
      product_id: product.id,
      name: product.name,
      name_bn: product.name_bn,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      unit: product.unit,
    })
    toast.success(t('কার্টে যোগ হয়েছে!', 'Added to cart!'))
  }

  if (loading) return (
    <div className="page-container py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="skeleton rounded-2xl aspect-square" />
        <div className="space-y-4">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-8 w-full rounded" />
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton h-24 w-full rounded" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="page-container py-20 text-center">
      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-brand-dark mb-2">
        {t('পণ্য পাওয়া যায়নি', 'Product not found')}
      </h2>
      <Link to="/shop" className="btn-primary inline-flex mt-4">{t('দোকানে ফিরুন', 'Back to Shop')}</Link>
    </div>
  )

  const isOutOfStock = product.stock_quantity <= 0

  return (
    <div className="animate-fade-in">
      <div className="page-container py-6">
        {/* Breadcrumb Hierarchy */}
        {(() => {
          const matchedCat = product.categories ||
            DEFAULT_CATEGORIES.find(c => c.id === product.category_id || c.slug === product.category_slug) ||
            (product.category_slug ? DEFAULT_CATEGORIES.find(c => c.slug === LEGACY_CATEGORY_MAP[product.category_slug]?.mainSlug) : null)
          const catSlug = matchedCat?.slug || product.category_slug || ''
          const catNameBn = matchedCat?.name_bn || matchedCat?.name || ''
          const catNameEn = matchedCat?.name || ''

          return (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-muted mb-6 flex-wrap">
              <Link to="/" className="hover:text-brand-dark">{t('হোম', 'Home')}</Link>
              <span>/</span>
              <Link to="/shop" className="hover:text-brand-dark">{t('দোকান', 'Shop')}</Link>
              {catSlug && (
                <>
                  <span>/</span>
                  <Link to={`/shop/category/${catSlug}`} className="hover:text-primary font-medium text-brand-dark">
                    {t(catNameBn, catNameEn)}
                  </Link>
                </>
              )}
              {product.subcategory && product.subcategory !== 'সকল' && (
                <>
                  <span>/</span>
                  <Link
                    to={`/shop/category/${catSlug || 'all'}?subcat=${encodeURIComponent(product.subcategory)}`}
                    className="hover:text-primary text-brand-dark"
                  >
                    {product.subcategory}
                  </Link>
                </>
              )}
              {product.child_subcategory && (
                <>
                  <span>/</span>
                  <Link
                    to={`/shop/category/${catSlug || 'all'}?subcat=${encodeURIComponent(product.subcategory || '')}&item=${encodeURIComponent(product.child_subcategory)}`}
                    className="hover:text-primary text-secondary font-medium"
                  >
                    {product.child_subcategory}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-brand-dark font-bold truncate max-w-[150px] sm:max-w-xs">
                {t(product.name_bn || product.name, product.name)}
              </span>
            </div>
          )
        })()}

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-brand-mint aspect-square relative shadow-card">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name_bn || product.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🛒</div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-red-600 font-bold px-6 py-3 rounded-xl text-lg">
                  {t('স্টক নেই', 'Out of Stock')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.categories && (
              <Link to={`/shop/category/${product.categories.slug}`} className="inline-flex items-center gap-1.5 text-brand-fresh text-sm font-medium mb-3 hover:underline">
                <span>{product.categories.icon}</span>
                {t(product.categories.name_bn || product.categories.name, product.categories.name)}
              </Link>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2 leading-tight">
              {t(product.name_bn || product.name, product.name)}
            </h1>
            {product.name_bn && product.name && (
              <p className="text-brand-muted text-sm mb-3">{product.name}</p>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-brand-dark">{formatCurrency(product.price)}</span>
              {product.unit && <span className="text-brand-muted text-sm">/ {product.unit}</span>}
            </div>

            {/* Stock info */}
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : product.stock_quantity <= 5 ? 'bg-orange-400' : 'bg-green-500'}`} />
              <span className="text-sm text-brand-muted">
                {isOutOfStock
                  ? t('স্টক নেই', 'Out of stock')
                  : product.stock_quantity <= 5
                  ? t(`মাত্র ${product.stock_quantity}টি বাকি`, `Only ${product.stock_quantity} left`)
                  : t('স্টকে আছে', 'In stock')}
              </span>
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none text-brand-muted mb-6">
                <p>{t(product.description_bn || product.description, product.description)}</p>
              </div>
            )}

            {/* Add to cart */}
            {cartItem ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-brand-mint rounded-xl p-2">
                  <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="qty-btn">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold text-brand-dark w-8 text-center">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                    disabled={cartItem.quantity >= product.stock_quantity}
                    className="qty-btn disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Link to="/cart" className="btn-primary flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {t('কার্ট দেখুন', 'View Cart')}
                </Link>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <ShoppingCart className="w-4 h-4" />
                {isOutOfStock ? t('স্টক নেই', 'Out of Stock') : t('কার্টে যোগ করুন', 'Add to Cart')}
              </button>
            )}

            <Link to="/shop" className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark mt-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('কেনাকাটা চালিয়ে যান', 'Continue Shopping')}
            </Link>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-4">{t('সম্পর্কিত পণ্য', 'Related Products')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="product-card">
                  <div className="aspect-square bg-brand-mint overflow-hidden">
                    {getProductImageUrl(supabase, p.image_url) ? (
                      <img src={getProductImageUrl(supabase, p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-brand-dark font-medium truncate">{t(p.name_bn || p.name, p.name)}</div>
                    <div className="text-xs font-bold text-brand-dark">{formatCurrency(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
