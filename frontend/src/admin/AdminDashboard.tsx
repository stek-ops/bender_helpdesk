import { useState, useEffect } from "react"
import api from "../api/axios"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts"
import { TicketCheck, Clock, CheckCircle2, AlertCircle, TrendingUp, Users, PieChart as PieIcon } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

const STATUS_COLORS: Record<string, string> = {
  new: "#F7A700", in_progress: "#2FC6F6", resolved: "#4BC34B", closed: "#A8ADB4", cancelled: "#E94B4B",
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [charts, setCharts] = useState<any>(null)

  useEffect(() => {
    api.get("/admin/dashboard").then(res => setData(res.data))
    api.get("/admin/dashboard/charts").then(res => setCharts(res.data)).catch(() => {})
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-[var(--b24-text-secondary)]">{t("common_loading")}</div>
    </div>
  )

  const statCards = [
    { label: t("admin_total_tickets"), value: data.total_tickets, icon: TicketCheck, color: "text-[var(--b24-primary)] bg-[#E5F4FF]" },
    { label: t("admin_new"), value: data.new_tickets, icon: AlertCircle, color: "text-[var(--b24-status-new-text)] bg-[var(--b24-status-new-bg)]" },
    { label: t("admin_in_progress"), value: data.in_progress, icon: Clock, color: "text-[var(--b24-status-progress-text)] bg-[var(--b24-status-progress-bg)]" },
    { label: t("admin_resolved"), value: data.resolved, icon: CheckCircle2, color: "text-[var(--b24-status-resolved-text)] bg-[var(--b24-status-resolved-bg)]" },
  ]

  const pieData = charts?.by_status ? Object.entries(charts.by_status).map(([k, v]) => ({ name: t("status_" + k), value: v as number })) : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("admin_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("admin_subtitle")}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
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
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--b24-primary)]" />{t("admin_chart_tickets_by_day")}</CardTitle></CardHeader>
          <CardContent>
            {charts?.daily ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={charts.daily}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="count" name={t("admin_chart_created")} stroke="var(--b24-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" name={t("admin_chart_resolved")} stroke="var(--b24-success)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-sm text-[var(--b24-text-secondary)]">{t("admin_chart_no_data")}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieIcon className="w-4 h-4 text-[var(--b24-primary)]" />{t("admin_chart_by_status")}</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => name + " " + (percent * 100).toFixed(0) + "%"}>
                    {pieData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[Object.keys(charts.by_status)[i]] || "#A8ADB4"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-sm text-[var(--b24-text-secondary)]">{t("admin_chart_no_data")}</div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-[var(--b24-primary)]" />{t("admin_chart_executor_load")}</CardTitle></CardHeader>
          <CardContent>
            {charts?.executors && charts.executors.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.executors}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--b24-text-tertiary)" />
                  <Tooltip /><Legend />
                  <Bar dataKey="open" name={t("admin_chart_open")} fill="var(--b24-primary)" radius={[4,4,0,0]} />
                  <Bar dataKey="total" name={t("admin_chart_total")} fill="var(--b24-info)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-sm text-[var(--b24-text-secondary)]">{t("admin_chart_no_data")}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
