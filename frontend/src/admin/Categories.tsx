import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import api from "../api/axios"
import {
  getCategoryGroups, createCategoryGroup, updateCategoryGroup, deleteCategoryGroup,
  getCategoriesAdmin, createCategory, updateCategory, deleteCategory
} from "../api/admin"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Select from "../components/ui/Select"
import { Tags, FolderPlus, Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function Categories() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [newCatGroup, setNewCatGroup] = useState("")
  const [newCatExecutor, setNewCatExecutor] = useState("")
  const [executors, setExecutors] = useState<any[]>([])
  const [editGroup, setEditGroup] = useState<number | null>(null)
  const [editGroupName, setEditGroupName] = useState("")
  const [editCat, setEditCat] = useState<number | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const [editCatGroup, setEditCatGroup] = useState("")
  const [editCatExecutor, setEditCatExecutor] = useState("")

  const load = () => {
    getCategoryGroups().then(res => setGroups(res || []))
    getCategoriesAdmin().then(res => setCats(res || []))
    api.get("/tickets/executors").then(res => setExecutors(res.data || []))
  }
  useEffect(() => { load() }, [])

  const addGroup = async (e: FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    await createCategoryGroup({ name: newGroupName })
    setNewGroupName(""); load()
  }

  const addCat = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim() || !newCatGroup) return
    await createCategory({ name: newCatName, group_id: Number(newCatGroup), default_executor_id: newCatExecutor ? Number(newCatExecutor) : null })
    setNewCatName(""); load()
  }

  const startEditGroup = (g: any) => { setEditGroup(g.id); setEditGroupName(g.name) }
  const cancelEditGroup = () => { setEditGroup(null); setEditGroupName("") }
  const saveEditGroup = async () => {
    if (!editGroupName.trim() || editGroup === null) return
    await updateCategoryGroup(editGroup, { name: editGroupName })
    cancelEditGroup(); load()
  }

  const startEditCat = (c: any) => {
    setEditCat(c.id); setEditCatName(c.name); setEditCatGroup(String(c.group_id || "")); setEditCatExecutor(String(c.default_executor_id || ""))
  }
  const cancelEditCat = () => { setEditCat(null); setEditCatName(""); setEditCatGroup(""); setEditCatExecutor("") }
  const saveEditCat = async () => {
    if (!editCatName.trim() || !editCatGroup || editCat === null) return
    await updateCategory(editCat, { name: editCatName, group_id: Number(editCatGroup), default_executor_id: editCatExecutor ? Number(editCatExecutor) : null })
    cancelEditCat(); load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("categories_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("categories_subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FolderPlus className="w-4 h-4" />{t("categories_new_group")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addGroup} className="flex gap-2">
              <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t("categories_group_name_placeholder")} required />
              <Button type="submit"><Plus className="w-4 h-4 mr-1" />{t("categories_add_group")}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Tags className="w-4 h-4" />{t("categories_new_category")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addCat} className="space-y-2">
              <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder={t("categories_category_name_placeholder")} required />
              <Select value={newCatGroup} onChange={e => setNewCatGroup(e.target.value)} required>
                <option value="">{t("categories_group_select")}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              <Select value={newCatExecutor} onChange={e => setNewCatExecutor(e.target.value)}>
                <option value="">{t("categories_executor_default")}</option>
                {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
              <Button type="submit"><Plus className="w-4 h-4 mr-1" />{t("categories_add_group")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-5">
        <CardHeader><CardTitle>{t("categories_groups")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {groups.length === 0 ? (
            <p className="text-sm text-[var(--b24-text-secondary)] text-center py-4">{t("categories_no_groups")}</p>
          ) : (
            <div>
              <div className="flex items-center gap-4 px-5 py-2 bg-[var(--b24-bg-light)] border-b border-[var(--b24-border)] text-xs font-medium text-[var(--b24-text-secondary)] uppercase tracking-wider">
                <span className="flex-1">{t("categories_header_name")}</span>
                <span className="w-[120px] text-right">{t("categories_header_actions")}</span>
              </div>
              {groups.map(g => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-3 border-b border-[var(--b24-border)] last:border-0">
                  {editGroup === g.id ? (
                    <><div className="flex-1 flex gap-2"><Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} className="h-8 text-sm" autoFocus /></div>
                    <span className="w-[120px] flex justify-end gap-1">
                      <Button size="sm" onClick={saveEditGroup}><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditGroup}><X className="w-3 h-3" /></Button>
                    </span></>
                  ) : (
                    <><span className="flex-1 text-sm text-[var(--b24-text)]">{g.name}</span>
                    <span className="w-[120px] flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEditGroup(g)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={async () => { await deleteCategoryGroup(g.id); load() }}>
                        <Trash2 className="w-3 h-3" /></Button>
                    </span></>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("categories_categories")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {cats.length === 0 ? (
            <p className="text-sm text-[var(--b24-text-secondary)] text-center py-4">{t("categories_no_categories")}</p>
          ) : (
            <div>
              <div className="flex items-center gap-4 px-5 py-2 bg-[var(--b24-bg-light)] border-b border-[var(--b24-border)] text-xs font-medium text-[var(--b24-text-secondary)] uppercase tracking-wider">
                <span className="flex-1">{t("categories_header_name")}</span>
                <span className="w-[110px]">{t("categories_header_group")}</span>
                <span className="w-[120px]">{t("categories_header_executor")}</span>
                <span className="w-[120px] text-right">{t("categories_header_actions")}</span>
              </div>
              {cats.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3 border-b border-[var(--b24-border)] last:border-0">
                  {editCat === c.id ? (
                    <><div className="flex-1 flex gap-2">
                      <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="h-8 text-sm" autoFocus />
                      <Select value={editCatGroup} onChange={e => setEditCatGroup(e.target.value)} className="h-8 text-sm w-[130px]">
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </Select>
                      <Select value={editCatExecutor} onChange={e => setEditCatExecutor(e.target.value)} className="h-8 text-sm w-[130px]">
                        <option value="">{t("categories_no_executor")}</option>
                        {executors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </Select>
                    </div>
                    <span className="w-[80px] flex justify-end gap-1">
                      <Button size="sm" onClick={saveEditCat}><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditCat}><X className="w-3 h-3" /></Button>
                    </span></>
                  ) : (
                    <><span className="flex-1 text-sm text-[var(--b24-text)]">{c.name}</span>
                    <span className="w-[110px] text-sm text-[var(--b24-text-secondary)]">{c.group?.name}</span>
                    <span className="w-[120px] text-sm text-[var(--b24-text-secondary)]">{c.default_executor?.name || "—"}</span>
                    <span className="w-[120px] flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEditCat(c)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={async () => { await deleteCategory(c.id); load() }}>
                        <Trash2 className="w-3 h-3" /></Button>
                    </span></>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
