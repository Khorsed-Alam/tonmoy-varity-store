import { Link } from 'react-router-dom'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { uploadService } from '../../services/uploadService'
import { useCart } from '../../context/CartContext'

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart()
  const imageUrl = uploadService.getImageUrl(item.image_url)

  return (
    <div className="card p-3 sm:p-4 flex items-center justify-between gap-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
      <div className="flex items-center gap-3 min-w-0">
        <Link to={`/product/${item.product_id}`} className="shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">shopping_basket</span>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex flex-col">
          <Link
            to={`/product/${item.product_id}`}
            className="font-bold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors line-clamp-1"
          >
            {item.name_bn || item.name}
          </Link>
          <span className="text-[11px] text-on-surface-variant">{item.unit || '১ একক'}</span>
          <span className="font-extrabold text-xs sm:text-sm text-primary mt-0.5">
            {formatCurrency(item.price)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center bg-surface-container rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center font-bold text-xs text-on-surface">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors active:scale-95"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.product_id)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

