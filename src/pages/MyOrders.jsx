import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabaseClient as supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { formatCurrency, formatDate } from '../lib/utils'
import OrderStatusBadge from '../components/common/OrderStatusBadge'
import EmptyState from '../components/common/EmptyState'
import { ShoppingBag, ChevronRight } from 'lucide-react'

export default function MyOrders() {
  const { user } = useAuth()
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setLoading(false)
      })
  }, [user.id])

  if (loading) return (
    <div className="page-container py-8">
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title">{t('আমার অর্ডার', 'My Orders')}</h1>
      <p className="section-subtitle">{t('আপনার সকল অর্ডারের ইতিহাস', 'History of all your orders')}</p>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title={t('কোনো অর্ডার নেই', 'No orders yet')}
          subtitle={t('আপনি এখনো কোনো অর্ডার দেননি।', "You haven't placed any orders yet.")}
          action={<Link to="/shop" className="btn-primary inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" />{t('কেনাকাটা করুন', 'Shop Now')}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-brand-dark text-sm">
                    #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="text-xs text-brand-muted mt-0.5">{formatDate(order.created_at)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-brand-dark">{formatCurrency(order.total_amount)}</div>
                <div className="text-xs text-brand-muted">{order.order_items?.[0]?.count || 0} {t('পণ্য', 'items')}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-fresh transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
