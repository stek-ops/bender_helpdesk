import { useState, useEffect } from "react"
import api from "../api/axios"
import { Card } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { CheckCircle2, AlertCircle, Loader, Eye, EyeOff } from "lucide-react"

export default function MicrosoftSettings() {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [tenantId, setTenantId] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [autoCreate, setAutoCreate] = useState(true)
  const [defaultRole, setDefaultRole] = useState("user")
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api.get("/admin/settings/microsoft").then(r => {
      setEnabled(r.data.enabled || false)
      setTenantId(r.data.tenant_id || "")
      setClientId(r.data.client_id || "")
      setAutoCreate(r.data.auto_create !== false)
      setDefaultRole(r.data.default_role || "user")
    }).catch(() => {
      console.error("Failed to load MS settings")
    })
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put("/admin/settings/microsoft", {
        enabled, tenant_id: tenantId, client_id: clientId,
        client_secret: clientSecret, auto_create: autoCreate,
        default_role: defaultRole
      })
      setMessage({ type: "success", text: t("microsoft_saved") })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || t("microsoft_error")
      setMessage({ type: "error", text: msg })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("microsoft_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("microsoft_desc")}</p>
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
            <span className="text-sm text-[var(--b24-text)]">{t("microsoft_enable")}</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("microsoft_tenant_id")}</label>
            <input value={tenantId} onChange={e => setTenantId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("microsoft_client_id")}</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("microsoft_client_secret")}</label>
            <div className="relative">
              <input type={showSecret ? "text" : "password"} value={clientSecret}
                onChange={e => setClientSecret(e.target.value)} placeholder="......"
                className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] pr-8" />
              <button onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--b24-text-secondary)] cursor-pointer">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoCreate} onChange={e => setAutoCreate(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--b24-border)] text-[var(--b24-primary)]" />
            <span className="text-sm text-[var(--b24-text)]">{t("microsoft_auto_create")}</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("microsoft_default_role")}</label>
            <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)}
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
              <option value="user">{t("common_user")}</option>
              <option value="executor">{t("common_executor")}</option>
              <option value="admin">{t("common_admin")}</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {saving ? t("microsoft_saving") : t("microsoft_save")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
