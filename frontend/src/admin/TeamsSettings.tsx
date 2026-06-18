import { useState, useEffect } from "react"
import api from "../api/axios"
import { Card } from "../components/ui/Card"
import Button from "../components/ui/Button"
import { MessageSquare, CheckCircle2, AlertCircle, Loader } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function TeamsSettings() {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState(null)
  const { t } = useTranslation()

  useEffect(() => {
    api.get("/admin/settings/teams").then(r => {
      setWebhookUrl(r.data.webhook_url || "")
      setEnabled(r.data.enabled || false)
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put("/admin/settings/teams", { webhook_url: webhookUrl, enabled })
      setMessage({ type: "success", text: t("teams_saved") })
    } catch {
      setMessage({ type: "error", text: t("teams_error") })
    }
    setSaving(false)
  }

  const test = async () => {
    setTesting(true)
    setMessage(null)
    try {
      const r = await api.post("/admin/settings/teams/test")
      setMessage(r.data.success
        ? { type: "success", text: t("teams_test_success") }
        : { type: "error", text: t("teams_test_error") })
    } catch {
      setMessage({ type: "error", text: t("teams_test_error") })
    }
    setTesting(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("teams_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">
          {t("teams_desc")}
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
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--b24-text)] mb-1.5">{t("teams_webhook")}</label>
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder={t("teams_webhook_placeholder")}
              className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]"
            />
            <p className="text-xs text-[var(--b24-text-tertiary)] mt-1">
              {t("teams_webhook_placeholder")}
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--b24-border)] text-[var(--b24-primary)] focus:ring-[var(--b24-primary)]"
            />
            <span className="text-sm text-[var(--b24-text)]">{t("teams_enable")}</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {saving ? t("teams_saving") : t("teams_save")}
            </Button>
            <Button variant="secondary" onClick={test} disabled={testing}>
              {testing ? <Loader className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {testing ? t("teams_testing") : t("teams_test")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--b24-text)] mb-3">{t("teams_howto_title")}</h2>
        <Card>
          <div className="p-5 space-y-3 text-sm text-[var(--b24-text-secondary)]">
            <p>{t("teams_howto_1")}</p>
            <p>{t("teams_howto_2")}</p>
            <p>{t("teams_howto_3")}</p>
            <p>{t("teams_howto_4")}</p>
            <p>{t("teams_howto_5")}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}