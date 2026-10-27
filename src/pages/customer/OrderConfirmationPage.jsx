import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../contexts/LanguageContext'
import { formatCurrency, formatDate, DELIVERY_METHODS, PAYMENT_METHODS } from '../../lib/utils'
import { CheckCircle, Package, MapPin, Phone, Truck } from 'lucide-react'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const { t } = useLang()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*, products(name, name_bn, image_url, unit))')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder(data)
        setLoading(false)
      })
  }, [orderId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-fresh border-t-transparent" />
    </div>
  )

  if (!order) return (
    <div className="page-container py-20 text-center">
      <h2 className="text-xl font-bold text-brand-dark">{t('অর্ডার পাওয়া যায়নি', 'Order not found')}</h2>
    </div>
  )

  return (
    <div className="page-container py-10 animate-fade-in">
      {/* Success Banner */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 gradient-brand rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">
          {t('অর্ডার সফল! 🎉', 'Order Confirmed! 🎉')}
        </h1>
        <p className="text-brand-muted">
          {t('আপনার অর্ডার নম্বর:', 'Your order number:')}
          <span className="font-bold text-brand-dark ml-1">#{order.order_number || orderId.slice(0, 8).toUpperCase()}</span>
        </p>
        <p className="text-brand-muted text-sm mt-1">
          {t('আপনার অর্ডার প্রক্রিয়া শুরু হয়েছে।', 'Your order is being processed.')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Order Details */}
        <div className="card p-5">
          <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> {t('অর্ডার বিবরণ', 'Order Details')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('স্ট্যাটাস', 'Status')}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('তারিখ', 'Date')}</span>
              <span className="font-medium">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('ডেলিভারি', 'Delivery')}</span>
              <span className="font-medium">{t(DELIVERY_METHODS[order.delivery_method]?.label, DELIVERY_METHODS[order.delivery_method]?.labelEN)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('পেমেন্ট', 'Payment')}</span>
              <span className="font-medium">{t(PAYMENT_METHODS[order.payment_method]?.label, PAYMENT_METHODS[order.payment_method]?.labelEN)}</span>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="space-y-2">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-brand-dark">
                  {t(item.products?.name_bn || item.product_name, item.product_name)} ×{item.quantity}
                </span>
                <span className="font-semibold">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <hr className="border-gray-100 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">{t('ডেলিভারি চার্জ', 'Delivery fee')}</span>
              <span>{order.delivery_fee === 0 ? t('ফ্রি', 'Free') : formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-brand-dark">{t('মোট', 'Total')}</span>
              <span className="text-brand-dark">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="card p-5">
          <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4" /> {t('ডেলিভারির তথ্য', 'Delivery Information')}
          </h2>
          <div className="space-y-3 text-sm">
            {order.full_name && (
              <div className="flex items-start gap-2">
                <span className="text-brand-muted min-w-0">{t('নাম:', 'Name:')}</span>
                <span className="font-medium">{order.full_name}</span>
              </div>
            )}
            {order.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-muted shrink-0" />
                <span className="font-medium">{order.phone}</span>
              </div>
            )}
            {order.shipping_address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" />
                <span className="font-medium">{order.shipping_address}</span>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-brand-mint rounded-xl text-sm">
            <p className="font-semibold text-brand-dark mb-1">
              {order.delivery_method === 'home_delivery'
                ? t('📦 আমরা আপনার ঠিকানায় ডেলিভারি দিব।', '📦 We will deliver to your address.')
                : t('🏪 স্টোর থেকে পিকআপ করুন।', '🏪 Please pick up from store.')}
            </p>
            <p className="text-brand-muted">
              {t('যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন।', 'Contact us for any queries.')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Link to="/orders" className="btn-secondary">{t('আমার অর্ডার দেখুন', 'View My Orders')}</Link>
        <Link to="/" className="btn-primary">{t('হোমে ফিরুন', 'Back to Home')}</Link>
      </div>
    </div>
  )
}
