import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { formatCurrency, calculateDeliveryFee, getProductImageUrl, DELIVERY_FEE } from '../lib/utils'
import { notifyOrderChange, notifyProductChange } from '../lib/syncEvents'
import { Truck, Store, MapPin, Phone, User, CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../components/common/EmptyState'

export default function Checkout() {
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

  // Synchronize form when profile loads
  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
        address: prev.address || profile.address || '',
      }))
    }
  }, [profile])
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
      // 1. Validate stock & get product info
      const productIds = items.map(i => i.product_id)
      let products = []
      try {
        const { data, error: prodError } = await supabase
          .from('products')
          .select('id, name, name_bn, price, stock_quantity, is_active')
          .in('id', productIds)
        if (!prodError && data) {
          products = data
        }
      } catch (e) {
        console.warn('Product fetch notice:', e)
      }

      const productMap = Object.fromEntries((products || []).map(p => [p.id, p]))
      let serverSubtotal = 0
      const validatedItems = []

      let localCustom = []
      try {
        localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      } catch {}

      for (const item of items) {
        const qty = item.quantity
        let product = productMap[item.product_id] || localCustom.find(p => p.id === item.product_id)

        // Fallback to cart item if product is not in database
        if (!product) {
          product = {
            id: item.product_id,
            name: item.name,
            name_bn: item.name_bn,
            price: item.price,
            stock_quantity: 999,
            is_active: true
          }
        }

        if (product.stock_quantity !== undefined && product.stock_quantity < qty) {
          toast.error(t(
            `স্টক কম: ${product.name_bn || product.name} (আছে: ${product.stock_quantity})`,
            `Low stock: ${product.name} (Available: ${product.stock_quantity})`
          ))
          setLoading(false)
          return
        }

        const unitPrice = Number(product.price ?? item.price ?? 0)
        serverSubtotal += unitPrice * qty
        validatedItems.push({
          product_id: item.product_id,
          quantity: qty,
          unit_price: unitPrice,
          unit: item.unit || 'পিস',
          image_url: item.image_url || '',
          product_name: product.name || item.name || 'মুদি পণ্য',
          product_name_bn: product.name_bn || item.name_bn || product.name || item.name || '',
        })
      }

      // 2. Calculate delivery fee server-side
      const serverDeliveryFee = deliveryMethod === 'home_delivery'
        ? (serverSubtotal >= 500 ? 0 : 50)
        : 0
      const totalAmount = serverSubtotal + serverDeliveryFee

      // 3. Generate unique order number (e.g. TVS-MVT890)
      const orderNumber = `TVS-${Date.now().toString(36).toUpperCase()}`

      // 4. Insert order with schema-resilient automatic fallback
      let order = null
      let currentPayload = {
        order_number: orderNumber,
        user_id: user?.id || null,
        full_name: form.full_name.trim(),
        customer_name: form.full_name.trim(),
        phone: form.phone.trim(),
        customer_phone: form.phone.trim(),
        alternate_phone: '',
        shipping_address: deliveryMethod === 'home_delivery' ? form.address.trim() : 'দোকান থেকে পিকআপ (Store Pickup)',
        customer_address: deliveryMethod === 'home_delivery' ? form.address.trim() : 'দোকান থেকে পিকআপ (Store Pickup)',
        delivery_address: deliveryMethod === 'home_delivery' ? form.address.trim() : 'দোকান থেকে পিকআপ (Store Pickup)',
        delivery_method: deliveryMethod,
        fulfillment_type: deliveryMethod === 'home_delivery' ? 'delivery' : 'pickup',
        payment_method: paymentMethod,
        payment_status: 'unpaid',
        status: 'pending',
        order_status: 'pending',
        subtotal: serverSubtotal,
        delivery_fee: serverDeliveryFee,
        discount_amount: 0,
        discount: 0,
        total_amount: totalAmount,
        total: totalAmount,
        notes: form.notes.trim(),
      }

      // Automatically retry removing any column missing from Supabase schema cache
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data, error: orderError } = await supabase
          .from('orders')
          .insert(currentPayload)
          .select()
          .single()

        if (!orderError && data) {
          order = data
          break
        }

        console.warn(`Order insert attempt ${attempt + 1} notice:`, orderError)
        const errMsg = orderError?.message || ''
        const match = errMsg.match(/Could not find the '([^']+)' column/i)
        if (match && match[1] && currentPayload.hasOwnProperty(match[1])) {
          delete currentPayload[match[1]]
          continue
        } else {
          throw orderError
        }
      }

      if (!order) {
        throw new Error('অর্ডার সংরক্ষণ করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }

      // 5. Insert order items with schema resilience
      const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

      let itemsPayload = validatedItems.map(item => ({
        order_id: order.id,
        product_id: isValidUUID(item.product_id) ? item.product_id : null,
        product_name: item.product_name,
        product_name_bn: item.product_name_bn || item.product_name,
        unit: item.unit || 'পিস',
        unit_price: item.unit_price || item.price || 0,
        price: item.unit_price || item.price || 0,
        quantity: item.quantity,
        total_price: (item.unit_price || item.price || 0) * (item.quantity || 1),
        line_total: (item.unit_price || item.price || 0) * (item.quantity || 1),
        image_url: item.image_url || '',
      }))

      for (let attempt = 0; attempt < 5; attempt++) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsPayload)

        if (!itemsError) break

        console.warn(`Order items insert attempt ${attempt + 1} notice:`, itemsError)
        const match = (itemsError?.message || '').match(/Could not find the '([^']+)' column/i)
        if (match && match[1]) {
          itemsPayload = itemsPayload.map(row => {
            const copy = { ...row }
            delete copy[match[1]]
            return copy
          })
          continue
        } else {
          break
        }
      }

      // 6. Decrement stock & record inventory audit safely
      for (const item of validatedItems) {
        if (isValidUUID(item.product_id)) {
          try {
            await supabase.rpc('decrement_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
              p_order_id: order.id,
            })
          } catch (rpcErr) {
            console.warn('Stock decrement notice:', rpcErr)
          }
        }
      }

      // Broadcast order creation and stock decrement across User End & Admin End
      notifyOrderChange({ orderId: order.id, orderNumber: order.order_number || orderNumber })
      notifyProductChange({ action: 'stock_decrement', items: validatedItems })

      // Cache last order in session storage for instant confirmation render
      try {
        sessionStorage.setItem('tvs_last_order', JSON.stringify({ ...order, order_items: validatedItems }))
      } catch (e) {
        console.warn('Session store notice:', e)
      }

      clearCart()
      toast.success(t('অর্ডার সফল হয়েছে! 🎉', 'Order placed successfully! 🎉'))
      navigate(`/order-confirmation/${order.id}`)
    } catch (err) {
      console.error('Order error details:', err)
      toast.error(err?.message ? `অর্ডার ব্যর্থ: ${err.message}` : t('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'Something went wrong. Please try again.'))
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
