import { useState, useRef, useEffect, useCallback } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { createTicket, getCategories, matchKeywords } from "../api/tickets"
import api from "../api/axios"
import { Card, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Textarea from "../components/ui/Textarea"
import Select from "../components/ui/Select"
import { ArrowLeft, FileUp, Zap, AlertTriangle, Bot } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { uploadImage } from "../api/upload"

export default function CreateTicket() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [executors, setExecutors] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [executorId, setExecutorId] = useState("")
  const [coExecutorId, setCoExecutorId] = useState("")
  const [observerId, setObserverId] = useState("")
  const [reviewerId, setReviewerId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pasteStatus, setPasteStatus] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [autoMatch, setAutoMatch] = useState<{groupName?: string; executorName?: string} | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)

  useEffect(() => {
    getCategories().then(res => setCategories(res || []))
    api.get("/tickets/executors").then(res => setExecutors(res.data || []))
  }, [])

  const lastTitleRef = useRef("")
  useEffect(() => {
    if (!title.trim() || title.trim().length < 3) {
      setAutoMatch(null)
      return
    }
    const trimmed = title.trim()
    if (trimmed === lastTitleRef.current) return
    lastTitleRef.current = trimmed

    const timer = setTimeout(async () => {
      setMatchLoading(true)
      try {
        const data = await matchKeywords(trimmed)
        if (data && data.executor_id) {
          setAutoMatch({
            groupName: data.category_group_name,
            executorName: data.executor_name,
          })
          if (data.category_group_id && !groupId) {
            setGroupId(String(data.category_group_id))
          }
          if (data.category_id && !categoryId) {
            setCategoryId(String(data.category_id))
          }
          if (data.executor_id && !executorId) {
            setExecutorId(String(data.executor_id))
          }
        } else {
          setAutoMatch(null)
        }
      } catch {
        setAutoMatch(null)
      }
      setMatchLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [title])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const dt = e.dataTransfer.files
    if (dt.length > 0) {
      const inp = document.getElementById("file-input") as HTMLInputElement
      if (inp) {
        const dt2 = new DataTransfer()
        for (let i = 0; i < dt.length; i++) dt2.items.add(dt[i])
        if (files) { for (let i = 0; i < files.length; i++) dt2.items.add(files[i]) }
        inp.files = dt2.files
        setFiles(dt2.files)
      }
    }
  }

  const descRef = useRef<HTMLTextAreaElement>(null)
  const descValRef = useRef(description)
  descValRef.current = description
  useEffect(() => {
    const el = descRef.current
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
        const cur = descValRef.current
        setDescription(cur.slice(0, pos) + tag + cur.slice(el.selectionEnd))
        requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = pos + tag.length; el.focus() })
        setPasteStatus("done")
        setTimeout(() => setPasteStatus(""), 2000)
      }).catch(err => { console.error("Paste failed", err); setPasteStatus("error: " + (err.response?.data?.message || err.response?.data?.error || err.message || err)) })
    }
    el.addEventListener("paste", handler)
    return () => el.removeEventListener("paste", handler)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData()
    form.append("title", title)
    form.append("description", description)
    form.append("category_id", categoryId)
    if (executorId) form.append("executor_id", executorId)
    if (coExecutorId) form.append("co_executor_id", coExecutorId)
    if (observerId) form.append("observer_id", observerId)
    if (reviewerId) form.append("reviewer_id", reviewerId)
    if (dueDate) form.append("due_date", dueDate)
    if (files) { for (let i = 0; i < files.length; i++) form.append("files[]", files[i]) }
    try {
      const data = await createTicket(form)
      navigate("/tickets/" + (data?.id || data?.data?.id))
    } catch (e: any) {
      setError(e.response?.data?.message || t("common_error"))
      setLoading(false)
    }
  }

  const groups = categories.reduce((acc: Record<string, any>, cat: any) => {
    if (cat.group && !acc[cat.group.id]) acc[cat.group.id] = cat.group
    return acc
  }, {} as Record<string, any>)
  const groupList = Object.values(groups)
  const filteredCategories = groupId
    ? categories.filter(c => c.group_id === Number(groupId))
    : categories

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("ticket_new_title")}</h1>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("ticket_new_subtitle")}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[var(--b24-primary)]/10 to-[var(--b24-info-bg)] border border-[var(--b24-primary)]/20 rounded-lg px-5 py-3 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-[#B8860B]">
          <img src="/bender.png" alt="Bender" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--b24-text)]">{t("ticket_ask_bot")}</p>
          <p className="text-xs text-[var(--b24-text-secondary)]">{t("ticket_bot_suggestion")}</p>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent("bender:toggle"))}
          className="text-xs bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] px-4 py-2 rounded-lg hover:bg-[#1B5EC4] transition-colors cursor-pointer shrink-0"
        >
          {t("ticket_ask_bot_button")}
        </button>
      </div>
      <Card>
        <div className="h-[3px] bg-[var(--b24-primary)] rounded-t-lg" />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_subject")}</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("ticket_subject_placeholder")} required />
              {matchLoading && <p className="text-xs text-[var(--b24-text-secondary)] mt-1">{t("ticket_match_loading")}</p>}
              {autoMatch && !matchLoading && (
                <p className="text-xs text-[var(--b24-primary)] mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t("ticket_executor_auto_prefix")} <strong>{autoMatch.executorName}</strong>
                  {autoMatch.groupName && <> &middot; {autoMatch.groupName}</>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_group")}</label>
              <Select value={groupId} onChange={e => { setGroupId(e.target.value); setCategoryId("") }}>
                <option value="">{t("ticket_group_select")}</option>
                {groupList.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_category")}</label>
              <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">{groupId ? t("ticket_category_select") : t("ticket_category_first_select_group")}</option>
                {filteredCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_executor")}</label>
              <Select value={executorId} onChange={e => setExecutorId(e.target.value)}>
                <option value="">{t("ticket_executor_auto")}</option>
                {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_coexecutor")}</label>
              <Select value={coExecutorId} onChange={e => setCoExecutorId(e.target.value)}>
                <option value="">{t("ticket_not_selected")}</option>
                {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_observer")}</label>
              <Select value={observerId} onChange={e => setObserverId(e.target.value)}>
                <option value="">{t("ticket_not_selected")}</option>
                {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_reviewer")}</label>
              <Select value={reviewerId} onChange={e => setReviewerId(e.target.value)}>
                <option value="">{t("ticket_not_selected")}</option>
                {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_due_date")}</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] focus:outline-none focus:border-[var(--b24-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_priority")}</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]"
                >
                <option value="low">{t("ticket_priority_low")}</option>
                <option value="medium">{t("ticket_priority_medium")}</option>
                <option value="high">{t("ticket_priority_high")}</option>
                <option value="urgent">{t("ticket_priority_urgent")}</option>
              </select>
            </div>

            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_description")}</label>
              <div className="relative">
                <Textarea ref={descRef} value={description} onChange={e => setDescription(e.target.value)} rows={6} placeholder={t("ticket_subject_placeholder")} required />
              </div>
              {pasteStatus === "paste_detected" && <p className="text-xs text-[var(--b24-primary)] mt-1">{t("ticket_paste_image_detected")}</p>}
              {pasteStatus === "uploading" && <p className="text-xs text-[var(--b24-primary)] mt-1">{t("ticket_paste_image_uploading")}</p>}
              {pasteStatus === "no_file" && <p className="text-xs text-[var(--b24-danger-text)] mt-1">{t("ticket_paste_no_file")}</p>}
              {pasteStatus === "done" && <p className="text-xs text-[var(--b24-success-text)] mt-1">{t("ticket_paste_done")}</p>}
              {pasteStatus.startsWith("error") && <p className="text-xs text-[var(--b24-danger-text)] mt-1">{t("ticket_paste_error")} {pasteStatus.replace("error: ","")}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--b24-text-sidebar)] mb-1.5">{t("ticket_files")}</label>
              <div className={"border-2 border-dashed rounded-md p-4 transition-colors " + (dragOver ? "border-[var(--b24-primary)] bg-[var(--b24-info-bg)]" : "border-[var(--b24-text-tertiary)] hover:border-[var(--b24-primary)]/50")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <FileUp className="w-6 h-6 text-[var(--b24-text-secondary)]" />
                  <span className="text-sm text-[var(--b24-text-secondary)]">
                    {files ? files.length + " " + t("ticket_files") : t("ticket_files_drop")}
                  </span>
                  <Input id="file-input" type="file" multiple onChange={e => setFiles(e.target.files)} className="hidden" />
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="min-w-[160px]">
                {loading ? t("ticket_creating") : t("ticket_create_button")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
                {t("ticket_cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
