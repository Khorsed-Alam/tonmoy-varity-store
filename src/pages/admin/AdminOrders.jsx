import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, ORDER_STATUS } from '../../lib/utils'
import { notifyOrderChange, useOrderSync } from '../../lib/syncEvents'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import {
  Search, Eye, ChevronDown, CheckCircle, Clock, Truck,
  CheckCheck, XCircle, Download, RefreshCw, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_FILTERS = [
  { id: '', label: 'সকল অর্ডার' },
  { id: 'pending', label: 'অপেক্ষমাণ' },
  { id: 'confirmed', label: 'কনফার্মড' },
  { id: 'processing', label: 'প্রস্তুত হচ্ছে' },
  { id: 'out_for_delivery', label: 'ডেলিভারিতে' },
  { id: 'delivered', label: 'সম্পন্ন' },
  { id: 'cancelled', label: 'বাতিল' },
]

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialSearch = searchParams.get('search') || ''

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [updatingId, setUpdatingId] = useState(null)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('orders')
        .select('id, order_number, status, total_amount, delivery_method, payment_method, full_name, phone, shipping_address, created_at', { count: 'exact' })

      if (statusFilter) q = q.eq('status', statusFilter)
      if (search.trim()) {
        q = q.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,order_number.ilike.%${search.trim()}%`)
      }

      const from = (page - 1) * PAGE_SIZE
      const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
      if (error) throw error

      setOrders(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error(err)
      toast.error('অর্ডার তালিকা লোড ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    load()
  }, [load])

  // Real-time synchronization across User End & Admin End
  useOrderSync(load)

  // Quick Status change from table
  const handleQuickStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      if (error) throw error

      // Broadcast order update
      notifyOrderChange({ orderId, status: newStatus })

      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে!')
      load()
    } catch (err) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('কোনো অর্ডার নেই')
      return
    }
    const headers = ['Order ID', 'Customer', 'Phone', 'Address', 'Amount', 'Payment', 'Status', 'Date']
    const rows = orders.map(o => [
      o.order_number || o.id,
      `"${o.full_name || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.shipping_address || ''}"`,
      o.total_amount,
      o.payment_method || 'cod',
      o.status,
      `"${new Date(o.created_at).toLocaleDateString()}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('অর্ডার এক্সপোর্ট সম্পন্ন!')
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            অর্ডার ব্যবস্থাপনা (Order Management)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            অনলাইন ও কাউন্টার অর্ডারের যাচাই, প্যাকেজিং ও ডেলিভারি স্ট্যাটাস ট্র্যাকিং
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
            title="রিফ্রেশ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>এক্সেল এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="অর্ডার নম্বর, গ্রাহকের নাম বা মোবাইল খুঁজুন…"
              className="w-full h-9 pl-9 pr-3 text-xs bg-surface-container rounded-xl text-on-surface placeholder:text-on-surface-variant/70 border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="text-xs text-on-surface-variant font-medium">
            মোট ফলাফল: <strong className="text-on-surface">{totalCount}</strong> টি অর্ডার
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-outline-variant/10 text-xs font-bold">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setStatusFilter(f.id); setPage(1); setSearchParams(f.id ? { status: f.id } : {}) }}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                statusFilter === f.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">অর্ডার নম্বর</th>
                <th className="px-4 py-3">গ্রাহক ও এলাকা</th>
                <th className="px-4 py-3">পেমেন্ট ও ডেলিভারি</th>
                <th className="px-4 py-3 text-right">মোট মূল্য</th>
                <th className="px-4 py-3 text-center">বর্তমান স্ট্যাটাস</th>
                <th className="px-4 py-3 text-center">দ্রুত অ্যাকশন</th>
                <th className="px-4 py-3 text-right rounded-r-xl">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3.5">
                      <div className="h-7 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    কোনো অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-primary font-mono">
                      #{o.order_number || o.id.slice(0, 8).toUpperCase()}
                      <div className="text-[10px] text-on-surface-variant font-sans font-normal mt-0.5">
                        {formatDate(o.created_at)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{o.full_name || 'গ্রাহক'}</span>
                        <span className="text-[11px] text-on-surface-variant">{o.phone || 'ফোন নেই'}</span>
                        <span className="text-[10px] text-on-surface-variant/80 truncate max-w-[160px]">
                          {o.shipping_address || 'বগুড়া সদর'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[10px] font-bold w-fit">
                          {o.payment_method === 'bkash' ? 'বিকাশ' : o.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'কাউন্টার ক্যাশ'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {o.delivery_method === 'home_delivery' ? 'হোম ডেলিভারি' : 'দোকান পিকআপ'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-extrabold text-primary font-display text-sm">
                      {formatCurrency(o.total_amount)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <OrderStatusBadge status={o.status} />
                    </td>

                    {/* Quick status dropdown / actions */}
                    <td className="px-4 py-3.5 text-center">
                      {o.status === 'pending' ? (
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleQuickStatusChange(o.id, 'confirmed')}
                          className="px-2.5 py-1 bg-secondary text-on-secondary rounded-lg text-xs font-bold hover:bg-primary transition-colors shadow-xs"
                        >
                          কনফার্ম
                        </button>
                      ) : o.status === 'confirmed' ? (
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleQuickStatusChange(o.id, 'processing')}
                          className="px-2.5 py-1 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-colors"
                        >
                          প্রস্তুত
                        </button>
                      ) : o.status === 'processing' ? (
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleQuickStatusChange(o.id, 'out_for_delivery')}
                          className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
                        >
                          ডেলিভারি
                        </button>
                      ) : o.status === 'out_for_delivery' ? (
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleQuickStatusChange(o.id, 'delivered')}
                          className="px-2.5 py-1 bg-secondary text-on-secondary rounded-lg text-xs font-bold hover:bg-primary transition-colors shadow-xs"
                        >
                          সম্পন্ন
                        </button>
                      ) : (
                        <span className="text-[11px] text-secondary font-bold">✓ কমপ্লিট</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ভিউ</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
          <span>পৃষ্ঠা {page} / {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface font-bold transition-all"
            >
              পূর্ববর্তী
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-xl font-bold transition-all ${
                  p === page
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface font-bold transition-all"
            >
              পরবর্তী
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
