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
    <header className="sticky top-0 z-50 glass border-b border-brand-light">
      <div className="page-container">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
              ত
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-brand-muted font-medium leading-none">
                {t('তন্ময়', 'Tonmoy')}
              </div>
              <div className="text-sm font-bold text-brand-dark leading-tight">
                {t('ভ্যারাইটি স্টোর', 'Varity Store')}
              </div>
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('পণ্য খুঁজুন…', 'Search products…')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-fresh focus:ring-2 focus:ring-brand-mint transition-all"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-mint transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>

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
