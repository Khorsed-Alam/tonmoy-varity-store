import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import {
  Users, Search, Phone, MapPin, ShoppingBag, Eye,
  ArrowUpDown, UserCheck, ShieldCheck, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'customer' | 'admin'

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch profiles
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileErr) throw profileErr

      // 2. Fetch orders summary to calculate orders count & spend per customer
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total_amount, status')

      const orderStatsByUser = {}
      ;(orders || []).forEach(o => {
        if (!o.user_id) return
        if (!orderStatsByUser[o.user_id]) {
          orderStatsByUser[o.user_id] = { count: 0, totalSpend: 0 }
        }
        orderStatsByUser[o.user_id].count += 1
        if (['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(o.status)) {
          orderStatsByUser[o.user_id].totalSpend += Number(o.total_amount || 0)
        }
      })

      const enriched = (profiles || []).map(p => ({
        ...p,
        ordersCount: orderStatsByUser[p.id]?.count || 0,
        totalSpend: orderStatsByUser[p.id]?.totalSpend || 0,
      }))

      setCustomers(enriched)
    } catch (err) {
      console.error('Error loading customers:', err)
      toast.error('গ্রাহক তালিকা লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filtered = customers.filter(c => {
    if (roleFilter !== 'all' && c.role !== roleFilter) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.area?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term)
    )
  })

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('ডাউনলোড করার মতো কোনো গ্রাহক নেই')
      return
    }
    const headers = ['Name', 'Phone', 'Area', 'City', 'Role', 'Orders Count', 'Total Spent', 'Registered Date']
    const rows = filtered.map(c => [
      `"${c.full_name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.area || ''}"`,
      `"${c.city || ''}"`,
      c.role,
      c.ordersCount,
      c.totalSpend,
      `"${new Date(c.created_at).toLocaleDateString()}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `tonmoy_store_customers_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('গ্রাহক তালিকা ডাউনলোড সম্পন্ন!')
  }

  const totalRegistered = customers.length
  const totalRegularCustomers = customers.filter(c => c.ordersCount > 0).length
  const totalRevenueFromCustomers = customers.reduce((sum, c) => sum + c.totalSpend, 0)

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            গ্রাহক তালিকা ও খদ্দের তথ্য
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            নিবন্ধিত ক্রেতা ও নিয়মিত গ্রাহকদের অর্ডার হিস্ট্রি ও যোগাযোগ
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>এক্সেল এক্সপোর্ট</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant block">মোট নিবন্ধিত গ্রাহক</span>
            <span className="text-2xl font-extrabold text-primary font-display mt-1 block">
              {totalRegistered} জন
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant block">নিয়মিত কেনাকাটাকারী</span>
            <span className="text-2xl font-extrabold text-secondary font-display mt-1 block">
              {totalRegularCustomers} জন
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant block">গ্রাহক মোট বিক্রয় মূল্য</span>
            <span className="text-2xl font-extrabold text-on-surface font-display mt-1 block">
              {formatCurrency(totalRevenueFromCustomers)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="নাম, ফোন বা এলাকা দিয়ে খুঁজুন…"
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-container rounded-xl text-on-surface placeholder:text-on-surface-variant/70 border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            সকল ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('customer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'customer'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ক্রেতা
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'admin'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            অ্যাডমিন
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">গ্রাহক</th>
                <th className="px-4 py-3">মোবাইল</th>
                <th className="px-4 py-3">এলাকা / ঠিকানা</th>
                <th className="px-4 py-3 text-center">মোট অর্ডার</th>
                <th className="px-4 py-3 text-right">মোট ক্রয়মূল্য</th>
                <th className="px-4 py-3">যোগদানের তারিখ</th>
                <th className="px-4 py-3 text-right rounded-r-xl">যোগাযোগ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3.5">
                      <div className="h-6 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    কোনো গ্রাহক খুঁজে পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {c.full_name?.charAt(0) || 'গ'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-on-surface truncate">
                            {c.full_name || 'বেনামী গ্রাহক'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            {c.role === 'admin' ? (
                              <span className="text-primary font-bold flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" /> অ্যাডমিন
                              </span>
                            ) : (
                              'ক্রেতা অ্যাকাউন্ট'
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-on-surface">
                      {c.phone || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-secondary shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {c.area ? `${c.area}, ${c.city}` : c.address || 'বগুড়া'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-bold text-[11px]">
                        {c.ordersCount} টি
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-primary font-display">
                      {formatCurrency(c.totalSpend)}
                    </td>
                    <td className="px-4 py-3.5 text-on-surface-variant text-[11px]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>কল</span>
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
