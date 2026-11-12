import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { formatCurrency, calculateDeliveryFee, getProductImageUrl, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../lib/utils'
import { notifyOrderChange, notifyProductChange } from '../lib/syncEvents'
import { bannerService } from '../services/bannerService'
import { Truck, Store, MapPin, Phone, User, CreditCard, Loader2, Tag, CheckCircle2, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../components/common/EmptyState'

export default function Checkout() {
  const {
    items,
    subtotal,
    clearCart,
    coupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
  } = useCart()
  const { user, profile, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [deliveryMethod, setDeliveryMethod] = useState('home_delivery')
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')
  const [loading, setLoading] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [activePromos, setActivePromos] = useState([])

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    notes: '',
  })

  // Load available active promos
  useEffect(() => {
    bannerService.getActivePromos().then((promos) => {
      setActivePromos(promos || [])
    })
  }, [])

  // Re-verify coupon status on checkout mount (strict active check)
  useEffect(() => {
    if (coupon?.code) {
      bannerService.validatePromoCode(coupon.code).then((res) => {
        if (!res.valid) {
          removeCoupon()
          toast.error(t(
            `"${coupon.code}" কুপনটির মেয়াদ শেষ হয়েছে বা ব্যানারটি নিষ্ক্রিয় করা হয়েছে।`,
            `Coupon "${coupon.code}" is no longer active.`
          ))
        } else if (res.discountPercent !== coupon.discountPercent) {
          applyCoupon({
            code: res.promoCode,
            discountPercent: res.discountPercent,
            bannerTitle: res.bannerTitle,
            bannerId: res.bannerId,
          })
        }
      })
    }
  }, [])

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
  const total = Math.max(0, subtotal - discountAmount + deliveryFee)

  const handleApplyPromo = async (e, directCode = null) => {
    e?.preventDefault?.()
    const code = (typeof directCode === 'string' ? directCode : promoInput).trim().toUpperCase()
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

  const handleQuickApplyPromo = (code) => {
    handleApplyPromo(null, code)
  }

  const handleRemovePromo = () => {
    removeCoupon()
    toast.success(t('প্রোমোকোড মুছে ফেলা হয়েছে', 'Promo code removed'))
  }

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Strict Login Gate: Unauthenticated users MUST log in or create an account to order
  if (!user) {
    return (
      <div className="page-container py-16 animate-fade-in max-w-md mx-auto text-center">
        <div className="card p-8 shadow-xl border border-outline-variant/60">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2 font-display">
            {t('অর্ডার করতে লগইন প্রয়োজন', 'Login Required to Order')}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
            {t(
              'আপনার অর্ডারটি সঠিকভাবে ট্র্যাক করতে এবং গ্রাহকের তথ্য ডাটাবেসে সুরক্ষিত রাখতে লগইন বা নতুন অ্যাকাউন্ট তৈরি করা বাধ্যতামূলক।',
              'To accurately track your order and keep records safe in our database, logging in or creating an account is required.'
            )}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login?redirect=/checkout"
              className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{t('লগইন করুন', 'Sign In to Account')}</span>
            </Link>
            <Link
              to="/register?redirect=/checkout"
              className="w-full py-3 text-center rounded-xl border border-outline-variant/80 hover:border-primary text-xs font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{t('নতুন অ্যাকাউন্ট খুলুন', 'Create New Account')}</span>
            </Link>
            <Link
              to="/cart"
              className="text-xs text-on-surface-variant hover:text-primary mt-2 font-medium"
            >
              ← {t('কার্টে ফিরে যান', 'Back to Cart')}
            </Link>
          </div>
        </div>
      </div>
    )
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
    if (!user || !user.id) {
      toast.error(t('অর্ডার সম্পন্ন করতে অনুগ্রহ করে লগইন করুন।', 'Please log in to place an order.'))
      navigate('/login?redirect=/checkout')
      return
    }
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

      // 2. Validate promo code & calculate server-side discount
      let serverDiscountAmount = 0
      if (coupon?.code) {
        const promoRes = await bannerService.validatePromoCode(coupon.code)
        if (promoRes.valid) {
          serverDiscountAmount = Math.round((serverSubtotal * promoRes.discountPercent) / 100)
        } else {
          removeCoupon()
          toast.error(t(
            `"${coupon.code}" কুপনটির মেয়াদ শেষ হয়েছে বা ব্যানারটি নিষ্ক্রিয় করা হয়েছে।`,
            `Coupon "${coupon.code}" has expired or banner is inactive.`
          ))
          setLoading(false)
          return
        }
      }

      // 3. Calculate delivery fee server-side
      const serverDeliveryFee = deliveryMethod === 'home_delivery'
        ? (serverSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE)
        : 0
      const totalAmount = Math.max(0, serverSubtotal - serverDiscountAmount + serverDeliveryFee)

      // 4. Generate unique order number (e.g. TVS-MVT890)
      const orderNumber = `TVS-${Date.now().toString(36).toUpperCase()}`

      // 5. Insert order with schema-resilient automatic fallback
      let order = null
      let currentPayload = {
        order_number: orderNumber,
        user_id: user.id,
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
        discount_amount: serverDiscountAmount,
        discount: serverDiscountAmount,
        total_amount: totalAmount,
        total: totalAmount,
        notes: coupon?.code
          ? `${form.notes.trim()} [Promo: ${coupon.code} (${coupon.discountPercent}% off, -৳${serverDiscountAmount})]`.trim()
          : form.notes.trim(),
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
                { value: 'home_delivery', icon: Truck, labelBN: 'হোম ডেলিভারি', labelEN: 'Home Delivery', descBN: `৳${DELIVERY_FEE} (৳১০০০+ ফ্রি)`, descEN: `৳${DELIVERY_FEE} (Free over ৳1000)` },
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

          {/* Promo Code & Banner Discount Card (Prominent for all devices) */}
          <div className="card p-5 border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-surface to-amber-500/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-brand-dark flex items-center gap-2 text-base">
                <Tag className="w-4 h-4 text-primary" />
                <span>{t('প্রমো কোড / ব্যানার ডিসকাউন্ট', 'Promo Code / Banner Discount')}</span>
              </h2>
              {coupon && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                  {coupon.discountPercent}% {t('ছাড় সক্রিয়', 'Off Applied')}
                </span>
              )}
            </div>

            {coupon ? (
              <div className="flex items-center justify-between p-3.5 bg-brand-mint/70 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-dark font-mono text-sm tracking-wide">{coupon.code}</span>
                      <span className="text-xs font-semibold text-primary">({coupon.discountPercent}% ছাড় কার্যকর)</span>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {t('আপনি সাশ্রয় করছেন:', 'You are saving:')} <span className="font-bold text-primary">{formatCurrency(discountAmount)}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('মুছুন', 'Remove')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyPromo(e)
                        }
                      }}
                      placeholder={t('প্রমো কোড লিখুন (যেমন: RAMADAN5)', 'Enter promo code (e.g. RAMADAN5)')}
                      className="input-field pl-9 font-mono font-bold tracking-wider uppercase text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoInput.trim()}
                    className="btn-primary px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{t('প্রয়োগ করুন', 'Apply')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Available Active Promos */}
                {activePromos.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant/40">
                    <p className="text-[11px] text-brand-muted mb-2 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('বর্তমানে চালু থাকা ব্যানার অফারসমূহ (ক্লিক করলেই কোড বসবে):', 'Active banner offers (click to auto-apply):')}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activePromos.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => {
                            setPromoInput(p.code)
                            handleQuickApplyPromo(p.code)
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                          title={`${p.title} (${p.discountPercent}% ছাড়)`}
                        >
                          <span>🏷️</span>
                          <span>{p.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-950 font-sans">
                            {p.discountPercent}% ছাড়
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
        <div className="lg:col-span-1 space-y-4">
          {/* Promo Code Box */}
          <div className="card p-4">
            <h3 className="font-semibold text-brand-dark text-xs mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>{t('প্রোমোকোড / ব্যানার ডিসকাউন্ট', 'Promo Code / Banner Discount')}</span>
            </h3>

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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleApplyPromo(e)
                      }
                    }}
                    placeholder={t('কোড লিখুন (যেমন: RAMADAN5)', 'Enter promo (e.g. RAMADAN5)')}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-outline-variant font-mono font-bold tracking-wider uppercase bg-surface outline-hidden focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoInput.trim()}
                    className="btn-primary text-xs font-bold px-3 py-2 disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('প্রয়োগ', 'Apply')}
                  </button>
                </div>

                {/* Available Active Promos */}
                {activePromos.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-brand-muted mb-1 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{t('বর্তমানে চালু থাকা অফারসমূহ:', 'Active banner offers:')}</span>
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
