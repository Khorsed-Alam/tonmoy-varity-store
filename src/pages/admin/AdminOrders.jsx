import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, ORDER_STATUS } from '../../lib/utils'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import { Search, Eye, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('id, order_number, status, total_amount, delivery_method, payment_method, full_name, phone, created_at', { count: 'exact' })

    if (statusFilter) q = q.eq('status', statusFilter)
    if (search) q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,order_number.ilike.%${search}%`)

    const from = (page - 1) * PAGE_SIZE
    const { data, count } = await q.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)

    setOrders(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }, [statusFilter, search, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">অর্ডার ব্যবস্থাপনা</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-10 py-2 text-sm" placeholder="নাম বা ফোন খুঁজুন…" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field py-2 pr-8 text-sm appearance-none min-w-[160px]">
            <option value="">সব স্ট্যাটাস</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <option key={s} value={s}>{ORDER_STATUS[s]?.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">অর্ডার</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">গ্রাহক</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">স্ট্যাটাস</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">মোট</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">তারিখ</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="skeleton h-8 rounded" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">কোনো অর্ডার নেই</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-medium text-gray-800">
                    #{o.order_number || o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800">{o.full_name || '—'}</div>
                    <div className="text-xs text-gray-400">{o.phone}</div>
                  </td>
                  <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(o.total_amount)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(o.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/admin/orders/${o.id}`} className="p-1.5 rounded-lg hover:bg-brand-mint text-brand-fresh inline-flex">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold ${p === page ? 'gradient-brand text-white' : 'bg-white text-brand-dark hover:bg-brand-mint'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
