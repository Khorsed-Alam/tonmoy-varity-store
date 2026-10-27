import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X, Globe, LogOut, Package } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'

export default function Navbar() {
  const { itemCount } = useCart()
  const { user, isAdmin, signOut } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-light shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      {/* Top Announcement Bar from Stitch Design */}
      <div className="bg-primary text-on-primary px-3 sm:px-4 py-1 text-[10px] sm:text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[14px] sm:text-[15px] shrink-0">electric_moped</span>
          <span className="truncate">{t('🛵 আশেপাশের এলাকায় ৬০ মিনিটে ফ্রি ডেলিভারি! (৳৫০০+ অর্ডারে)', '🛵 Free 60-min delivery nearby! (Orders ৳500+)')}</span>
        </div>
        <a href="tel:01717999460" className="flex items-center gap-1 bg-primary-container px-2 py-0.5 rounded text-white text-[10px] sm:text-xs whitespace-nowrap hover:opacity-90 transition-opacity shrink-0">
          <span>📞 {t('০১৭১৭-৯৯৯৪৬০', '01717-999460')}</span>
        </a>
      </div>

      <div className="page-container">
        <div className="flex items-center justify-between h-15 sm:h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">storefront</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm md:text-base font-bold text-primary leading-tight font-display truncate">
                {t('মেসার্স তন্ময় ভ্যারাইটি স্টোর', 'M/S Tonmoy Varity Store')}
              </div>
              <div className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium leading-none truncate mt-0.5">
                {t('নারুয়ামালা হাট, গাবতলী, বগুড়া', 'Naruamala Haat, Gabtoli, Bogura')}
              </div>
            </div>
          </Link>

          {/* Location Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full text-xs text-primary font-medium">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            <span className="text-on-surface">{t('হাজি ইউসুফ আলী মার্কেট, বগুড়া', 'Haji Yusuf Ali Market, Bogura')}</span>
            <span className="material-symbols-outlined text-[15px] text-outline">keyboard_arrow_down</span>
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('চাল, ডাল, তেল খুঁজুন… / Search rice, oil…', 'Search rice, lentils, oil…')}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-secondary-container transition-all"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Segmented Language toggle */}
            <div className="flex items-center bg-surface-container-high p-0.5 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => lang !== 'bn' && toggleLang()}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'bn'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => lang !== 'en' && toggleLang()}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'en'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-brand-mint transition-colors">
              <ShoppingCart className="w-5 h-5 text-brand-dark" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse-green">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-brand-mint transition-colors"
                >
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-mint transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        {t('অ্যাডমিন প্যানেল', 'Admin Panel')}
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-mint transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('প্রোফাইল', 'Profile')}
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-mint transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      {t('আমার অর্ডার', 'My Orders')}
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-danger hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('লগ আউট', 'Log Out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary py-2 px-4 text-sm"
              >
                {t('লগইন', 'Login')}
              </Link>
            )}
          </nav>

          {/* Mobile: Cart + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/cart" className="relative p-2 rounded-xl hover:bg-brand-mint">
              <ShoppingCart className="w-5 h-5 text-brand-dark" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl hover:bg-brand-mint"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-slide-up border-t border-brand-light pt-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('পণ্য খুঁজুন…', 'Search products…')}
                  className="input-field pl-10"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">{t('হোম', 'Home')}</Link>
              <Link to="/shop" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">{t('দোকান', 'Shop')}</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">{t('প্রোফাইল', 'Profile')}</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">{t('আমার অর্ডার', 'My Orders')}</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">{t('অ্যাডমিন', 'Admin')}</Link>}
                  <button onClick={handleSignOut} className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-danger hover:bg-red-50 text-left">{t('লগ আউট', 'Log Out')}</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-sm py-2.5">{t('লগইন / নিবন্ধন', 'Login / Register')}</Link>
              )}
              <button onClick={toggleLang} className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-brand-mint text-sm font-medium text-brand-dark">
                <Globe className="w-4 h-4" />
                {lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
