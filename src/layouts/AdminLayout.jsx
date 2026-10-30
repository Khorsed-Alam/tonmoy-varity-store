import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Warehouse, Users, BarChart3, Settings, LogOut,
  Menu, X, Bell, Search, Calendar, Store, CheckCircle, ChevronDown, Sparkles
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useProductSync, useOrderSync, useBannerSync } from '../lib/syncEvents'

export default function AdminLayout() {
  const { signOut, profile } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [counts, setCounts] = useState({ products: 0, pendingOrders: 0, lowStock: 0 })
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  const fetchCounts = useCallback(async () => {
    try {
      const [prodRes, pendingRes, stockRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, order_number, total_amount, created_at, full_name').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 5).eq('is_active', true)
      ])

      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const totalProds = (prodRes.count || 0) + localCustom.length

      setCounts({
        products: totalProds,
        pendingOrders: pendingRes.data?.length || 0,
        lowStock: stockRes.count || 0
      })
      setNotifications(pendingRes.data || [])
    } catch (err) {
      console.error('Error fetching admin badges:', err)
    }
  }, [])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  // Real-time synchronization for Admin Sidebar and Notification Badge
  useProductSync(fetchCounts)
  useOrderSync(fetchCounts)
  useBannerSync(fetchCounts)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!globalSearch.trim()) return
    navigate(`/admin/orders?search=${encodeURIComponent(globalSearch.trim())}`)
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, labelBN: 'ড্যাশবোর্ড', labelEN: 'Dashboard', end: true },
    { to: '/admin/products', icon: Package, labelBN: 'পণ্যসমূহ', labelEN: 'Products', badge: counts.products ? counts.products.toLocaleString('bn-BD') : null },
    { to: '/admin/categories', icon: Tag, labelBN: 'ক্যাটাগরি', labelEN: 'Categories' },
    { to: '/admin/banners', icon: Sparkles, labelBN: 'ব্যানার ও অফার', labelEN: 'Banners & Offers' },
    { to: '/admin/orders', icon: ShoppingBag, labelBN: 'অর্ডার ব্যবস্থাপনা', labelEN: 'Orders', badge: counts.pendingOrders ? `${counts.pendingOrders} নতুন` : null, badgeColor: 'bg-error-container text-on-error-container' },
    { to: '/admin/inventory', icon: Warehouse, labelBN: 'মজুদ / স্টক', labelEN: 'Inventory', badge: counts.lowStock ? `${counts.lowStock} লো-স্টক` : null, badgeColor: 'bg-error-container text-on-error-container' },
    { to: '/admin/customers', icon: Users, labelBN: 'গ্রাহক তালিকা', labelEN: 'Customers' },
    { to: '/admin/reports', icon: BarChart3, labelBN: 'হিসাব ও রিপোর্ট', labelEN: 'Reports' },
    { to: '/admin/settings', icon: Settings, labelBN: 'সেটিংস', labelEN: 'Settings' },
  ]

  const todayFormatted = new Intl.DateTimeFormat('bn-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-surface-container-low text-on-surface border-r border-outline-variant/30 select-none">
      <div className="flex flex-col gap-4">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm font-bold text-xl">
              <Store className="w-5 h-5 text-on-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface text-base leading-tight font-display">তন্ময় ভ্যারাইটি স্টোর</span>
              <span className="text-xs text-on-surface-variant font-medium">মুদি ও ডিপার্টমেন্টাল শপ</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Live Indicator */}
        <div className="px-4">
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-semibold text-on-surface">শাখা: বগুড়া প্রধান শাখা</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-bold">
              সক্রিয়
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(({ to, icon: Icon, labelBN, labelEN, end, badge, badgeColor }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{lang === 'bn' ? labelBN : labelEN}</span>
              </div>
              {badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badgeColor || 'bg-surface-container-high text-on-surface'}`}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Support & System Status */}
      <div className="p-4 flex flex-col gap-3 border-t border-outline-variant/20">
        <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              📞
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">হেল্পলাইন</span>
              <span className="text-[11px] text-on-surface-variant">০১৭০৭-৮৮০৫৬৯</span>
            </div>
          </div>
          <span className="text-[11px] text-secondary font-bold bg-secondary-container px-2 py-0.5 rounded-full">
            ২৪/৭
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-xs text-on-surface-variant">
          <span>ভার্সন ৩.২.৪</span>
          <span className="text-secondary flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            ক্লাউড সিঙ্ক
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-error bg-error-container/40 hover:bg-error-container text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          লগ আউট (Sign Out)
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface font-sans text-on-surface antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Bar matching Stitch Design */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 h-16 flex items-center justify-between px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Store Pill */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-bold text-on-surface">দোকান খোলা</span>
              <span className="text-on-surface-variant text-xs">•</span>
              <span className="text-xs font-semibold text-secondary">অনলাইন অর্ডার চালু</span>
            </div>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center w-64 lg:w-80">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="অর্ডার নম্বর, পণ্য বা ফোন নম্বর…"
                className="w-full h-9 pl-9 pr-3 text-xs bg-surface-container rounded-xl text-on-surface placeholder:text-on-surface-variant/70 border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Today's Date */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-xl text-xs font-medium text-on-surface">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>{todayFormatted}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center p-0.5 bg-surface-container rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2 py-1 rounded-lg transition-all ${lang === 'bn' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                EN
              </button>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {counts.pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {counts.pendingOrders}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                    <span className="text-xs font-bold text-on-surface">অপেক্ষমাণ অর্ডারসমূহ</span>
                    <NavLink
                      to="/admin/orders?status=pending"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      সব দেখুন
                    </NavLink>
                  </div>
                  <div className="divide-y divide-outline-variant/10 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-xs text-on-surface-variant">কোনো নতুন অপেক্ষমাণ অর্ডার নেই</div>
                    ) : (
                      notifications.map(n => (
                        <NavLink
                          key={n.id}
                          to={`/admin/orders/${n.id}`}
                          onClick={() => setShowNotifications(false)}
                          className="py-2.5 px-2 flex flex-col gap-0.5 hover:bg-surface-container rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                            <span>#{n.order_number || n.id.slice(0, 6)}</span>
                            <span className="text-primary">৳{n.total_amount}</span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                            <span>{n.full_name || 'গ্রাহক'}</span>
                            <span className="text-error font-medium">অপেক্ষমাণ</span>
                          </div>
                        </NavLink>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-outline-variant/40 mx-0.5" />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface leading-tight">
                  {profile?.full_name || 'মোঃ তৌহিদুল ইসলাম বিন্দু'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  {profile?.role === 'admin' ? 'প্রোপ্রাইটার ও সুপার অ্যাডমিন' : 'ম্যানেজার'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-xs">
                {profile?.full_name?.charAt(0) || 'ত'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
