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
    <Link to={`/product/${product.id}`} className="block bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-[0_1px_6px_rgba(25,51,40,0.05)] hover:shadow-card-hover transition-all group border border-outline-variant/30 h-full">
      {/* Top Image Container */}
      <div>
        <div className="relative w-full aspect-square bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name_bn || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
          )}

          {/* Unit Badge (e.g. 1 কেজি) */}
          {product.unit && (
            <span className="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-medium text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
              {product.unit}
            </span>
          )}

          {/* Discount / Status Badges */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {isOutOfStock ? (
              <span className="bg-error text-on-error text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                {t('স্টক নেই', 'Out')}
              </span>
            ) : product.original_price && product.original_price > product.price ? (
              <span className="bg-error text-on-error text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                ৳{product.original_price - product.price} {t('ছাড়', 'OFF')}
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-100 text-amber-800 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                {t('সীমিত স্টক', 'Low')}
              </span>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-2">
          {!isOutOfStock && (
            <span className="inline-block text-[9px] sm:text-[10px] text-secondary font-medium bg-secondary-container/40 px-1.5 py-0.5 rounded mb-1">
              {t('স্টকে আছে', 'In Stock')}
            </span>
          )}
          <h4 className="font-bold text-on-surface text-xs sm:text-sm leading-snug line-clamp-2 h-8 sm:h-10 group-hover:text-primary transition-colors">
            {t(product.name_bn || product.name, product.name)}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
            {product.name_bn ? product.name : (product.categories?.name_bn || product.categories?.name || '')}
          </p>
        </div>
      </div>

      {/* Price & Cart Actions */}
      <div className="pt-2 mt-1">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-primary font-bold text-base md:text-lg">
            {formatCurrency(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-outline line-through">
              {formatCurrency(product.original_price)}
            </span>
          )}
        </div>

        {cartItem ? (
          <div
            className="flex items-center justify-between bg-surface-container rounded-lg h-9 px-1"
            onClick={e => e.preventDefault()}
          >
            <button
              onClick={handleDecrease}
              className="w-7 h-7 rounded bg-surface-container-lowest text-primary flex items-center justify-center font-bold active:scale-90 shadow-xs"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="text-sm font-bold text-primary px-1">
              {cartItem.quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={cartItem.quantity >= product.stock_quantity}
              className="w-7 h-7 rounded bg-surface-container-lowest text-primary flex items-center justify-center font-bold active:scale-90 shadow-xs disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full h-9 bg-primary text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            <span>{t('কার্টে যোগ', 'Add')}</span>
          </button>
        )}
      </div>
    </Link>
  )
}
