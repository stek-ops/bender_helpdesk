import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { getUsers, createUser, updateUser } from "../api/admin"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Select from "../components/ui/Select"
import Badge from "../components/ui/Badge"
import { Users as UsersIcon, UserPlus, Lock, Unlock } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function Users() {
  const getRoleLabel = (r: string) => ({ user: t("users_role_user"), executor: t("users_role_executor"), admin: t("users_role_admin") })[r] || r
  const { t } = useTranslation()
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" })

  const load = () => { getUsers().then((res: any) => setUsers(res || [])) }
  useEffect(() => { load() }, [])

  const addUser = async (e: FormEvent) => {
    e.preventDefault()
    await createUser(form)
    setForm({ name: "", email: "", password: "", role: "user" })
    load()
  }

  const toggleActive = async (user: any) => {
    await updateUser(user.id, { is_active: !user.is_active })
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--b24-text)]">{t("users_title")}</h1>
        <p className="text-sm text-[var(--b24-text-secondary)] mt-0.5">{t("users_subtitle")}</p>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" />{t("users_new_user")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addUser} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("users_name_placeholder")}</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t("users_name_placeholder")} required />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("users_header_email")}</label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("users_password_placeholder")}</label>
              <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={t("users_password_placeholder")} required />
            </div>
            <div className="w-[140px]">
              <label className="block text-xs font-medium text-[var(--b24-text-sidebar)] mb-1">{t("users_role")}</label>
              <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">{t("users_role_user")}</option>
                <option value="executor">{t("users_role_executor")}</option>
                <option value="admin">{t("users_role_admin")}</option>
              </Select>
            </div>
            <Button type="submit" className="mb-[1px]"><UserPlus className="w-4 h-4 mr-1" />{t("users_add_button")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="w-4 h-4" />{t("users_user_list")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {users.length === 0 ? (
            <p className="text-sm text-[var(--b24-text-secondary)] text-center py-4">{t("users_no_users")}</p>
          ) : (
            <div>
              <div className="flex items-center gap-4 px-5 py-2 bg-[var(--b24-bg-light)] border-b border-[var(--b24-border)] text-xs font-medium text-[var(--b24-text-secondary)] uppercase tracking-wider">
                <span className="flex-1">{t("users_header_name")}</span>
                <span className="w-[200px]">{t("users_header_email")}</span>
                <span className="w-[100px]">{t("users_header_role")}</span>
                <span className="w-[100px]">{t("users_header_status")}</span>
                <span className="w-[110px] text-right">{t("users_header_actions")}</span>
              </div>
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3 border-b border-[var(--b24-border)] last:border-0">
                  <span className="flex-1 text-sm text-[var(--b24-text)]">{u.name}</span>
                  <span className="w-[200px] text-sm text-[var(--b24-text-secondary)]">{u.email}</span>
                  <span className="w-[100px]">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        try {
                          await updateUser(u.id, { role: e.target.value })
                          load()
                        } catch {}
                      }}
                      className="w-full text-xs border border-[var(--b24-border)] rounded-md px-2 py-1 bg-[var(--b24-card)] text-[var(--b24-text)] focus:outline-none focus:ring-1 focus:ring-[var(--b24-primary)] cursor-pointer"
                    >
                      <option value="user">{t("users_role_user")}</option>
                      <option value="executor">{t("users_role_executor")}</option>
                      <option value="admin">{t("users_role_admin")}</option>
                    </select>
                  </span>
                  <span className="w-[100px] text-sm text-[var(--b24-text-secondary)]">{u.is_active ? t("users_active") : t("users_blocked")}</span>
                  <span className="w-[110px] text-right">
                    <Button size="sm" variant={u.is_active ? "destructive" : "primary"} onClick={() => toggleActive(u)}>
                      {u.is_active ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                      {u.is_active ? t("users_block") : t("users_unblock")}
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
