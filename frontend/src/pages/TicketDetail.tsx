import { useState, useRef, useEffect } from "react"
import type { FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios"
import { getTicket } from "../api/tickets"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import Textarea from "../components/ui/Textarea"
import { renderContent } from "../utils"
import { uploadImage } from "../api/upload"
import { ArrowLeft, Paperclip, User, Calendar, MessageSquare, Send, Clock, Flag, ArrowRight, Check, X, Play, Image, Printer, History, Star } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

const statusColors: Record<string, string> = {
  new: "bg-[var(--b24-status-new-bg)] text-[var(--b24-status-new-text)] border-[var(--b24-status-new-border)]",
  in_progress: "bg-[var(--b24-status-progress-bg)] text-[var(--b24-status-progress-text)] border-[var(--b24-status-progress-border)]",
  resolved: "bg-[var(--b24-status-resolved-bg)] text-[var(--b24-status-resolved-text)] border-[var(--b24-status-resolved-border)]",
  closed: "bg-[var(--b24-content)] text-[var(--b24-text-sidebar)] border-[var(--b24-border-light)]",
  cancelled: "bg-[var(--b24-status-cancelled-bg)] text-[var(--b24-status-cancelled-text)] border-[var(--b24-status-cancelled-border)]",
}

export default function TicketDetail({ user }: { user: { id: number; name: string; email: string; role: string } }) {
  const { t } = useTranslation()
  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = { new: t("status_new"), in_progress: t("status_in_progress"), resolved: t("status_resolved"), closed: t("status_closed"), cancelled: t("status_cancelled") }
    return labels[s] || s
  }
  const getPriorityLabel = (s: string) => {
    const labels: Record<string, string> = { low: t("priority_low"), medium: t("priority_medium"), high: t("priority_high"), urgent: t("priority_urgent") }
    return labels[s] || s
  }
  const fieldLabels: Record<string, string> = { status: t("detail_status"), executor: t("detail_executor"), priority: t("detail_priority"), co_executor_id: t("detail_coexecutor"), observer_id: t("detail_observer"), reviewer_id: t("detail_reviewer") }
  const statusMap: Record<string, string> = { new: t("status_new"), in_progress: t("status_in_progress"), resolved: t("status_resolved"), closed: t("status_closed"), cancelled: t("status_cancelled") }
  const priorityMap: Record<string, string> = { low: t("priority_low"), medium: t("priority_medium"), high: t("priority_high"), urgent: t("priority_urgent") }
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<any>(null)
  const [text, setText] = useState("")
  const [pasteStatus, setPasteStatus] = useState("")
  const [executors, setExecutors] = useState<any[]>([])
  const [ratingComment, setRatingComment] = useState("")

  useEffect(() => {
    if (id) getTicket(Number(id)).then(res => setTicket(res))
    api.get("/tickets/executors").then(res => setExecutors(res.data || []))
  }, [id])

  const commentRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef(text)
  textRef.current = text
  useEffect(() => {
    const el = commentRef.current
    if (!el) return
    const handler = (e: ClipboardEvent) => {
      e.preventDefault()
      setPasteStatus("paste_detected")
      const items = Array.from(e.clipboardData?.items || [])
      const filesList = Array.from(e.clipboardData?.files || [])
      
      let file: File | null = filesList.find(f => f.type.indexOf("image") !== -1) || null
      if (!file) {
        const imgItem = items.find(i => i.type.indexOf("image") !== -1)
        if (imgItem) file = imgItem.getAsFile()
      }
      
      if (!file && navigator.clipboard?.read) {
        navigator.clipboard.read().then(items => {
          for (const ci of items) {
            for (const t of ci.types) {
              if (t.indexOf("image") !== -1) {
                ci.getType(t).then(blob => processFile(new File([blob], "screenshot.png", { type: t })))
                break
              }
            }
          }
        }).catch(() => setPasteStatus(""))
        return
      }
      
      if (!file) { setPasteStatus("no_file"); return }
      processFile(file)
    }
    
    const processFile = (file: File) => {
      setPasteStatus("uploading")
      uploadImage(file).then(url => {
        const pos = el.selectionStart
        const tag = "![" + file.name + "](" + url + ")"
        const cur = textRef.current
        setText(cur.slice(0, pos) + tag + cur.slice(el.selectionEnd))
        requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = pos + tag.length; el.focus() })
        setPasteStatus("done")
        setTimeout(() => setPasteStatus(""), 2000)
      }).catch(err => { console.error("Paste failed", err); setPasteStatus("error: " + (err.response?.data?.message || err.response?.data?.error || err.message || err)) })
    }
    el.addEventListener("paste", handler)
    return () => el.removeEventListener("paste", handler)
  }, [])

  const addComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await api.post("/tickets/" + id + "/comments", { content: text })
    setText("")
    if (id) getTicket(Number(id)).then(res => setTicket(res))
  }

  const updateStatus = async (status: string) => {
    await api.put("/tickets/" + id, { status })
    if (id) getTicket(Number(id)).then(res => setTicket(res))
  }

  const assignExecutor = async (executorId: number) => {
    await api.post("/tickets/" + id + "/assign", { executor_id: executorId })
    if (id) getTicket(Number(id)).then(res => setTicket(res))
  }

  const assignRole = async (field: string, userId: number) => {
    await api.put("/tickets/" + id, { [field]: userId > 0 ? userId : null })
    if (id) getTicket(Number(id)).then(res => setTicket(res))
  }

  if (!ticket) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
    </div>
  )

  const canAct = user.role === "admin" || user.role === "executor"
  const isOpen = ticket.status !== "cancelled" && ticket.status !== "closed"

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => window.print()} className="noprint text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] transition-colors cursor-pointer" title={t("detail_print")}>
          <Printer className="w-4 h-4" />
        </button>
      </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--b24-text-secondary)] font-mono">#{ticket.id}</span>
            <h1 className="text-xl font-semibold text-[var(--b24-text)]">{ticket.title}</h1>
          </div>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{ticket.category?.name} &mdash; {ticket.user?.name}</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
            <div className="px-5 py-4">
              <div className="text-sm text-[var(--b24-text-sidebar)] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(ticket.description) }} />
            </div>

            {ticket.files && ticket.files.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--b24-border)]">
                <div className="space-y-1.5">
                  {ticket.files.map((f: any) => (
                    <a key={f.id} href={"/storage/" + f.stored_path} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--b24-primary)] hover:text-[var(--b24-primary-hover)]">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.original_name}</span>
                      <span className="text-xs text-[var(--b24-text-secondary)]">({(f.size / 1024).toFixed(1)} KB)</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
            <div className="px-5 py-3 border-b border-[var(--b24-border)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--b24-text-secondary)]" />
              <span className="text-sm font-semibold text-[var(--b24-text)]">{t("detail_comments")}</span>
              {ticket.comments?.length > 0 && (
                <span className="text-xs text-[var(--b24-text-secondary)] font-normal">({ticket.comments.length})</span>
              )}
            </div>
            <div className="px-5 py-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-sm text-[var(--b24-text-secondary)] text-center py-6">{t("detail_no_comments")}</p>
              ) : (
                <div className="space-y-5 mb-4">
                  {ticket.comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--b24-primary)] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-[var(--b24-text-inverse)]">{c.user?.name?.charAt(0) || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--b24-text)]">{c.user?.name}</span>
                          <span className="text-xs text-[var(--b24-text-secondary)]">{new Date(c.created_at).toLocaleString("uk-UA")}</span>
                        </div>
                        <div className="text-sm text-[var(--b24-text-sidebar)] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(c.content) }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={addComment} className="flex gap-2 pt-3 border-t border-[var(--b24-border)]">
                <Textarea ref={commentRef} value={text} onChange={e => setText(e.target.value)} placeholder={t("detail_comment_placeholder")} required className="min-h-[40px] text-sm" />
                <Button type="submit" size="sm" className="shrink-0 self-end"><Send className="w-4 h-4" /></Button>
              </form>
              
              {pasteStatus === "paste_detected" && <p className="text-xs text-[var(--b24-primary)] mt-1">{t("detail_paste_image_detected")}</p>}
              {pasteStatus === "uploading" && <p className="text-xs text-[var(--b24-primary)] mt-1">{t("detail_paste_image_uploading")}</p>}
              {pasteStatus === "no_file" && <p className="text-xs text-[#CC3333] mt-1">{t("detail_paste_no_file")}</p>}
              {pasteStatus === "done" && <p className="text-xs text-[#3A8C2C] mt-1">{t("detail_paste_done")}</p>}
              {pasteStatus.startsWith("error") && <p className="text-xs text-[#CC3333] mt-1">{t("detail_paste_error")} {pasteStatus.replace("error: ","")}</p>}
            </div>
          </div>
        </div>

        <div className="w-[280px] shrink-0 space-y-4">
          <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
            <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
              <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_info")}</h3>
            </div>
            <div className="px-4 py-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_status")}</span>
                <span className={"text-xs font-medium px-2 py-0.5 rounded-md border " + (statusColors[ticket.status] || "bg-[var(--b24-content)] text-[var(--b24-text-sidebar)]")}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_priority")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Flag className="w-3 h-3 text-[var(--b24-warning)]" />
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_author")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <User className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {ticket.user?.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_executor")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <User className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {ticket.executor?.name || t("detail_not_assigned")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_coexecutor")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <User className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {ticket.co_executor?.name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_observer")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <User className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {ticket.observer?.name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_reviewer")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <User className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {ticket.reviewer?.name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_created")}</span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Calendar className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                  {new Date(ticket.created_at).toLocaleDateString("uk-UA")}
                </span>
              </div>

              {ticket.assigned_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_assigned")}</span>
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <ArrowRight className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                    {new Date(ticket.assigned_at).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              )}

              {ticket.resolved_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_resolved_date")}</span>
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <Check className="w-3 h-3 text-[var(--b24-success)]" />
                    {new Date(ticket.resolved_at).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              )}
              {ticket.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--b24-text-secondary)]">{t("detail_deadline")}</span>
                  <span className={"flex items-center gap-1 text-xs font-medium " + (new Date(ticket.due_date) < new Date() && ticket.status !== "closed" && ticket.status !== "cancelled" ? "text-[var(--b24-danger)]" : "")}>
                    <Calendar className="w-3 h-3 text-[var(--b24-text-secondary)]" />
                    {new Date(ticket.due_date).toLocaleDateString("uk-UA")}
                    {new Date(ticket.due_date) < new Date() && ticket.status !== "closed" && ticket.status !== "cancelled" && " " + t("detail_overdue")}
                  </span>
                </div>
              )}
            </div>
          </div>

                        {ticket.logs && ticket.logs.length > 0 && (
                <div className="border-t border-[var(--b24-border)] pt-3 mt-3">
                  <span className="text-xs text-[var(--b24-text-secondary)] font-medium flex items-center gap-1 mb-2">
                    <History className="w-3 h-3" />{t("detail_history")}
                  </span>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {ticket.logs.map((log: any) => (
                      <div key={log.id} className="text-xs text-[var(--b24-text-sidebar)] leading-relaxed">
                        <span className="text-[var(--b24-text-tertiary)]">{new Date(log.created_at).toLocaleDateString("uk-UA")}</span>
                        {" "}&mdash;{" "}
                        <span className="font-medium">{log.user?.name || t("detail_system")}</span>
                        {" "}{t("detail_changed")}{" "}
                        <span className="text-[var(--b24-text-tertiary)]">{t("detail_field_" + log.field) || log.field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          {(canAct && isOpen) && (
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_actions")}</h3>
              </div>
              <div className="px-4 py-3 space-y-2">
                {ticket.status === "new" && (
                  <Button size="sm" className="w-full justify-start" onClick={() => updateStatus("in_progress")}>
                    <Play className="w-3.5 h-3.5 mr-1.5" />{t("detail_take_to_work")}
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button size="sm" className="w-full justify-start" onClick={() => updateStatus("resolved")}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />{t("detail_resolve")}
                  </Button>
                )}
                {ticket.status === "resolved" && (
                  <Button size="sm" className="w-full justify-start" onClick={() => updateStatus("closed")}>
                    <X className="w-3.5 h-3.5 mr-1.5" />{t("detail_close")}
                  </Button>
                )}
                <Button size="sm" variant="destructive" className="w-full justify-start" onClick={() => updateStatus("cancelled")}>
                  <X className="w-3.5 h-3.5 mr-1.5" />{t("detail_cancel")}
                </Button>
              </div>
            </div>
          )}
                    {ticket.status === "closed" && ticket.user_id === user.id && !ticket.rating && (
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_csat_title")}</h3>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-[var(--b24-text-secondary)] mb-3">{t("detail_csat_prompt")}</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={async () => {
                      try {
                        await api.post("/tickets/" + id + "/rate", { score: s, comment: ratingComment })
                        if (id) getTicket(Number(id)).then(res => setTicket(res))
                      } catch(err) { console.error(err) }
                    }}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--b24-border)] hover:border-[var(--b24-warning)] hover:bg-[var(--b24-bg-light)] transition-all cursor-pointer group">
                      <span className="text-lg group-hover:scale-125 transition-transform">{s}</span>
                    </button>
                  ))}
                </div>
                <input type="text" value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                  placeholder={t("detail_csat_comment_placeholder")}
                  className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)]" />
              </div>
            </div>
          )}
          {ticket.rating && (
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_csat_title")}</h3>
              </div>
              <div className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={"text-lg " + (s <= ticket.rating.score ? "text-[var(--b24-warning)]" : "text-[var(--b24-text-tertiary)]")}>{s <= ticket.rating.score ? "★" : "☆"}</span>
                  ))}
                </div>
                {ticket.rating.score >= 4 && <p className="text-xs text-[var(--b24-success)]">{t("detail_csat_good")}</p>}
                {ticket.rating.score <= 2 && <p className="text-xs text-[var(--b24-danger)]">{t("detail_csat_bad")}</p>}
                {ticket.rating.comment && <p className="text-xs text-[var(--b24-text-sidebar)] mt-1">{ticket.rating.comment}</p>}
              </div>
            </div>
          )}

          {user.role === "admin" && (<>
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_assign")}</h3>
              </div>
              <div className="px-4 py-3">
                <select className="w-full rounded-md border border-[var(--b24-text-tertiary)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] transition-colors hover:border-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[var(--b24-primary)]/20"
                  onChange={e => assignExecutor(Number(e.target.value))} value={ticket.executor?.id || ""}>
                  <option value="">{t("detail_not_assigned_option")}</option>
                  {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_additional")}</h3>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div>
                  <label className="block text-xs text-[var(--b24-text-secondary)] mb-1">{t("detail_coexecutor_label")}</label>
                  <select className="w-full rounded-md border border-[var(--b24-text-tertiary)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] transition-colors hover:border-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[var(--b24-primary)]/20"
                    onChange={e => assignRole("co_executor_id", Number(e.target.value))} value={ticket.co_executor_id || ""}>
                    <option value="">{t("detail_not_selected_option")}</option>
                    {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--b24-text-secondary)] mb-1">{t("detail_observer_label")}</label>
                  <select className="w-full rounded-md border border-[var(--b24-text-tertiary)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] transition-colors hover:border-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[var(--b24-primary)]/20"
                    onChange={e => assignRole("observer_id", Number(e.target.value))} value={ticket.observer_id || ""}>
                    <option value="">{t("detail_not_selected_option")}</option>
                    {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--b24-text-secondary)] mb-1">{t("detail_reviewer_label")}</label>
                  <select className="w-full rounded-md border border-[var(--b24-text-tertiary)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] transition-colors hover:border-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[var(--b24-primary)]/20"
                    onChange={e => assignRole("reviewer_id", Number(e.target.value))} value={ticket.reviewer_id || ""}>
                    <option value="">{t("detail_not_selected_option")}</option>
                    {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
              <div className="px-4 py-2.5 border-b border-[var(--b24-border)] bg-[var(--b24-hover)] rounded-t-lg">
                <h3 className="text-xs font-semibold text-[var(--b24-text-secondary)] uppercase tracking-wider">{t("detail_set_deadline")}</h3>
              </div>
              <div className="px-4 py-3">
                <input type="date" className="w-full rounded-md border border-[var(--b24-text-tertiary)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] transition-colors hover:border-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[var(--b24-primary)]/20"
                  defaultValue={ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,10) : ""}
                  onChange={async (e) => { await api.put("/tickets/" + id, { due_date: e.target.value || null }); if (id) getTicket(Number(id)).then(res => setTicket(res)); }} />
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
