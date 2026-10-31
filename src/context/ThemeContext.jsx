import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // 1. Check local storage
    const saved = localStorage.getItem('tvs_theme')
    if (saved === 'dark' || saved === 'light') return saved

    // 2. Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  // Apply theme to document element
  const applyTheme = useCallback((currentTheme) => {
    const root = document.documentElement
    if (currentTheme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('tvs_theme', theme)
  }, [theme, applyTheme])

  // Listen to system theme change if no explicit saved choice
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const saved = localStorage.getItem('tvs_theme')
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Listen to storage changes across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'tvs_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme)
    }
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
