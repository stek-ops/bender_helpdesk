import { useState } from "react"
import type { FormEvent } from "react"
import { login } from "../api/auth"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { TicketCheck } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

interface UserData { id: number; name: string; email: string; role: string; token: string }
interface LoginProps { onLogin: (user: UserData) => void }

export default function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await login(email, password)
      onLogin(data)
    } catch {
      setError(t("login_error"))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--b24-content)] flex flex-col items-center justify-center px-4">
      {/* Header bar at top */}
      <div className="fixed top-0 left-0 right-0 h-[55px] bg-[var(--b24-header)] flex items-center px-5 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--b24-primary)] flex items-center justify-center">
            <TicketCheck className="w-5 h-5 text-[var(--b24-text-inverse)]" />
          </div>
          <span className="text-[var(--b24-text-inverse)] text-lg font-semibold tracking-wide">{t("app_title")}</span>
        </div>
      </div>

      <div className="w-full max-w-[420px] bg-[var(--b24-card)] rounded-lg shadow-sm border border-[var(--b24-border)] mt-[-40px]">
        {/* Header accent */}
        <div className="h-[3px] bg-[var(--b24-primary)] rounded-t-lg" />

        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-[var(--b24-text)] mb-1">{t("login_title")}</h1>
            <p className="text-sm text-[var(--b24-text-secondary)]">{t("app_subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("login_email")}</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("login_placeholder_email")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("login_password")}</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("login_placeholder_password")}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? t("login_loading") : t("login_button")}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-[var(--b24-border)]">
            <button
              onClick={() => window.location.href = "/api/auth/microsoft"}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] text-sm text-[var(--b24-text)] hover:bg-[var(--b24-hover)] transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" rx="1" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" rx="1" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" rx="1" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" rx="1" fill="#FFB900"/>
              </svg>
              {t("login_microsoft")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
