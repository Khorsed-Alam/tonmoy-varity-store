import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabaseClient as supabase } from '../../lib/supabaseClient'
import { useLang } from '../../context/LanguageContext'
import { formatCurrency, formatDate, DELIVERY_METHODS, PAYMENT_METHODS } from '../../lib/utils'
import { CheckCircle2, Package, MapPin, Phone, Truck, ArrowLeft, ShoppingBag, Store, Clock } from 'lucide-react'
import OrderStatusBadge from '../../components/common/OrderStatusBadge'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const { t } = useLang()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchOrder() {
      // 1. First check if last order is in sessionStorage for instant render
      try {
        const cached = sessionStorage.getItem('tvs_last_order')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && (parsed.id === orderId || !orderId)) {
            if (isMounted) {
              setOrder(parsed)
              setLoading(false)
            }
          }
        }
      } catch (e) {
        console.warn('Session cache read notice:', e)
      }

      // 2. Fetch fresh order details from Supabase
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name, name_bn, image_url, unit))')
          .eq('id', orderId)
          .single()

        if (!error && data && isMounted) {
          setOrder(data)
          // Update session cache with fresh DB order
          try {
            sessionStorage.setItem('tvs_last_order', JSON.stringify(data))
          } catch {}
        }
      } catch (err) {
        console.warn('Order confirmation fetch notice:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    } else {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-on-surface-variant">
          {t('অর্ডার বিবরণ প্রস্তুত হচ্ছে...', 'Loading order details...')}
        </p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-outline">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          {t('অর্ডার তথ্য সংরক্ষিত হয়েছে', 'Order Recorded')}
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
          {t('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। অর্ডার নম্বর:', 'Your order was placed successfully. Order Reference:')}{' '}
          <span className="font-bold text-primary font-mono">{orderId || 'TVS-CONFIRMED'}</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/orders" className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 rounded-xl">
            {t('আমার অর্ডার দেখুন', 'View Orders')}
          </Link>
          <Link to="/" className="btn-primary w-full sm:w-auto text-xs py-2.5 px-4 rounded-xl">
            {t('হোমে ফিরুন', 'Back to Home')}
          </Link>
        </div>
      </div>
    )
  }

  // Safe labels for delivery & payment
  const isDelivery = order.delivery_method === 'home_delivery' || order.fulfillment_type === 'delivery' || !order.delivery_method
  const deliveryLabel = isDelivery
    ? t('হোম ডেলিভারি (Home Delivery)', 'Home Delivery')
    : t('দোকান থেকে পিকআপ (Store Pickup)', 'Store Pickup')

  const isCOD = order.payment_method === 'cash_on_delivery' || order.payment_method === 'cod' || !order.payment_method
  const paymentLabel = isCOD
    ? t('ক্যাশ অন ডেলিভারি (Cash on Delivery)', 'Cash on Delivery')
    : t('দোকানে পেমেন্ট (Pay at Store)', 'Pay at Store')

  const totalAmount = Number(order.total_amount || order.total || 0)
  const deliveryFee = Number(order.delivery_fee || 0)
  const itemsList = order.order_items || []

  return (
    <div className="page-container py-8 sm:py-12 animate-fade-in max-w-4xl mx-auto">
      {/* 1. Success Hero Banner */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 text-center shadow-sm border border-outline-variant/30 mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2">
          {t('অর্ডার কনফার্মড', 'Order Confirmed')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2 font-display">
          {t('ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত হয়েছে 🎉', 'Thank You! Your Order is Confirmed 🎉')}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto mb-3">
          {t(
            'মেসার্স তন্ময় ভ্যারাইটি স্টোর থেকে আপনার অর্ডারের পণ্যগুলো দ্রুত প্যাক করে পাঠানো হচ্ছে।',
            'We have received your grocery order and are preparing it for delivery.'
          )}
        </p>
        <div className="inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant">{t('অর্ডার নম্বর:', 'Order ID:')}</span>
          <span className="font-mono font-bold text-primary text-sm sm:text-base">
            #{order.order_number || (order.id ? order.id.slice(0, 8).toUpperCase() : 'TVS-ORDER')}
          </span>
        </div>
      </div>

      {/* 2. Order Details & Customer Delivery Split Grid */}
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        {/* Left Card: Purchased Items & Total Summary */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>{t('পণ্যের বিবরণ', 'Order Summary')}</span>
              </h2>
              <OrderStatusBadge status={order.status || 'pending'} />
            </div>

            {/* Items List */}
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
              {itemsList.length > 0 ? (
                itemsList.map((item, idx) => {
                  const name = item.product_name_bn || item.product_name || item.products?.name_bn || item.products?.name || t('মুদি পণ্য', 'Grocery Item')
                  const unitPrice = Number(item.unit_price || item.price || 0)
                  const qty = Number(item.quantity || 1)
                  return (
                    <div key={item.id || idx} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-outline-variant/10 last:border-0">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-on-surface truncate">{name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {formatCurrency(unitPrice)} × {qty} {item.unit || item.products?.unit || ''}
                        </p>
                      </div>
                      <span className="font-bold text-on-surface flex-shrink-0">
                        {formatCurrency(unitPrice * qty)}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-on-surface-variant italic py-2">
                  {t('পণ্য তালিকা সফলভাবে ডাটাবেসে সেভ হয়েছে।', 'Items successfully recorded.')}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Math */}
          <div className="bg-surface-container-low rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('সাবটোটাল', 'Subtotal')}</span>
              <span className="font-medium">{formatCurrency(order.subtotal || (totalAmount - deliveryFee))}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('ডেলিভারি ফি', 'Delivery Fee')}</span>
              <span className="font-medium text-emerald-600">
                {deliveryFee === 0 ? t('ফ্রি', 'Free') : formatCurrency(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm sm:text-base font-bold text-primary pt-2 border-t border-outline-variant/30">
              <span>{t('মোট প্রদেয়', 'Total Amount')}</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Shipping & Customer Information */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-bold text-on-surface text-base flex items-center gap-2 pb-3 border-b border-outline-variant/20">
              <Truck className="w-4 h-4 text-primary" />
              <span>{t('ডেলিভারি ও গ্রাহক তথ্য', 'Delivery Information')}</span>
            </h2>

            {/* Customer Details */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-outline text-xs min-w-[70px]">{t('গ্রাহকের নাম:', 'Name:')}</span>
                <span className="font-semibold text-on-surface">{order.full_name || order.customer_name || 'Customer'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-outline text-xs min-w-[70px]">{t('ফোন নম্বর:', 'Phone:')}</span>
                <span className="font-semibold text-on-surface font-mono">{order.phone || order.customer_phone || ''}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-outline text-xs min-w-[70px]">{t('ঠিকানা:', 'Address:')}</span>
                <span className="font-semibold text-on-surface">
                  {order.shipping_address || order.delivery_address || t('স্টোর থেকে নেওয়া হবে', 'Store Pickup')}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-outline text-xs min-w-[70px]">{t('ডেলিভারি মোড:', 'Method:')}</span>
                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-xs">
                  {deliveryLabel}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-outline text-xs min-w-[70px]">{t('পেমেন্ট মোড:', 'Payment:')}</span>
                <span className="font-medium text-on-surface bg-surface-container-high px-2 py-0.5 rounded-lg text-xs">
                  {paymentLabel}
                </span>
              </div>
            </div>

            {/* Store Guarantee Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-surface-container-low border border-secondary-container/40">
              <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>{t('ডেলিভারি সময়: ৩০-৬০ মিনিট', 'Estimated Delivery: 30-60 mins')}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {t(
                  'আমাদের প্রতিনিধি আপনার সাথে ফোনে যোগাযোগ করতে পারে। কোনো প্রয়োজনে কল করুন: ০১৭১৭-৯৯৯৪৬০।',
                  'Our delivery team may call you to verify the location. Store counter: 01717-999460.'
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-outline-variant/20">
            <Link
              to="/orders"
              className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold text-center transition-all active:scale-95"
            >
              {t('সকল অর্ডার', 'My Orders')}
            </Link>
            <Link
              to="/shop"
              className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold text-center transition-all active:scale-95 shadow-sm"
            >
              {t('আরও বাজার করুন', 'Continue Shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
