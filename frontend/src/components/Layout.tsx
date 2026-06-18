import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import BenderAssistant from "./BenderAssistant"
import { clsx } from "clsx"
import NotificationToast from "./NotificationToast"
import ThemeToggle from "./ThemeToggle"
import { useTranslation } from "../hooks/useTranslation"
import LanguageSwitcher from "./LanguageSwitcher"
import { LayoutDashboard, TicketCheck, TicketPlus, Settings, Users, Tags, LogOut, ChevronDown, FileText, MessageSquare, Server, BookOpen, UserCircle } from "lucide-react"

const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" rx="1" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" rx="1" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" rx="1" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" rx="1" fill="#FFB900"/>
  </svg>
)

interface User { id: number; name: string; email: string; role: string }
interface LayoutProps { user: User; onLogout: () => void }

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; admin: boolean }

export default function Layout({ user, onLogout }: LayoutProps) {
  const { t, lang, setLang } = useTranslation()

  const navItems: NavItem[] = [
    { to: "/", label: t("nav_dashboard"), icon: LayoutDashboard, admin: false },
    { to: "/tickets", label: user.role === "admin" ? t("nav_my_tickets") : t("nav_tickets"), icon: TicketCheck, admin: false },
    { to: "/tickets/create", label: t("tickets_create"), icon: TicketPlus, admin: false },
    { to: "/admin", label: t("nav_admin"), icon: Settings, admin: true },
    { to: "/admin/tickets", label: t("nav_all_tickets"), icon: TicketCheck, admin: true },
    { to: "/admin/categories", label: t("tickets_category"), icon: Tags, admin: true },
    { to: "/admin/users", label: t("nav_users"), icon: Users, admin: true },
    { to: "/admin/ldap", label: t("nav_ldap"), icon: Server, admin: true },
    { to: "/admin/teams", label: t("nav_teams"), icon: MessageSquare, admin: true },
    { to: "/admin/microsoft", label: t("nav_microsoft"), icon: MicrosoftIcon, admin: true },
    { to: "/admin/keyword-rules", label: t("nav_keyword_rules"), icon: FileText, admin: true },
    { to: "/knowledge", label: t("nav_kb"), icon: BookOpen, admin: false },
    { to: "/profile", label: t("nav_profile"), icon: UserCircle, admin: false },
  ]

  const filtered = navItems.filter(item => !item.admin || user.role === "admin")

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header — Bitrix24 style */}
      <header className="h-[55px] min-h-[55px] bg-[var(--b24-header)] flex items-center px-5 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--b24-primary)] flex items-center justify-center">
            <TicketCheck className="w-5 h-5 text-[var(--b24-text-inverse)]" />
          </div>
          <span className="text-[var(--b24-text-inverse)] text-lg font-semibold tracking-wide">{t("app_title")}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <NotificationToast />
        <ThemeToggle />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[var(--b24-text-tertiary)] text-xs px-2 py-0.5 rounded bg-[var(--b24-sidebar-active)] capitalize">{user.name}</span>
          <button onClick={onLogout} className="text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer" title={t("nav_logout")}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[240px] min-w-[240px] bg-[var(--b24-card)] border-r border-[var(--b24-border)] flex flex-col overflow-y-auto">
          <nav className="flex-1 py-3">
            {filtered.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-[3px]",
                  isActive
                    ? "border-[var(--b24-primary)] bg-[var(--b24-active-bg)] text-[var(--b24-primary)] font-medium"
                    : "border-transparent text-[var(--b24-text-sidebar)] hover:bg-[var(--b24-bg-light)] hover:text-[var(--b24-text)]"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--b24-content)] p-6">
          <Outlet />
        </main>
      </div>
      <BenderAssistant />
    </div>
  )
}
