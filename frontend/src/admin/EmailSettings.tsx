import { useState, useEffect, FormEvent } from "react"
import api from "../api/axios"
import { useTranslation } from "../hooks/useTranslation"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Mail, Save, Send, RefreshCw } from "lucide-react"

export default function EmailSettings() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    mailer: "smtp", host: "", port: 587, encryption: "tls",
    username: "", password: "", from_address: "", from_name: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)

  useEffect(() => {
    api.get("/admin/settings/email").then(res => {
      setSettings(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put("/admin/settings/email", settings)
      alert(res.data.message || t("email_success_saved"))
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await api.post("/admin/settings/email/test")
      setTestResult(res.data)
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data?.error || err.message })
    }
    setTesting(false)
  }

  const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }))

  if (loading) {
    return <div className="text-center py-12 text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-[var(--b24-text)] mb-2">{t("email_title")}</h1>
      <p className="text-sm text-[var(--b24-text-secondary)] mb-6">{t("email_subtitle")}</p>

      <form onSubmit={handleSave} className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_mailer")}</label>
          <select value={settings.mailer} onChange={e => update("mailer", e.target.value)}
            className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
            <option value="smtp">SMTP</option>
            <option value="sendmail">Sendmail</option>
            <option value="log">Log</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_host")}</label>
            <Input value={settings.host} onChange={e => update("host", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_port")}</label>
            <Input type="number" value={settings.port} onChange={e => update("port", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_encryption")}</label>
            <select value={settings.encryption} onChange={e => update("encryption", e.target.value)}
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="null">None</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_username")}</label>
            <Input value={settings.username} onChange={e => update("username", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_password")}</label>
            <Input type="password" value={settings.password} onChange={e => update("password", e.target.value)} placeholder="********" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_from_address")}</label>
            <Input value={settings.from_address} onChange={e => update("from_address", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("email_from_name")}</label>
            <Input value={settings.from_name} onChange={e => update("from_name", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="secondary" onClick={handleTest} disabled={testing}>
            {testing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            {t("email_test")}
          </Button>
          <div className="flex items-center gap-3">
            {testResult && (
              <span className={"text-sm " + (testResult.success ? "text-[var(--b24-success)]" : "text-[var(--b24-danger)]")}>
                {testResult.success ? t("email_test_success") : (testResult.error || t("email_test_fail"))}
              </span>
            )}
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />{saving ? t("detail_loading") : t("email_save")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
