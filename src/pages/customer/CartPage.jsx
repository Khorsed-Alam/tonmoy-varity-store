import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../contexts/LanguageContext'
import { formatCurrency, calculateDeliveryFee, getProductImageUrl } from '../../lib/utils'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart()
  const { t } = useLang()
  const deliveryFee = calculateDeliveryFee(subtotal, 'home_delivery')
  const total = subtotal + deliveryFee

  if (itemCount === 0) return (
    <div className="page-container py-20">
      <EmptyState
        icon="🛒"
        title={t('কার্ট খালি', 'Your cart is empty')}
        subtitle={t('কেনাকাটা শুরু করুন এবং পণ্য কার্টে যোগ করুন।', 'Start shopping and add products to your cart.')}
        action={<Link to="/shop" className="btn-primary inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" />{t('কেনাকাটা করুন', 'Start Shopping')}</Link>}
      />
    </div>
  )

  return (
    <div className="page-container py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">
          {t('আমার কার্ট', 'My Cart')} <span className="text-brand-muted font-normal text-lg">({itemCount})</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-brand-danger hover:underline flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          {t('সব মুছুন', 'Clear all')}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const imageUrl = getProductImageUrl(supabase, item.image_url)
            return (
              <div key={item.product_id} className="card p-4 flex gap-4 animate-fade-in">
                <Link to={`/product/${item.product_id}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-brand-mint">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product_id}`}>
                    <h3 className="font-semibold text-brand-dark text-sm leading-tight hover:text-brand-fresh transition-colors">
                      {t(item.name_bn || item.name, item.name)}
                    </h3>
                  </Link>
                  {item.unit && <p className="text-xs text-brand-muted mt-0.5">/{item.unit}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="qty-btn">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="qty-btn disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-dark">{formatCurrency(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-brand-danger transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-brand-dark text-lg mb-5">{t('অর্ডার সারসংক্ষেপ', 'Order Summary')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('পণ্যের মূল্য', 'Subtotal')}</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('ডেলিভারি চার্জ', 'Delivery fee')}</span>
                <span className="font-semibold text-brand-fresh">
                  {deliveryFee === 0 ? t('ফ্রি', 'Free') : formatCurrency(deliveryFee)}
                </span>
              </div>
              {subtotal < 500 && (
                <p className="text-xs text-brand-muted bg-brand-mint p-2.5 rounded-lg">
                  {t(`আরো ৳${500 - subtotal} কেনাকাটা করলে ফ্রি ডেলিভারি!`, `Spend ৳${500 - subtotal} more for free delivery!`)}
                </p>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-brand-dark">{t('মোট', 'Total')}</span>
                <span className="text-brand-dark">{formatCurrency(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center mt-5 flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {t('চেকআউট করুন', 'Proceed to Checkout')}
            </Link>
            <Link to="/shop" className="flex items-center justify-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark mt-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('কেনাকাটা চালিয়ে যান', 'Continue Shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
