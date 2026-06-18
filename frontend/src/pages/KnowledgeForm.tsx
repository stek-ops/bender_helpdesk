import { useState, useEffect, FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getArticle, createArticle, updateArticle } from "../api/kb"
import { useTranslation } from "../hooks/useTranslation"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Textarea from "../components/ui/Textarea"
import { Save, ArrowLeft } from "lucide-react"

const CATEGORIES = ["Network", "Server", "Software", "Hardware", "Security", "Email", "Other"]

export default function KnowledgeForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isPublished, setIsPublished] = useState(true)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      getArticle(Number(id)).then(res => {
        setTitle(res.title)
        setContent(res.content)
        setCategory(res.category || "")
        setIsPublished(res.is_published)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { title, content, category, is_published: isPublished }
      if (isEdit) {
        await updateArticle(Number(id), data)
      } else {
        await createArticle(data)
      }
      navigate("/knowledge")
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/knowledge")} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">
          {isEdit ? t("kb_edit_title") : t("kb_create_title")}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("kb_form_title")}</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("kb_form_category")}</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)]">
            <option value="">{t("kb_form_no_category")}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--b24-text)] mb-1">{t("kb_form_content")}</label>
          <Textarea value={content} onChange={e => setContent(e.target.value)} rows={12} required />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
            className="rounded border-[var(--b24-border)] text-[var(--b24-primary)]" />
          <label htmlFor="published" className="text-sm text-[var(--b24-text)]">{t("kb_form_published")}</label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate("/knowledge")}>{t("nav_cancel")}</Button>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />{saving ? t("detail_loading") : t("kb_save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
