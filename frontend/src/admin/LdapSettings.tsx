import { useState, useEffect } from "react"
import api from "../api/axios"
import { Card } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { Server, CheckCircle2, AlertCircle, Loader, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function LdapSettings() {
  const [enabled, setEnabled] = useState(false)
  const [host, setHost] = useState("")
  const [port, setPort] = useState("389")
  const [baseDn, setBaseDn] = useState("")
  const [domain, setDomain] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [autoCreate, setAutoCreate] = useState(true)
  const [defaultRole, setDefaultRole] = useState("user")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { t } = useTranslation()
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api.get("/admin/settings/ldap").then(r => {
      setEnabled(r.data.enabled || false)
      setHost(r.data.host || "")
      setPort(String(r.data.port || 389))
      setBaseDn(r.data.base_dn || "")
      setDomain(r.data.domain || "")
      setUsername(r.data.username || "")
      setAutoCreate(r.data.auto_create !== false)
      setDefaultRole(r.data.default_role || "user")
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put("/admin/settings/ldap", {
        enabled, host, port: parseInt(port), base_dn: baseDn,
        domain, username, password, auto_create: autoCreate, default_role: defaultRole
      })
      setMessage({ type: "success", text: t("ldap_saved") })
    } catch {
      setMessage({ type: "error", text: t("ldap_error") })
    }
    setSaving(false)
  }

  const test = async () => {
    setTesting(true)
    setMessage(null)
    try {
      const r = await api.post("/admin/settings/ldap/test")
      setMessage(r.data.success
        ? { type: "success", text: r.data.message }
        : { type: "error", text: r.data.message })
    } catch {
      setMessage({ type: "error", text: t("ldap_test_error") })
    }
    setTesting(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("ldap_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">
          {t("ldap_desc")}
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-5">
          {message && (
            <div className={"flex items-center gap-2 px-4 py-3 rounded-lg text-sm " + (
              message.type === "success"
                ? "bg-[var(--b24-success-bg)] text-[var(--b24-success-text)]"
                : "bg-[var(--b24-danger-bg)] text-[var(--b24-danger-text)]"
            )}>
              {message.type === "success"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="whitespace-pre-wrap">{message.text}</span>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--b24-border)] text-[var(--b24-primary)]" />
            <span className="text-sm text-[var(--b24-text)]">{t("ldap_enable")}</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_host")}</label>
              <input value={host} onChange={e => setHost(e.target.value)}
                placeholder="ldap.domain.com"
                className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_port")}</label>
              <input value={port} onChange={e => setPort(e.target.value)}
                placeholder="389"
                className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_base_dn")}</label>
            <input value={baseDn} onChange={e => setBaseDn(e.target.value)}
              placeholder="DC=domain,DC=com"
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_domain")}</label>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="domain.local"
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_username")} (необов'язково)</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="CN=Service,DC=..."
                className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="......"
                  className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] pr-8" />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--b24-text-secondary)] cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoCreate} onChange={e => setAutoCreate(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--b24-border)] text-[var(--b24-primary)]" />
            <span className="text-sm text-[var(--b24-text)]">{t("ldap_auto_create")}</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("ldap_default_role")}</label>
            <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)}
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
              <option value="user">{t("ldap_role_user")}</option>
              <option value="executor">{t("ldap_role_executor")}</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {saving ? t("ldap_saving") : t("ldap_save")}
            </Button>
            <Button variant="secondary" onClick={test} disabled={testing}>
              {testing ? <Loader className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              {testing ? t("ldap_testing") : t("ldap_test")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}