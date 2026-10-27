import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../contexts/LanguageContext'
import { formatCurrency, getProductImageUrl } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addItem, items, updateQuantity } = useCart()
  const { t } = useLang()

  const cartItem = items.find(i => i.product_id === product.id)
  const imageUrl = getProductImageUrl(supabase, product.image_url)
  const isOutOfStock = product.stock_quantity <= 0
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (isOutOfStock) return
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

  const handleIncrease = (e) => {
    e.preventDefault()
    if (!cartItem) return
    updateQuantity(product.id, cartItem.quantity + 1)
  }

  const handleDecrease = (e) => {
    e.preventDefault()
    if (!cartItem) return
    updateQuantity(product.id, cartItem.quantity - 1)
  }

  return (
    <Link to={`/product/${product.id}`} className="block product-card animate-fade-in">
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-mint aspect-square">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name_bn || product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="badge bg-red-100 text-red-700 text-xs">
              {t('স্টক নেই', 'Out of Stock')}
            </span>
          )}
          {isLowStock && (
            <span className="badge bg-orange-100 text-orange-700 text-xs">
              {t('সীমিত', 'Low Stock')}
            </span>
          )}
          {product.is_featured && (
            <span className="badge bg-yellow-100 text-yellow-700 text-xs">⭐</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-brand-muted mb-1 truncate">
          {product.categories?.name_bn || product.categories?.name}
        </div>
        <h3 className="font-semibold text-brand-dark text-sm leading-tight mb-1 line-clamp-2">
          {t(product.name_bn || product.name, product.name)}
        </h3>
        <div className="text-xs text-brand-muted mb-3">
          {product.unit && <span>/{product.unit}</span>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-brand-dark font-bold text-base">
            {formatCurrency(product.price)}
          </span>

          {cartItem ? (
            <div className="flex items-center gap-1.5" onClick={e => e.preventDefault()}>
              <button onClick={handleDecrease} className="qty-btn w-7 h-7 text-xs">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-semibold w-6 text-center">{cartItem.quantity}</span>
              <button
                onClick={handleIncrease}
                disabled={cartItem.quantity >= product.stock_quantity}
                className="qty-btn w-7 h-7 text-xs disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white
                         hover:opacity-90 transition-opacity active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
