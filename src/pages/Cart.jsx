import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Lock, Tag, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { formatCurrency, calculateDeliveryFee, getProductImageUrl } from '../lib/utils'
import EmptyState from '../components/common/EmptyState'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { bannerService } from '../services/bannerService'
import toast from 'react-hot-toast'

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    itemCount,
    clearCart,
    coupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
  } = useCart()
  const { user } = useAuth()
  const { t } = useLang()

  const [promoInput, setPromoInput] = useState('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [activePromos, setActivePromos] = useState([])

  // Load live active banner promo codes
  useEffect(() => {
    bannerService.getActivePromos().then((promos) => {
      setActivePromos(promos || [])
    })
  }, [])

  // Re-verify already applied coupon against active banners (strict active check)
  useEffect(() => {
    if (coupon?.code) {
      bannerService.validatePromoCode(coupon.code).then((res) => {
        if (!res.valid) {
          removeCoupon()
          toast.error(t(
            `"${coupon.code}" প্রোমোকোডটির মেয়াদ শেষ হয়েছে বা ব্যানারটি নিষ্ক্রিয় করা হয়েছে।`,
            `Promo code "${coupon.code}" is no longer active.`
          ))
        } else if (res.discountPercent !== coupon.discountPercent) {
          // Dynamic percentage update if admin changed from e.g. 3% to 5%!
          applyCoupon({
            code: res.promoCode,
            discountPercent: res.discountPercent,
            bannerTitle: res.bannerTitle,
            bannerId: res.bannerId,
          })
          toast.success(t(
            `প্রোমোকোড ছাড়ের পরিমাণ আপডেট হয়েছে: ${res.discountPercent}%`,
            `Promo code discount updated to ${res.discountPercent}%`
          ))
        }
      })
    }
  }, [])

  const deliveryFee = calculateDeliveryFee(subtotal, 'home_delivery')
  const total = Math.max(0, subtotal - discountAmount + deliveryFee)

  const handleApplyPromo = async (e) => {
    e?.preventDefault()
    const code = promoInput.trim().toUpperCase()
    if (!code) {
      toast.error(t('প্রোমোকোড লিখুন', 'Please enter a promo code'))
      return
    }

    setValidatingPromo(true)
    try {
      const res = await bannerService.validatePromoCode(code)
      if (!res.valid) {
        toast.error(res.message || t('অবৈধ প্রোমোকোড', 'Invalid promo code'))
        return
      }

      const calculatedSavings = Math.round((subtotal * res.discountPercent) / 100)
      applyCoupon({
        code: res.promoCode,
        discountPercent: res.discountPercent,
        bannerTitle: res.bannerTitle,
        bannerId: res.bannerId,
      })
      setPromoInput('')
      toast.success(
        t(
          `অভিনন্দন! "${res.promoCode}" কোড কার্যকর হয়েছে (${res.discountPercent}% ছাড় = ৳${calculatedSavings})`,
          `Success! "${res.promoCode}" applied (${res.discountPercent}% off = ৳${calculatedSavings})`
        )
      )
    } catch (err) {
      toast.error(t('কুপন যাচাই করতে সমস্যা হয়েছে', 'Failed to validate coupon'))
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    removeCoupon()
    toast.success(t('প্রোমোকোড মুছে ফেলা হয়েছে', 'Promo code removed'))
  }

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
        <div className="lg:col-span-1 space-y-4">
          {/* Promo Code Box */}
          <div className="card p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark mb-2.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>{t('ব্যানার প্রোমোকোড / কুপন', 'Banner Promo Code')}</span>
            </div>

            {coupon ? (
              <div className="flex items-center justify-between p-2.5 bg-brand-mint border border-primary/30 rounded-xl text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-brand-dark font-mono">{coupon.code}</span>
                    <span className="text-brand-dark ml-1 font-semibold text-[11px]">({coupon.discountPercent}% ছাড় কার্যকর)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-1"
                  title="কুপন মুছুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder={t('কোড লিখুন (যেমন: RAMADAN5)', 'Enter promo (e.g. RAMADAN5)')}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-outline-variant font-mono font-bold tracking-wider uppercase bg-surface outline-hidden focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={validatingPromo || !promoInput.trim()}
                    className="btn-primary text-xs font-bold px-3 py-2 disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('প্রয়োগ', 'Apply')}
                  </button>
                </form>

                {/* Available Active Promos */}
                {activePromos.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-brand-muted mb-1 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{t('বর্তমানে চালু থাকা ব্যানার অফারসমূহ:', 'Active banner offers right now:')}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activePromos.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => setPromoInput(p.code)}
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                          title={`${p.title} (${p.discountPercent}% ছাড়)`}
                        >
                          🏷️ {p.code} ({p.discountPercent}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-brand-dark text-lg mb-4">{t('অর্ডার সারসংক্ষেপ', 'Order Summary')}</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('পণ্যের মূল্য', 'Subtotal')}</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              {coupon && discountAmount > 0 && (
                <div className="flex justify-between text-brand-fresh font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{t('ব্যানার ছাড়', 'Banner Discount')} ({coupon.code} - {coupon.discountPercent}%)</span>
                  </span>
                  <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

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

              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-brand-dark">{t('মোট প্রদেয়', 'Grand Total')}</span>
                <span className="text-brand-dark text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            {!user && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'অর্ডার নিশ্চিত করতে একাউন্টে লগইন থাকা প্রয়োজন।',
                    'You must be logged in to your account to place an order.'
                  )}
                </span>
              </div>
            )}

            <Link
              to={user ? '/checkout' : '/login?redirect=/checkout'}
              className="btn-primary w-full text-center mt-5 flex items-center justify-center gap-2"
            >
              {user ? (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  {t('চেকআউট করুন', 'Proceed to Checkout')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {t('লগইন করে চেকআউট করুন', 'Login & Checkout')}
                </>
              )}
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
