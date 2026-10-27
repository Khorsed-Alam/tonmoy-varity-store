import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../contexts/LanguageContext'
import { formatCurrency, formatDate, DELIVERY_METHODS, PAYMENT_METHODS, ORDER_STATUS } from '../../lib/utils'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import { ArrowLeft, Package, Truck, Phone, MapPin } from 'lucide-react'
import { getProductImageUrl } from '../../lib/utils'

export default function OrderDetailPage() {
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
    <div className="page-container py-8">
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!order) return (
    <div className="page-container py-20 text-center">
      <h2 className="text-xl font-bold text-brand-dark">{t('অর্ডার পাওয়া যায়নি', 'Order not found')}</h2>
      <Link to="/orders" className="btn-primary inline-flex mt-4">{t('ফিরে যান', 'Go Back')}</Link>
    </div>
  )

  const statusSteps = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered']
  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="page-container py-8 animate-fade-in">
      <Link to="/orders" className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t('সব অর্ডার', 'All Orders')}
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">
          {t('অর্ডার', 'Order')} #{order.order_number || order.id.slice(0, 8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress bar */}
      {order.status !== 'cancelled' && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            {statusSteps.slice(0, -1).map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                  ${i <= currentStep ? 'gradient-brand text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i <= currentStep ? '✓' : i + 1}
                </div>
                {i < statusSteps.length - 2 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? 'bg-brand-fresh' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm font-medium text-brand-dark">
            {ORDER_STATUS[order.status]?.label}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Order Items */}
        <div className="card p-5">
          <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> {t('পণ্যসমূহ', 'Items')}
          </h2>
          <div className="space-y-3">
            {order.order_items?.map(item => {
              const img = getProductImageUrl(supabase, item.products?.image_url)
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-brand-mint shrink-0">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-brand-dark">{t(item.products?.name_bn || item.product_name, item.product_name)}</div>
                    <div className="text-xs text-brand-muted">{formatCurrency(item.unit_price)} × {item.quantity}</div>
                  </div>
                  <span className="font-bold text-sm text-brand-dark">{formatCurrency(item.unit_price * item.quantity)}</span>
                </div>
              )
            })}
          </div>
          <hr className="my-3 border-gray-100" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-brand-muted">
              <span>{t('সাবটোটাল', 'Subtotal')}</span>
              <span>{formatCurrency(order.subtotal || (order.total_amount - order.delivery_fee))}</span>
            </div>
            <div className="flex justify-between text-brand-muted">
              <span>{t('ডেলিভারি', 'Delivery')}</span>
              <span>{order.delivery_fee === 0 ? t('ফ্রি', 'Free') : formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-brand-dark border-t border-gray-100 pt-1.5">
              <span>{t('মোট', 'Total')}</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="card p-5">
          <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4" /> {t('ডেলিভারির তথ্য', 'Delivery Info')}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('তারিখ', 'Date')}</span>
              <span className="font-medium">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('পদ্ধতি', 'Method')}</span>
              <span className="font-medium">{t(DELIVERY_METHODS[order.delivery_method]?.label, DELIVERY_METHODS[order.delivery_method]?.labelEN)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">{t('পেমেন্ট', 'Payment')}</span>
              <span className="font-medium">{t(PAYMENT_METHODS[order.payment_method]?.label, PAYMENT_METHODS[order.payment_method]?.labelEN)}</span>
            </div>
            {order.phone && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Phone className="w-4 h-4 text-brand-muted" />
                <span>{order.phone}</span>
              </div>
            )}
            {order.shipping_address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" />
                <span>{order.shipping_address}</span>
              </div>
            )}
            {order.notes && (
              <div className="bg-brand-mint rounded-xl p-3 mt-2">
                <p className="text-xs text-brand-muted">{t('নোট:', 'Note:')} {order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
