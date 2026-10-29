import { createContext, useContext, useState } from 'react'

export const LanguageContext = createContext(null)

export const LANGUAGES = { BN: 'bn', EN: 'en' }

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('tvs_lang') || LANGUAGES.BN)

  const toggleLang = () => {
    const next = lang === LANGUAGES.BN ? LANGUAGES.EN : LANGUAGES.BN
    setLang(next)
    localStorage.setItem('tvs_lang', next)
  }

  const t = (bnText, enText) => (lang === LANGUAGES.BN ? bnText : (enText || bnText))

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isBN: lang === LANGUAGES.BN }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}

export default LanguageContext

