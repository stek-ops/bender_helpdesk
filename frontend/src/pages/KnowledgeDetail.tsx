import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getArticle, deleteArticle } from "../api/kb"
import { useTranslation } from "../hooks/useTranslation"
import Button from "../components/ui/Button"
import { ArrowLeft, Edit3, Trash2, User, Clock, BookOpen } from "lucide-react"

export default function KnowledgeDetail({ admin }: { admin?: boolean }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getArticle(Number(id)).then(res => {
        setArticle(res)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id])

  const handleDelete = async () => {
    if (!confirm(t("kb_delete_confirm"))) return
    await deleteArticle(Number(id))
    navigate("/knowledge")
  }

  if (loading) {
    return <div className="text-center py-20 text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
  }

  if (!article) {
    return <div className="text-center py-20 text-[var(--b24-text-secondary)]">{t("kb_not_found")}</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/knowledge")} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BookOpen className="w-5 h-5 text-[var(--b24-primary)]" />
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{article.title}</h1>
        </div>
        {admin && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate("/knowledge/" + id + "/edit")}>
              <Edit3 className="w-4 h-4 mr-1" />{t("kb_edit")}
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />{t("kb_delete")}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--b24-border)] flex items-center gap-4 text-xs text-[var(--b24-text-secondary)]">
          {article.category && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--b24-primary)]/10 text-[var(--b24-primary)]">
              {article.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />{article.user?.name}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{new Date(article.created_at).toLocaleDateString("uk-UA")}
          </span>
        </div>
        <div className="px-6 py-5 text-sm text-[var(--b24-text-sidebar)] leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </div>
    </div>
  )
}
