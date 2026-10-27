import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency, calculateDeliveryFee, getProductImageUrl, DELIVERY_FEE } from '../../lib/utils'
import { Truck, Store, MapPin, Phone, User, CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../../components/ui/EmptyState'

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [deliveryMethod, setDeliveryMethod] = useState('home_delivery')
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  const deliveryFee = calculateDeliveryFee(subtotal, deliveryMethod)
  const total = subtotal + deliveryFee

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = t('নাম প্রয়োজন', 'Name is required')
    if (!form.phone.trim()) e.phone = t('ফোন নম্বর প্রয়োজন', 'Phone is required')
    else if (!/^(\+880|880|0)?1[3-9]\d{8}$/.test(form.phone.trim()))
      e.phone = t('সঠিক বাংলাদেশি ফোন নম্বর দিন', 'Enter a valid BD phone number')
    if (deliveryMethod === 'home_delivery' && !form.address.trim())
      e.address = t('ঠিকানা প্রয়োজন', 'Address is required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (items.length === 0) return (
    <div className="page-container py-20">
      <EmptyState
        icon="🛒"
        title={t('কার্ট খালি', 'Cart is empty')}
        action={<Link to="/shop" className="btn-primary">{t('কেনাকাটা করুন', 'Shop Now')}</Link>}
      />
    </div>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // Call the Edge Function for secure order processing
      const { data, error } = await supabase.functions.invoke('place-order', {
        body: {
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          shipping_address: deliveryMethod === 'home_delivery' ? form.address : 'Store Pickup',
          phone: form.phone,
          full_name: form.full_name,
          notes: form.notes,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        },
      })

      if (error || data?.error) {
        toast.error(data?.error || t('অর্ডার দেওয়া যায়নি। আবার চেষ্টা করুন।', 'Order failed. Please try again.'))
        setLoading(false)
        return
      }

      clearCart()
      toast.success(t('অর্ডার সফল হয়েছে! 🎉', 'Order placed successfully! 🎉'))
      navigate(`/order-confirmation/${data.order_id}`)
    } catch (err) {
      toast.error(t('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'Something went wrong. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="page-container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">{t('চেকআউট', 'Checkout')}</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        {/* Left: Delivery & Payment */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact Info */}
          <div className="card p-5">
            <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> {t('যোগাযোগের তথ্য', 'Contact Information')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">
                  {t('পূর্ণ নাম', 'Full Name')} *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className={`input-field ${errors.full_name ? 'border-red-400' : ''}`}
                  placeholder={t('আপনার নাম', 'Your full name')}
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">
                  {t('মোবাইল নম্বর', 'Phone Number')} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={`input-field pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="card p-5">
            <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> {t('ডেলিভারি পদ্ধতি', 'Delivery Method')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: 'home_delivery', icon: Truck, labelBN: 'হোম ডেলিভারি', labelEN: 'Home Delivery', descBN: `৳${DELIVERY_FEE} (৳৫০০+ ফ্রি)`, descEN: `৳${DELIVERY_FEE} (Free over ৳500)` },
                { value: 'store_pickup', icon: Store, labelBN: 'স্টোর পিকআপ', labelEN: 'Store Pickup', descBN: 'সরাসরি স্টোর থেকে নিন', descEN: 'Collect from store directly' },
              ].map(({ value, icon: Icon, labelBN, labelEN, descBN, descEN }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${deliveryMethod === value ? 'border-brand-fresh bg-brand-mint' : 'border-gray-200 hover:border-brand-light'}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={value}
                    checked={deliveryMethod === value}
                    onChange={() => {
                      setDeliveryMethod(value)
                      if (value === 'store_pickup') setPaymentMethod('pay_at_store')
                      else setPaymentMethod('cash_on_delivery')
                    }}
                    className="accent-brand-fresh"
                  />
                  <Icon className="w-5 h-5 text-brand-fresh shrink-0" />
                  <div>
                    <div className="font-semibold text-brand-dark text-sm">{t(labelBN, labelEN)}</div>
                    <div className="text-xs text-brand-muted">{t(descBN, descEN)}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Address (home delivery) */}
            {deliveryMethod === 'home_delivery' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-brand-dark mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {t('ডেলিভারি ঠিকানা', 'Delivery Address')} *
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`}
                  placeholder={t('বাড়ি নং, রাস্তা, এলাকা, জেলা', 'House no, road, area, district')}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-5">
            <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> {t('পেমেন্ট পদ্ধতি', 'Payment Method')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {deliveryMethod === 'home_delivery' ? (
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-brand-fresh bg-brand-mint cursor-pointer">
                  <input type="radio" checked readOnly className="accent-brand-fresh" />
                  <div>
                    <div className="font-semibold text-brand-dark text-sm">{t('ক্যাশ অন ডেলিভারি', 'Cash on Delivery')}</div>
                    <div className="text-xs text-brand-muted">{t('পণ্য পেলে টাকা দিন', 'Pay when you receive')}</div>
                  </div>
                </label>
              ) : (
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-brand-fresh bg-brand-mint cursor-pointer">
                  <input type="radio" checked readOnly className="accent-brand-fresh" />
                  <div>
                    <div className="font-semibold text-brand-dark text-sm">{t('স্টোরে পেমেন্ট', 'Pay at Store')}</div>
                    <div className="text-xs text-brand-muted">{t('পিকআপের সময় দিন', 'Pay when picking up')}</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              {t('বিশেষ নির্দেশনা (ঐচ্ছিক)', 'Special Instructions (optional)')}
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field resize-none"
              placeholder={t('কোনো বিশেষ নির্দেশনা থাকলে লিখুন', 'Any special notes for the order')}
            />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-brand-dark mb-4">{t('অর্ডার সারসংক্ষেপ', 'Order Summary')}</h2>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {items.map(item => {
                const img = getProductImageUrl(supabase, item.image_url)
                return (
                  <div key={item.product_id} className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-mint shrink-0">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">🛒</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-brand-dark truncate">{t(item.name_bn || item.name, item.name)}</div>
                      <div className="text-xs text-brand-muted">×{item.quantity}</div>
                    </div>
                    <span className="text-xs font-semibold text-brand-dark shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                )
              })}
            </div>
            <hr className="border-gray-100 my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('সাবটোটাল', 'Subtotal')}</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">{t('ডেলিভারি', 'Delivery')}</span>
                <span className="font-semibold text-brand-fresh">
                  {deliveryFee === 0 ? t('ফ্রি', 'Free') : formatCurrency(deliveryFee)}
                </span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-brand-dark">{t('মোট', 'Total')}</span>
                <span className="text-brand-dark">{formatCurrency(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? t('অপেক্ষা করুন…', 'Placing order…') : t('অর্ডার দিন', 'Place Order')}
            </button>
            <p className="text-xs text-brand-muted text-center mt-3">
              {t('অর্ডার দেওয়া মানে আমাদের শর্তাবলীতে সম্মতি', 'By placing order you agree to our terms')}
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
