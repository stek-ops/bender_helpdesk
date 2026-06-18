import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Lang } from "../i18n/translations"
import { getTranslation } from "../i18n/translations"

const STORAGE_KEY = "helpdesk_lang"

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Lang) || "uk"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
  }, [])

  const t = useCallback((key: string): string => {
    return getTranslation(key, lang)
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LangContext)
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return ctx
}
