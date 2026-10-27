import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Warehouse, Settings, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, labelBN: 'ড্যাশবোর্ড', labelEN: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, labelBN: 'পণ্য', labelEN: 'Products' },
  { to: '/admin/categories', icon: Tag, labelBN: 'ক্যাটাগরি', labelEN: 'Categories' },
  { to: '/admin/orders', icon: ShoppingBag, labelBN: 'অর্ডার', labelEN: 'Orders' },
  { to: '/admin/inventory', icon: Warehouse, labelBN: 'ইনভেন্টরি', labelEN: 'Inventory' },
  { to: '/admin/settings', icon: Settings, labelBN: 'সেটিংস', labelEN: 'Settings' },
]

export default function AdminLayout() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col w-64 gradient-brand min-h-screen">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold text-white">
            ত
          </div>
          <div>
            <div className="text-xs text-white/60">অ্যাডমিন</div>
            <div className="font-bold text-white text-sm">ভ্যারাইটি স্টোর</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, labelBN, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {labelBN}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4 border-t border-white/20">
        {profile && (
          <div className="px-4 py-2 mb-2 text-xs text-white/60 truncate">
            {profile.full_name || profile.email}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="admin-nav-link w-full text-red-300 hover:bg-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          লগ আউট
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="font-medium text-brand-dark">অ্যাডমিন</span>
            <ChevronRight className="w-3 h-3" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
