import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LanguageContext'

export default function ThemeToggle({ className = '', variant = 'button' }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const { t } = useLang()

  if (variant === 'segmented') {
    return (
      <div className={`flex items-center bg-surface-container-high p-0.5 rounded-full text-xs font-semibold ${className}`}>
        <button
          type="button"
          onClick={() => isDark && toggleTheme()}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            !isDark
              ? 'bg-surface-container-lowest text-amber-600 shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title={t('লাইট মোড', 'Light Mode')}
          aria-label={t('লাইট মোড সক্রিয় করুন', 'Switch to light mode')}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="text-[11px]">{t('লাইট', 'Light')}</span>
        </button>
        <button
          type="button"
          onClick={() => !isDark && toggleTheme()}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            isDark
              ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title={t('ডার্ক মোড', 'Dark Mode')}
          aria-label={t('ডার্ক মোড সক্রিয় করুন', 'Switch to dark mode')}
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="text-[11px]">{t('ডার্ক', 'Dark')}</span>
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all active:scale-95 flex items-center justify-center relative group ${className}`}
      title={isDark ? t('লাইট মোডে পরিবর্তন করুন', 'Switch to Light Mode') : t('ডার্ক মোডে পরিবর্তন করুন', 'Switch to Dark Mode')}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 animate-fade-in transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-primary animate-fade-in transition-transform group-hover:-rotate-12" />
      )}
    </button>
  )
}
