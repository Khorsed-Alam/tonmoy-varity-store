import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, ORDER_STATUS, DELIVERY_METHODS, PAYMENT_METHODS } from '../../lib/utils'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminOrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    supabase.from('orders')
      .select('*, order_items(*, products(name, name_bn, unit))')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder(data)
        setNewStatus(data?.status || '')
        setLoading(false)
      })
  }, [orderId])

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order.status) return
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setUpdating(false)
    if (error) { toast.error('Status update failed'); return }
    setOrder(o => ({ ...o, status: newStatus }))
    toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে!')
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!order) return (
    <div>
      <Link to="/admin/orders" className="btn-secondary inline-flex items-center gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" /> ফিরে যান
      </Link>
      <p className="text-gray-500">অর্ডার পাওয়া যায়নি</p>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/admin/orders" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            অর্ডার #{order.order_number || order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="ml-auto"><OrderStatusBadge status={order.status} /></div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Status Update */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-800 mb-4">স্ট্যাটাস আপডেট</h2>
          <div className="flex gap-3">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field flex-1">
              {Object.entries(ORDER_STATUS).map(([key, val]) => (
                <option key={key} value={key}>{val.label} — {val.labelEN}</option>
              ))}
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={updating || newStatus === order.status}
              className="btn-primary flex items-center gap-2 py-2.5 px-4"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              আপডেট
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-800 mb-4">গ্রাহকের তথ্য</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">নাম:</span><span className="font-medium">{order.full_name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ফোন:</span><span className="font-medium">{order.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ডেলিভারি:</span><span className="font-medium">{DELIVERY_METHODS[order.delivery_method]?.labelEN}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">পেমেন্ট:</span><span className="font-medium">{PAYMENT_METHODS[order.payment_method]?.labelEN}</span></div>
            {order.shipping_address && (
              <div><span className="text-gray-500">ঠিকানা:</span> <span className="font-medium">{order.shipping_address}</span></div>
            )}
            {order.notes && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-xl">
                <span className="text-xs text-gray-500">নোট: </span>{order.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <h2 className="font-bold text-gray-800 mb-4">পণ্যসমূহ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-3 font-semibold text-gray-600">পণ্য</th>
                <th className="text-right pb-3 font-semibold text-gray-600">একক মূল্য</th>
                <th className="text-right pb-3 font-semibold text-gray-600">পরিমাণ</th>
                <th className="text-right pb-3 font-semibold text-gray-600">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.order_items?.map(item => (
                <tr key={item.id}>
                  <td className="py-3">
                    <div className="font-medium">{item.products?.name_bn || item.product_name}</div>
                    {item.products?.name_bn && <div className="text-xs text-gray-400">{item.product_name}</div>}
                  </td>
                  <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right">{item.quantity} {item.products?.unit || 'টি'}</td>
                  <td className="py-3 text-right font-semibold">{formatCurrency(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200">
              <tr>
                <td colSpan={3} className="py-3 text-right text-gray-500">ডেলিভারি চার্জ</td>
                <td className="py-3 text-right">{order.delivery_fee === 0 ? 'ফ্রি' : formatCurrency(order.delivery_fee)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-3 text-right font-bold text-gray-800">মোট</td>
                <td className="py-3 text-right font-bold text-lg">{formatCurrency(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
