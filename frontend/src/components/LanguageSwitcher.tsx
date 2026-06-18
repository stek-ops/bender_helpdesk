import { useState, useRef, useEffect } from "react"
import type { Lang } from "../i18n/translations"
import { Globe } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

const flagSvg: Record<Lang, string> = {
  uk: `<svg viewBox="0 0 4 3" width="20" height="15" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="3" fill="#0057B7"/><rect y="1.5" width="4" height="1.5" fill="#FFD700"/></svg>`,
  en: `<svg viewBox="0 0 19 10" width="20" height="10.5" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="19" height="10" fill="#b31942"/>
<rect y="1.428" width="19" height="1.428" fill="#FFF"/>
<rect y="4.284" width="19" height="1.428" fill="#FFF"/>
<rect y="7.14" width="19" height="1.428" fill="#FFF"/>
<rect width="7.6" height="5.712" fill="#0a3161"/>
<g fill="#FFF">
<polygon points="0.76,0.285 0.95,0.856 1.568,0.856 1.064,1.237 1.254,1.808 0.76,1.427 0.266,1.808 0.456,1.237 -0.048,0.856 0.57,0.856"/>
<polygon points="2.28,0.285 2.47,0.856 3.088,0.856 2.584,1.237 2.774,1.808 2.28,1.427 1.786,1.808 1.976,1.237 1.472,0.856 2.09,0.856"/>
<polygon points="3.8,0.285 3.99,0.856 4.608,0.856 4.104,1.237 4.294,1.808 3.8,1.427 3.306,1.808 3.496,1.237 2.992,0.856 3.61,0.856"/>
<polygon points="5.32,0.285 5.51,0.856 6.128,0.856 5.624,1.237 5.814,1.808 5.32,1.427 4.826,1.808 5.016,1.237 4.512,0.856 5.13,0.856"/>
<polygon points="6.84,0.285 7.03,0.856 7.648,0.856 7.144,1.237 7.334,1.808 6.84,1.427 6.346,1.808 6.536,1.237 6.032,0.856 6.65,0.856"/>
<polygon points="1.52,1.997 1.71,2.568 2.328,2.568 1.824,2.949 2.014,3.52 1.52,3.139 1.026,3.52 1.216,2.949 0.712,2.568 1.33,2.568"/>
<polygon points="3.04,1.997 3.23,2.568 3.848,2.568 3.344,2.949 3.534,3.52 3.04,3.139 2.546,3.52 2.736,2.949 2.232,2.568 2.85,2.568"/>
<polygon points="4.56,1.997 4.75,2.568 5.368,2.568 4.864,2.949 5.054,3.52 4.56,3.139 4.066,3.52 4.256,2.949 3.752,2.568 4.37,2.568"/>
<polygon points="6.08,1.997 6.27,2.568 6.888,2.568 6.384,2.949 6.574,3.52 6.08,3.139 5.586,3.52 5.776,2.949 5.272,2.568 5.89,2.568"/>
</g>
</svg>`,
  pl: `<svg viewBox="0 0 4 3" width="20" height="15" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="3" fill="#fff"/><rect y="1.5" width="4" height="1.5" fill="#DC143C"/></svg>`,
}

const labels: Record<Lang, string> = {
  uk: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
  en: "English (US)",
  pl: "Polski",
}

export default function LanguageSwitcher() {
  const { t, lang, setLang } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const languages: { value: Lang }[] = [
    { value: "uk" },
    { value: "en" },
    { value: "pl" },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer"
        title={t("lang_select")}
      >
        <Globe className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--b24-card)] border border-[var(--b24-border)] rounded-lg shadow-lg z-50 py-1">
          {languages.map(l => (
            <button
              key={l.value}
              onClick={() => { setLang(l.value); setOpen(false) }}
              className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                lang === l.value
                  ? "bg-[var(--b24-primary)] text-white"
                  : "text-[var(--b24-text)] hover:bg-[var(--b24-hover)]"
              }`}
            >
              <span className="flex-shrink-0 w-5 h-3.5 flex items-center justify-center rounded-sm overflow-hidden"
                dangerouslySetInnerHTML={{ __html: flagSvg[l.value] }}
              />
              <span>{labels[l.value]}</span>
              {lang === l.value && (
                <span className="ml-auto text-xs opacity-70">{'\u2713'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
