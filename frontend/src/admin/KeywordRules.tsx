import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import api from "../api/axios"
import { getKeywordRules, createKeywordRule, updateKeywordRule, deleteKeywordRule } from "../api/admin"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Select from "../components/ui/Select"
import { FileText, Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function KeywordRules() {
  const { t } = useTranslation()
  const [rules, setRules] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [executors, setExecutors] = useState<any[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newGroupId, setNewGroupId] = useState("")
  const [newCatId, setNewCatId] = useState("")
  const [newExecutorId, setNewExecutorId] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editKeyword, setEditKeyword] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editCatId, setEditCatId] = useState("")
  const [editExecutorId, setEditExecutorId] = useState("")

  const load = () => {
    getKeywordRules().then(res => setRules(res || []))
    api.get("/admin/category-groups").then(res => setGroups(res.data || []))
    api.get("/admin/categories").then(res => setCats(res.data || []))
    api.get("/tickets/executors").then(res => setExecutors(res.data || []))
  }
  useEffect(() => { load() }, [])

  const addRule = async (e: FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return
    await createKeywordRule({
      keyword: newKeyword,
      category_group_id: newGroupId ? Number(newGroupId) : null,
      category_id: newCatId ? Number(newCatId) : null,
      executor_id: newExecutorId ? Number(newExecutorId) : null,
    })
    setNewKeyword(""); load()
  }

  const startEdit = (r: any) => {
    setEditId(r.id)
    setEditKeyword(r.keyword)
    setEditGroupId(String(r.category_group_id || ""))
    setEditCatId(String(r.category_id || ""))
    setEditExecutorId(String(r.executor_id || ""))
  }
  const cancelEdit = () => { setEditId(null); setEditKeyword(""); setEditGroupId(""); setEditCatId(""); setEditExecutorId("") }
  const saveEdit = async () => {
    if (!editKeyword.trim() || editId === null) return
    await updateKeywordRule(editId, {
      keyword: editKeyword,
      category_group_id: editGroupId ? Number(editGroupId) : null,
      category_id: editCatId ? Number(editCatId) : null,
      executor_id: editExecutorId ? Number(editExecutorId) : null,
    })
    cancelEdit(); load()
  }

  const removeRule = async (id: number) => {
    if (!confirm(t("rules_delete_confirm"))) return
    await deleteKeywordRule(id)
    load()
  }

  const filteredCatsForNew = newGroupId
    ? cats.filter(c => c.group_id === Number(newGroupId))
    : cats
  const filteredCats = editGroupId
    ? cats.filter(c => c.group_id === Number(editGroupId))
    : cats

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-[var(--b24-primary)]" />
        <div>
          <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("rules_title")}</h1>
          <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("rules_subtitle")}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>{t("rules_add_rule")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addRule} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("rules_keyword")}</label>
              <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder={t("rules_keyword_placeholder")} required />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("rules_group")}</label>
              <Select value={newGroupId} onChange={e => { setNewGroupId(e.target.value); setNewCatId("") }}>
                <option value="">{t("rules_any_group")}</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("rules_header_category")}</label>
              <Select value={newCatId} onChange={e => setNewCatId(e.target.value)}>
                <option value="">{t("rules_any_category")}</option>
                {filteredCatsForNew.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("rules_executor")}</label>
              <Select value={newExecutorId} onChange={e => setNewExecutorId(e.target.value)}>
                <option value="">{t("rules_auto")}</option>
                {executors.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </div>
            <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />{t("rules_add_button")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--b24-border)]">
                <th className="text-left px-4 py-3 text-[var(--b24-text-sidebar)] font-medium">{t("rules_header_keyword")}</th>
                <th className="text-left px-4 py-3 text-[var(--b24-text-sidebar)] font-medium">{t("rules_header_group")}</th>
                <th className="text-left px-4 py-3 text-[var(--b24-text-sidebar)] font-medium">{t("rules_header_category")}</th>
                <th className="text-left px-4 py-3 text-[var(--b24-text-sidebar)] font-medium">{t("rules_header_executor")}</th>
                <th className="text-right px-4 py-3 text-[var(--b24-text-sidebar)] font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-b border-[var(--b24-border)] hover:bg-[var(--b24-hover)]">
                  {editId === r.id ? (
                    <>
                      <td className="px-4 py-2">
                        <Input value={editKeyword} onChange={e => setEditKeyword(e.target.value)} className="text-sm" />
                      </td>
                      <td className="px-4 py-2">
                        <Select value={editGroupId} onChange={e => { setEditGroupId(e.target.value); setEditCatId("") }}>
                          <option value="">{t("rules_any_group")}</option>
                          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <Select value={editCatId} onChange={e => setEditCatId(e.target.value)}>
                          <option value="">{t("rules_any_category")}</option>
                          {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <Select value={editExecutorId} onChange={e => setEditExecutorId(e.target.value)}>
                          <option value="">{t("rules_auto")}</option>
                          {executors.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-700 mr-2 cursor-pointer"><Check className="w-4 h-4 inline" /></button>
                        <button onClick={cancelEdit} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] cursor-pointer"><X className="w-4 h-4 inline" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-[var(--b24-text)]">{r.keyword}</td>
                      <td className="px-4 py-3 text-[var(--b24-text-sidebar)]">{r.category_group?.name || <span className="text-[var(--b24-text-tertiary)]">—</span>}</td>
                      <td className="px-4 py-3 text-[var(--b24-text-sidebar)]">{r.category?.name || <span className="text-[var(--b24-text-tertiary)]">—</span>}</td>
                      <td className="px-4 py-3 text-[var(--b24-text-sidebar)]">{r.executor?.name || <span className="text-[var(--b24-text-tertiary)]">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(r)} className="text-[var(--b24-primary)] hover:text-[#1B5EC4] mr-2 cursor-pointer"><Pencil className="w-4 h-4 inline" /></button>
                        <button onClick={() => removeRule(r.id)} className="text-[var(--b24-danger-text)] hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[var(--b24-text-secondary)]">{t("rules_no_rules")}</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
