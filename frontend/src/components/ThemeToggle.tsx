import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("theme") === "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer"
      title={dark ? "\u0421\u0432\u0456\u0442\u043B\u0430 \u0442\u0435\u043C\u0430" : "\u0422\u0435\u043C\u043D\u0430 \u0442\u0435\u043C\u0430"}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
