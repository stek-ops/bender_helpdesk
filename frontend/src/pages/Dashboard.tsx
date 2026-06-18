import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import { useTranslation } from "../hooks/useTranslation"
import Button from "../components/ui/Button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { Plus, TicketCheck, Clock, CheckCircle2, TrendingUp } from "lucide-react"

interface DashboardProps { user: { id: number; name: string; email: string; role: string } }

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  new: "warning", in_progress: "info", resolved: "success", closed: "default", cancelled: "danger",
}

export default function Dashboard({ user: _user }: DashboardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ new: 0, in_progress: 0, resolved: 0 })
  const [tickets, setTickets] = useState<any[]>([])
  const [charts, setCharts] = useState<{daily: any[]; executors: any[]} | null>(null)

  useEffect(() => {
    api.get("/tickets", { params: { limit: "5" } }).then(res => setTickets(res.data?.data || []))
    api.get("/tickets", { params: { status: "new" } }).then(res => setStats(s => ({ ...s, new: res.data?.total || 0 })))
    api.get("/tickets", { params: { status: "in_progress" } }).then(res => setStats(s => ({ ...s, in_progress: res.data?.total || 0 })))
    api.get("/tickets", { params: { status: "resolved" } }).then(res => setStats(s => ({ ...s, resolved: res.data?.total || 0 })))
    api.get("/admin/dashboard/charts").then(res => setCharts(res.data)).catch(() => {})
  }, [])

  const statCards = [
    { label: t("dashboard_new"), value: stats.new, icon: TicketCheck, color: "text-[var(--b24-status-new-text)] bg-[var(--b24-status-new-bg)]" },
    { label: t("dashboard_in_progress"), value: stats.in_progress, icon: Clock, color: "text-[var(--b24-status-progress-text)] bg-[var(--b24-status-progress-bg)]" },
    { label: t("dashboard_resolved"), value: stats.resolved, icon: CheckCircle2, color: "text-[var(--b24-status-resolved-text)] bg-[var(--b24-status-resolved-bg)]" },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("dashboard_title")}</h1>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("dashboard_subtitle")}</p>
        </div>
        <Link to="/tickets/create"><Button><Plus className="w-4 h-4 mr-1.5" />{t("dashboard_create_ticket")}</Button></Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map(s => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--b24-primary)]" />
              {t("dashboard_chart_tickets_by_day")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts?.daily ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={charts.daily}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name={t("dashboard_chart_created")} stroke="var(--b24-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" name={t("dashboard_chart_resolved")} stroke="var(--b24-success)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-[var(--b24-text-secondary)]">{t("dashboard_chart_no_data")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--b24-primary)]" />
              {t("dashboard_chart_executor_load")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts?.executors && charts.executors.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.executors}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="open" name={t("dashboard_chart_open")} fill="var(--b24-primary)" radius={[4,4,0,0]} />
                  <Bar dataKey="total" name={t("dashboard_chart_total")} fill="var(--b24-info)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-[var(--b24-text-secondary)]">{t("dashboard_chart_no_data")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("dashboard_recent_tickets")}</CardTitle></CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <TicketCheck className="w-12 h-12 text-[var(--b24-text-tertiary)] mx-auto mb-3" />
              <p className="text-[var(--b24-text-secondary)]">{t("dashboard_no_tickets")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket: any) => (
                <Link key={ticket.id} to={"/tickets/" + ticket.id}
                  className="block px-4 py-3 border border-[var(--b24-border)] rounded-lg hover:border-[var(--b24-primary)]/30 hover:bg-[var(--b24-bg-light)] transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-[var(--b24-text-secondary)] shrink-0">#{ticket.id}</span>
                      <span className="text-sm font-medium text-[var(--b24-text)] truncate">{ticket.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[var(--b24-text-secondary)]">{ticket.category?.name}</span>
                      <Badge variant={statusVariant[ticket.status] || "default"}>{t("status_" + ticket.status)}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
