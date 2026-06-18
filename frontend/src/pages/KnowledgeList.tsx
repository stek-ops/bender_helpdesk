import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getArticles } from "../api/kb"
import { useTranslation } from "../hooks/useTranslation"
import Button from "../components/ui/Button"
import { BookOpen, Search, Plus, ArrowLeft, User, Clock } from "lucide-react"

export default function KnowledgeList({ admin }: { admin?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (category) params.category = category
    getArticles(params).then(res => {
      setArticles(res?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [search, category])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("kb_title")}</h1>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("kb_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <Button onClick={() => navigate("/knowledge/create")}>
              <Plus className="w-4 h-4 mr-1.5" />{t("kb_create")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />{t("nav_back")}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--b24-text-secondary)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t("kb_search")}
          className="w-full rounded-md border border-[var(--b24-border)] bg-[var(--b24-card)] pl-9 pr-3 py-2 text-sm text-[var(--b24-text)] placeholder-[var(--b24-text-tertiary)] focus:outline-none focus:border-[var(--b24-primary)]" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--b24-text-secondary)]">{t("detail_loading")}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-[var(--b24-border-light)] mx-auto mb-4" />
          <p className="text-[var(--b24-text-secondary)] text-sm">{t("kb_no_articles")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a: any) => (
            <Link key={a.id} to={"/knowledge/" + a.id}
              className="block bg-[var(--b24-card)] rounded-lg border border-[var(--b24-border)] shadow-sm hover:border-[var(--b24-primary)]/30 hover:shadow-md transition-all p-5">
              <div className="flex items-center gap-2 mb-2">
                {a.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--b24-primary)]/10 text-[var(--b24-primary)]">
                    {a.category}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[var(--b24-text)] mb-2 line-clamp-2">{a.title}</h3>
              <p className="text-xs text-[var(--b24-text-secondary)] line-clamp-3">{a.content.replace(/<[^>]*>/g, "")}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[var(--b24-text-tertiary)]">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />{a.user?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{new Date(a.created_at).toLocaleDateString("uk-UA")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
