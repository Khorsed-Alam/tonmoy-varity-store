import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, ORDER_STATUS, DELIVERY_METHODS, PAYMENT_METHODS } from '../../lib/utils'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import {
  ArrowLeft, Loader2, CheckCircle, Printer, Phone, MapPin,
  Clock, Package, Store, AlertCircle, ShoppingBag, Truck
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminOrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    supabase.from('orders')
      .select('*, order_items(*, products(name, name_bn, unit, image_url))')
      .eq('id', orderId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          toast.error('অর্ডার পাওয়া যায়নি')
        }
        setOrder(data)
        setNewStatus(data?.status || '')
        setLoading(false)
      })
  }, [orderId])

  const handleUpdateStatus = async (statusToSet) => {
    const target = statusToSet || newStatus
    if (!target || target === order.status) return
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status: target }).eq('id', orderId)
    setUpdating(false)
    if (error) { toast.error('স্ট্যাটাস আপডেট ব্যর্থ: ' + error.message); return }
    setOrder(o => ({ ...o, status: target }))
    setNewStatus(target)
    toast.success('অর্ডার স্ট্যাটাস সফলভাবে আপডেট হয়েছে!')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-surface-container rounded-xl" />
      <div className="h-64 bg-surface-container-lowest rounded-2xl border border-outline-variant/30" />
    </div>
  )

  if (!order) return (
    <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
      <AlertCircle className="w-12 h-12 text-error mx-auto mb-3" />
      <h2 className="text-lg font-bold text-on-surface">অর্ডার পাওয়া যায়নি</h2>
      <p className="text-xs text-on-surface-variant mt-1 mb-4">এই আইডির কোনো অর্ডার ডাটাবেজে নথিভুক্ত নেই</p>
      <Link to="/admin/orders" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> অর্ডারে ফিরে যান
      </Link>
    </div>
  )

  const steps = [
    { key: 'pending', label: 'অপেক্ষমাণ' },
    { key: 'confirmed', label: 'নিশ্চিত' },
    { key: 'processing', label: 'প্যাকিং হচ্ছে' },
    { key: 'out_for_delivery', label: 'ডেলিভারিতে' },
    { key: 'delivered', label: 'ডেলিভার্ড' },
  ]

  const currentStepIdx = steps.findIndex(s => s.key === order.status)

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface font-display">
                অর্ডার #{order.order_number || order.id.slice(0, 8).toUpperCase()}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              অর্ডারের তারিখ: {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>ভাউচার প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Order Progress Stepper */}
      <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
          ডেলিভারি ট্র্যাকিং প্রগ্রেস
        </h2>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container -z-0" />
          {steps.map((st, i) => {
            const isCompleted = currentStepIdx >= i
            const isCurrent = order.status === st.key
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => handleUpdateStatus(st.key)}
                className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCurrent
                    ? 'bg-secondary ring-4 ring-secondary-container text-white scale-110'
                    : isCompleted
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-bold ${isCurrent ? 'text-secondary' : isCompleted ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {st.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Left Column: Customer & Delivery Info (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          {/* Status Quick Control */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30">
            <h2 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>স্ট্যাটাস পরিবর্তন</span>
            </h2>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="flex-1 h-10 px-3 bg-surface-container rounded-xl text-xs font-bold text-on-surface focus:outline-none"
              >
                {Object.entries(ORDER_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label} ({val.labelEN})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleUpdateStatus()}
                disabled={updating || newStatus === order.status}
                className="px-4 py-2 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'আপডেট'}
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 space-y-3 text-xs">
            <h2 className="font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/20 flex items-center justify-between">
              <span>গ্রাহক ও ডেলিভারি বিবরণ</span>
              {order.phone && (
                <a
                  href={`tel:${order.phone}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>কল দিন</span>
                </a>
              )}
            </h2>

            <div className="flex justify-between py-1">
              <span className="text-on-surface-variant">নাম:</span>
              <span className="font-bold text-on-surface">{order.full_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-on-surface-variant">ফোন নম্বর:</span>
              <span className="font-bold text-on-surface font-mono">{order.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-on-surface-variant">পেমেন্ট মেথড:</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container font-bold text-[11px] text-on-surface">
                {PAYMENT_METHODS[order.payment_method]?.label || order.payment_method || 'ক্যাশ অন ডেলিভারি'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-on-surface-variant">ডেলিভারি ধরন:</span>
              <span className="font-semibold text-on-surface">
                {DELIVERY_METHODS[order.delivery_method]?.label || 'হোম ডেলিভারি'}
              </span>
            </div>
            {order.shipping_address && (
              <div className="pt-2 border-t border-outline-variant/10">
                <span className="text-on-surface-variant block mb-1">ডেলিভারি ঠিকানা:</span>
                <p className="font-medium text-on-surface p-2.5 bg-surface-container rounded-xl leading-relaxed">
                  {order.shipping_address}
                </p>
              </div>
            )}
            {order.notes && (
              <div className="pt-2">
                <span className="text-on-surface-variant block mb-1">গ্রাহকের বিশেষ নির্দেশনা:</span>
                <p className="p-2.5 bg-yellow-50 text-yellow-800 rounded-xl leading-relaxed font-medium">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ordered Items Table & Totals (7 cols) */}
        <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>অর্ডারের পণ্যসমূহ ({order.order_items?.length || 0} টি)</span>
              </h2>
              <span className="text-xs text-on-surface-variant">ভাউচার রশিদ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 rounded-l-xl">পণ্য</th>
                    <th className="px-3 py-2.5 text-right">একক মূল্য</th>
                    <th className="px-3 py-2.5 text-center">পরিমাণ</th>
                    <th className="px-3 py-2.5 text-right rounded-r-xl">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {order.order_items?.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container/20">
                      <td className="px-3 py-3">
                        <div className="font-bold text-on-surface">
                          {item.products?.name_bn || item.product_name}
                        </div>
                        {item.products?.name_bn && (
                          <div className="text-[10px] text-on-surface-variant">{item.product_name}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-3 py-3 text-center font-bold">
                        {item.quantity} {item.products?.unit || 'টি'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-primary font-display">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="mt-6 pt-4 border-t border-outline-variant/20 space-y-2 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>পণ্যসমূহের মোট মূল্য</span>
              <span>{formatCurrency(order.total_amount - (order.delivery_fee || 0))}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>ডেলিভারি চার্জ</span>
              <span>{order.delivery_fee ? formatCurrency(order.delivery_fee) : 'ফ্রি (৳০)'}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-outline-variant/20">
              <span>সর্বমোট পরিশোধযোগ্য</span>
              <span className="text-xl font-extrabold text-primary font-display">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
