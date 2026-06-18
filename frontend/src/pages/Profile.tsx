import { useState, useEffect, FormEvent } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { User, TicketCheck, Clock, CheckCircle2, TrendingUp, Save } from "lucide-react"

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  new: "warning", in_progress: "info", resolved: "success", closed: "default", cancelled: "danger",
}

export default function Profile() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get("/profile").then(res => {
      setProfile(res.data)
      setName(res.data.user.name)
      setEmail(res.data.user.email)
      setNotifyEmail(res.data.user.notify_email !== false)
    })
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data: any = { name, email, notify_email: notifyEmail }
      if (password) data.password = password
      await api.put("/profile", data)
      setSaved(true)
      setPassword("")
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  if (!profile) {
    return <div className="text-center py-20 text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
  }

  const statsCards = [
    { label: t("profile_my_tickets"), value: profile.ticket_count, icon: TicketCheck, color: "text-[var(--b24-primary)] bg-[var(--b24-primary)]/10" },
    { label: t("profile_assigned"), value: profile.assigned_count, icon: TrendingUp, color: "text-[var(--b24-info)] bg-[var(--b24-info)]/10" },
    { label: t("profile_resolved"), value: profile.resolved_count, icon: CheckCircle2, color: "text-[var(--b24-success)] bg-[var(--b24-success)]/10" },
    { label: t("profile_open"), value: profile.open_count, icon: Clock, color: "text-[var(--b24-warning)] bg-[var(--b24-warning)]/10" },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--b24-text)] mb-2">{t("profile_title")}</h1>
      <p className="text-sm text-[var(--b24-text-secondary)] mb-6">{profile.user.name} &middot; {profile.user.email} &middot; {t("users_role_" + (profile.user.role))}</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statsCards.map(s => (
          <Card key={s.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--b24-text-secondary)] mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-[var(--b24-text)]">{s.value}</p>
                </div>
                <div className={"w-12 h-12 rounded-lg flex items-center justify-center " + s.color}>
                  <s.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t("profile_edit_title")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("profile_name")}</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("profile_email")}</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("profile_new_password")}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t("profile_password_placeholder")} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--b24-text)]">{t("profile_notify_email")}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-[var(--b24-border-light)] rounded-full peer peer-checked:bg-[var(--b24-primary)] peer-checked:after:translate-x-[18px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all"></div>
                </label>
              </div>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-1.5" />{saving ? t("detail_loading") : t("profile_save")}
              </Button>
              {saved && <span className="text-sm text-[var(--b24-success)] ml-3">{t("profile_saved")}</span>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("profile_recent_tickets")}</CardTitle></CardHeader>
          <CardContent>
            {(!profile.user.tickets || profile.user.tickets.length === 0) ? (
              <p className="text-sm text-[var(--b24-text-secondary)] text-center py-6">{t("dashboard_no_tickets")}</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {profile.user.tickets.slice(0, 10).map((t: any) => (
                  <Link key={t.id} to={"/tickets/" + t.id}
                    className="block px-3 py-2 border border-[var(--b24-border)] rounded-lg hover:border-[var(--b24-primary)]/30 hover:bg-[var(--b24-bg-light)] transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[var(--b24-text-secondary)] shrink-0">#{t.id}</span>
                        <span className="text-sm text-[var(--b24-text)] truncate">{t.title}</span>
                      </div>
                      <Badge variant={statusVariant[t.status] || "default"}>{t("status_" + t.status)}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
