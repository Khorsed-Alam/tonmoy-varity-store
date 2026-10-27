import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'

export default function MobileBottomNav() {
  const location = useLocation()
  const { itemCount, total } = useCart()
  const { isAdmin, user } = useAuth()
  const { t } = useLang()

  const navItems = [
    {
      to: '/',
      label: t('হোম', 'Home'),
      icon: 'storefront',
      isActive: location.pathname === '/',
    },
    {
      to: '/shop',
      label: t('মুদি বাজার', 'Shop'),
      icon: 'category',
      isActive: location.pathname.startsWith('/shop'),
    },
    {
      to: '/cart',
      label: t('কার্ট', 'Cart'),
      icon: 'shopping_cart',
      isActive: location.pathname === '/cart',
      badge: itemCount > 0 ? (total > 0 ? `৳${total}` : itemCount) : null,
    },
    {
      to: user ? '/orders' : '/login',
      label: t('অর্ডার', 'Orders'),
      icon: 'receipt_long',
      isActive: location.pathname.startsWith('/orders'),
    },
    {
      to: isAdmin ? '/admin' : user ? '/profile' : '/login',
      label: isAdmin ? t('দোকান', 'Admin') : user ? t('প্রোফাইল', 'Profile') : t('লগইন', 'Login'),
      icon: isAdmin ? 'space_dashboard' : 'person',
      isActive: location.pathname.startsWith('/admin') || location.pathname === '/profile',
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-150 active:scale-95 ${
              item.isActive
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span className={`material-symbols-outlined text-[22px] ${item.isActive ? 'font-fill' : ''}`}>
                {item.icon}
              </span>
              {item.badge && (
                <span className="absolute -top-1 -right-2.5 bg-primary text-on-primary text-[10px] px-1 py-0.2 rounded-full font-bold shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
