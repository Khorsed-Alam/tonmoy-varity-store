import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { Home, ShoppingBag } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useLang()
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="text-8xl mb-6">🛒</div>
      <h1 className="text-6xl font-bold text-brand-dark mb-3">404</h1>
      <h2 className="text-2xl font-semibold text-brand-dark mb-3">
        {t('পেজটি পাওয়া যায়নি', 'Page Not Found')}
      </h2>
      <p className="text-brand-muted mb-8 max-w-sm">
        {t('আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে নেওয়া হয়েছে।', 'The page you are looking for does not exist or has been moved.')}
      </p>
      <div className="flex gap-4">
        <Link to="/" className="btn-primary flex items-center gap-2">
          <Home className="w-4 h-4" /> {t('হোমে যান', 'Go Home')}
        </Link>
        <Link to="/shop" className="btn-secondary flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> {t('দোকান', 'Shop')}
        </Link>
      </div>
    </div>
  )
}
