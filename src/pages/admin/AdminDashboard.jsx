import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'
import { useAuth } from '../../contexts/AuthContext'

const StatCard = ({ icon, label, value, sublabel, link, accent }) => (
  <Link to={link}
    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group border border-[#e3eae3] hover:border-[#176b3a]/30 flex flex-col gap-3">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-[#052016]">{value}</div>
      <div className="text-sm text-[#404940] mt-0.5 font-medium">{label}</div>
      {sublabel && <div className="text-xs text-[#707a6f] mt-0.5">{sublabel}</div>}
    </div>
    <div className="text-xs text-[#176b3a] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      বিস্তারিত দেখুন →
    </div>
  </Link>
)

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0, pendingOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [prodRes, orderRes, userRes, revenueRes, recentRes, stockRes, pendingRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
        supabase.from('orders').select('total_amount').in('status', ['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered']),
        supabase.from('orders').select('id, order_number, status, total_amount, created_at, full_name, phone').order('created_at', { ascending: false }).limit(6),
        supabase.from('products').select('id, name, name_bn, stock_quantity, unit').lte('stock_quantity', 5).eq('is_active', true).order('stock_quantity').limit(8),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      const revenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0)
      setStats({
        products: prodRes.count || 0,
        orders: orderRes.count || 0,
        users: userRes.count || 0,
        revenue,
        pendingOrders: pendingRes.count || 0,
      })
      setRecentOrders(recentRes.data || [])
      setLowStock(stockRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const quickLinks = [
    { icon: '📦', label: 'পণ্য যোগ করুন', to: '/admin/products' },
    { icon: '📋', label: 'অর্ডার দেখুন', to: '/admin/orders' },
    { icon: '🗂️', label: 'ক্যাটাগরি', to: '/admin/categories' },
    { icon: '📊', label: 'ইনভেন্টরি', to: '/admin/inventory' },
    { icon: '⚙️', label: 'সেটিংস', to: '/admin/settings' },
  ]

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-[#d7f5e4] rounded-lg w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#d7f5e4] rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#052016]">ড্যাশবোর্ড</h1>
          <p className="text-sm text-[#404940] mt-0.5">
            স্বাগতম, {profile?.full_name || 'Admin'} 👋 — আজকের পরিস্থিতির সারসংক্ষেপ
          </p>
        </div>
        {stats.pendingOrders > 0 && (
          <Link to="/admin/orders?status=pending"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-bold hover:bg-orange-100 transition-colors">
            🔔 {stats.pendingOrders}টি নতুন অর্ডার অপেক্ষায় →
          </Link>
        )}
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickLinks.map(ql => (
          <Link key={ql.to} to={ql.to}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e3eae3] text-[#052016] text-sm font-semibold hover:bg-[#d7f5e4] hover:border-[#176b3a]/40 transition-all whitespace-nowrap shadow-sm">
            <span>{ql.icon}</span> {ql.label}
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="মোট পণ্য" value={stats.products} sublabel="সক্রিয় পণ্যসমূহ" link="/admin/products" accent="bg-[#d7f5e4]" />
        <StatCard icon="🛍️" label="মোট অর্ডার" value={stats.orders} sublabel="সব সময়ের" link="/admin/orders" accent="bg-blue-50" />
        <StatCard icon="👥" label="মোট গ্রাহক" value={stats.users} sublabel="নিবন্ধিত" link="#" accent="bg-purple-50" />
        <StatCard icon="💰" label="মোট রাজস্ব" value={formatCurrency(stats.revenue)} sublabel="সম্পূর্ণ অর্ডার থেকে" link="#" accent="bg-yellow-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e3eae3] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#e3eae3]">
            <h2 className="font-bold text-[#052016] flex items-center gap-2">
              🛍️ <span>সাম্প্রতিক অর্ডার</span>
            </h2>
            <Link to="/admin/orders" className="text-[#176b3a] text-sm font-semibold hover:underline">
              সব দেখুন →
            </Link>
          </div>
          <div className="divide-y divide-[#e3eae3]">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#707a6f] text-sm">কোনো অর্ডার নেই</div>
            ) : recentOrders.map(order => (
              <Link key={order.id} to={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#e7fff1] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#176b3a] flex items-center justify-center shrink-0">
                  <span className="text-white text-base">📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#052016] flex items-center gap-2 flex-wrap">
                    <span>#{order.order_number || order.id.slice(0, 8).toUpperCase()}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-[#707a6f] mt-0.5 truncate">
                    {order.full_name} · {order.phone} · {formatDate(order.created_at)}
                  </div>
                </div>
                <span className="font-bold text-sm text-[#052016] shrink-0">{formatCurrency(order.total_amount)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e3eae3] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#e3eae3]">
            <h2 className="font-bold text-[#052016] flex items-center gap-2">
              📊 <span>কম স্টক সতর্কতা</span>
            </h2>
            <Link to="/admin/inventory" className="text-[#176b3a] text-sm font-semibold hover:underline">
              ইনভেন্টরি →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-[#404940] text-sm font-medium">সব পণ্যের স্টক ভালো আছে</div>
            </div>
          ) : (
            <div className="divide-y divide-[#e3eae3]">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-semibold text-[#052016]">{p.name_bn || p.name}</div>
                    <div className="text-xs text-[#707a6f]">{p.name}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.stock_quantity === 0
                      ? 'bg-red-100 text-red-700'
                      : p.stock_quantity <= 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.stock_quantity === 0 ? '❌ স্টক শেষ' : `⚠️ ${p.stock_quantity} ${p.unit || 'টি'} বাকি`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Actions Footer */}
      <div className="bg-[#d7f5e4] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#bfc9bd]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#176b3a] flex items-center justify-center text-white text-lg shrink-0">
            🏪
          </div>
          <div>
            <div className="font-bold text-[#052016] text-sm">তন্ময় ভ্যারাইটি স্টোর — অ্যাডমিন কনসোল</div>
            <div className="text-xs text-[#404940]">হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings"
            className="px-4 py-2 rounded-lg bg-white text-[#005128] font-semibold text-sm hover:bg-[#e7fff1] transition-colors shadow-sm border border-[#bfc9bd]">
            ⚙️ সেটিংস
          </Link>
          <Link to="/"
            className="px-4 py-2 rounded-lg bg-[#005128] text-white font-semibold text-sm hover:bg-[#176b3a] transition-colors shadow-sm">
            🏪 দোকান দেখুন
          </Link>
        </div>
      </div>
    </div>
  )
}
