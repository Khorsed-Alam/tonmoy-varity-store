import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, ORDER_STATUS } from '../../lib/utils'
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import OrderStatusBadge from '../../components/ui/OrderStatusBadge'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [prodRes, orderRes, userRes, revenueRes, recentRes, stockRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
        supabase.from('orders').select('total_amount').in('status', ['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered']),
        supabase.from('orders').select('id, order_number, status, total_amount, created_at, full_name').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id, name, name_bn, stock_quantity, unit').lte('stock_quantity', 5).eq('is_active', true).order('stock_quantity').limit(8),
      ])

      const revenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0)

      setStats({
        products: prodRes.count || 0,
        orders: orderRes.count || 0,
        users: userRes.count || 0,
        revenue,
      })
      setRecentOrders(recentRes.data || [])
      setLowStock(stockRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'মোট পণ্য', labelEN: 'Total Products', value: stats.products, icon: Package, color: 'bg-blue-50 text-blue-600', link: '/admin/products' },
    { label: 'মোট অর্ডার', labelEN: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'bg-green-50 text-green-600', link: '/admin/orders' },
    { label: 'মোট গ্রাহক', labelEN: 'Total Customers', value: stats.users, icon: Users, color: 'bg-purple-50 text-purple-600', link: '#' },
    { label: 'মোট রাজস্ব', labelEN: 'Total Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600', link: '#' },
  ]

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">ড্যাশবোর্ড</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">সাম্প্রতিক অর্ডার</h2>
            <Link to="/admin/orders" className="text-brand-fresh text-sm flex items-center gap-1 hover:underline">
              সব দেখুন <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">কোনো অর্ডার নেই</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                      #{order.order_number || order.id.slice(0, 6).toUpperCase()}
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-gray-400">{order.full_name} · {formatDate(order.created_at)}</div>
                  </div>
                  <span className="font-bold text-sm text-gray-800 shrink-0">{formatCurrency(order.total_amount)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">কম স্টক পণ্য</h2>
            <Link to="/admin/inventory" className="text-brand-fresh text-sm flex items-center gap-1 hover:underline">
              ইনভেন্টরি <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">✅ সব পণ্যের স্টক ভালো আছে</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.name_bn || p.name}</div>
                    <div className="text-xs text-gray-400">{p.name}</div>
                  </div>
                  <span className={`badge ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.stock_quantity === 0 ? 'স্টক শেষ' : `${p.stock_quantity} ${p.unit || 'টি'} বাকি`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
