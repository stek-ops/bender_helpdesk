import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getTickets } from "../api/tickets"
import Badge from "../components/ui/Badge"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import api from "../api/axios"
import { useTranslation } from "../hooks/useTranslation"
import { Plus, ListFilter, Clock, User, Calendar, Search, Download } from "lucide-react"

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  new: "warning", in_progress: "info", resolved: "success", closed: "default", cancelled: "danger",
}
const statusColors: Record<string, string> = {
  new: "bg-[var(--b24-warning)]", in_progress: "bg-[var(--b24-info)]", resolved: "bg-[var(--b24-success)]", closed: "bg-[var(--b24-border)]", cancelled: "bg-[var(--b24-danger)]",
}

function exportCSV() {
    const params = new URLSearchParams()
    if (filter) params.set("status", filter)
    if (search) params.set("search", search)
    if (executorFilter) params.set("executor_id", executorFilter)
    window.open("/api/tickets/export?" + params.toString(), "_blank")
  }

export default function Tickets() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<any[]>([])
  const [filter, setFilter] = useState("")
  const [search, setSearch] = useState("")
  const [executorFilter, setExecutorFilter] = useState("")
  const [overdue, setOverdue] = useState(false)
  const [executors, setExecutors] = useState<any[]>([])

  useEffect(() => {
    api.get("/tickets/executors").then(r => setExecutors(r.data || []))
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filter) params.status = filter
    if (search) params.search = search
    if (executorFilter) params.executor_id = executorFilter
    if (overdue) params.overdue = "true"
    getTickets(params).then(res => setTickets(res?.data || []))
  }, [filter, search, executorFilter, overdue])

  const filters = [
    { value: "", label: t("tickets_all") },
    { value: "new", label: t("tickets_status_new") },
    { value: "in_progress", label: t("tickets_status_in_progress") },
    { value: "resolved", label: t("tickets_status_resolved") },
    { value: "closed", label: t("tickets_status_closed") },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("tickets_my_tickets")}</h1>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{tickets.length} {t("tickets_count")}</p>
        </div>
        <Link to="/tickets/create"><Button><Plus className="w-4 h-4 mr-1.5" />{t("tickets_add")}</Button></Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--b24-text-secondary)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("tickets_search")} className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] pl-9 pr-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
        </div>
        <select value={executorFilter} onChange={e => setExecutorFilter(e.target.value)} className="rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
          <option value="">{t("tickets_all_executors")}</option>
          {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={exportCSV}>
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[var(--b24-border)]">
        <ListFilter className="w-4 h-4 text-[var(--b24-text-secondary)]" />
        <button onClick={() => setOverdue(!overdue)}
            className={"px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-1 " +
              (overdue
                ? "bg-[var(--b24-danger)] text-[var(--b24-text-inverse)] font-medium"
                : "text-[var(--b24-text-sidebar)] hover:bg-[var(--b24-content)]")}>
            <Clock className="w-3.5 h-3.5" />{t("tickets_overdue_label")}
          </button>
          {filters.map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={"px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer " +
              (filter === s.value
                ? "bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] font-medium"
                : "text-[var(--b24-text-sidebar)] hover:bg-[var(--b24-content)]")}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-0 py-0 bg-[var(--b24-bg-light)] border-b border-[var(--b24-border)]">
          <div className="w-[4px] self-stretch shrink-0" />
          <div className="flex-1 flex items-center gap-4 px-4 py-2.5 text-xs font-medium text-[var(--b24-text-secondary)] uppercase tracking-wider">
            <span className="w-[60px] shrink-0">ID</span>
            <span className="flex-1 min-w-0">{t("tickets_header_name")}</span>
            <span className="w-[100px] shrink-0 text-center">{t("tickets_header_status")}</span>
            <span className="w-[80px] shrink-0 text-center">{t("tickets_header_priority")}</span>
            <span className="w-[130px] shrink-0">{t("tickets_header_executor")}</span>
            <span className="w-[85px] shrink-0 text-center">{t("tickets_header_deadline")}</span>
            <span className="w-[90px] shrink-0 text-right">{t("tickets_header_date")}</span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <ListFilter className="w-16 h-16 text-[var(--b24-border-light)] mx-auto mb-4" />
            <p className="text-[var(--b24-text-secondary)] text-sm">{t("tickets_no_tickets")}</p>
          </div>
        ) : (
          tickets.map((ticket: any) => (
            <Link key={ticket.id} to={"/tickets/" + ticket.id}
              className="flex items-center px-0 py-0 border-b border-[var(--b24-border)] last:border-0 hover:bg-[var(--b24-hover)] transition-colors group">
              {/* Status color bar */}
              <div className={"w-[4px] self-stretch shrink-0 " + (statusColors[ticket.status] || "bg-[var(--b24-border)]")} />

              <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
                <span className="w-[60px] shrink-0 text-xs text-[var(--b24-text-secondary)] font-mono">#{ticket.id}</span>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--b24-text)] group-hover:text-[var(--b24-primary)] transition-colors truncate block">
                    {ticket.title}
                  </span>
                </div>

                <span className="w-[100px] shrink-0 text-center">
                  <Badge variant={statusVariant[ticket.status] || "default"}>
                    {t("status_" + ticket.status)}
                  </Badge>
                </span>

                <span className="w-[80px] shrink-0 text-center text-xs text-[var(--b24-text-secondary)]">
                  {ticket.priority === "high" ? t("priority_high") : ticket.priority === "urgent" ? t("priority_urgent") : ticket.priority === "low" ? t("priority_low") : t("priority_medium")}
                </span>

                <span className="w-[130px] shrink-0 flex items-center gap-1.5 text-sm text-[var(--b24-text-sidebar)]">
                  <User className="w-3.5 h-3.5 text-[var(--b24-text-secondary)] shrink-0" />
                  <span className="truncate">{ticket.executor?.name || "—"}</span>
                </span>

                <span className="w-[85px] shrink-0 text-center">
                  {ticket.due_date ? (
                    <span className={"text-xs px-1.5 py-0.5 rounded " + (new Date(ticket.due_date) < new Date() && ticket.status !== "closed" && ticket.status !== "cancelled"
                      ? "bg-[var(--b24-status-cancelled-bg)] text-[var(--b24-status-cancelled-text)]"
                      : "text-[var(--b24-text-secondary)]")}>
                      {new Date(ticket.due_date).toLocaleDateString("uk-UA")}
                    </span>
                  ) : <span className="text-xs text-[var(--b24-text-tertiary)]">—</span>}
                </span>
                <span className="w-[90px] shrink-0 text-right flex items-center gap-1.5 justify-end text-xs text-[var(--b24-text-secondary)]">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{new Date(ticket.created_at).toLocaleDateString("uk-UA")}</span>
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
