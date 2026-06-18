import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { Bell, X, CheckCheck, MessageSquare, UserPlus, RefreshCw, FileText, Volume2 } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

interface Notification {
  id: string
  type: string
  data: {
    ticket_id: number
    title: string
    prefix: string
    url: string
  }
  created_at: string
}

const iconMap: Record<string, React.ReactNode> = {
  TicketCreated: <FileText className="w-4 h-4 text-[var(--b24-primary)]" />,
  TicketAssigned: <UserPlus className="w-4 h-4 text-[#D4A017]" />,
  TicketStatusChanged: <RefreshCw className="w-4 h-4 text-[#3A8C2C]" />,
  NewComment: <MessageSquare className="w-4 h-4 text-[var(--b24-primary)]" />,
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

function requestPushPermission() {
  if (!("Notification" in window)) return
  if (Notification.permission === "default") {
    Notification.requestPermission()
  }
}

function sendPushNotification(n: Notification, onClick: () => void) {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  try {
    const notif = new Notification(n.data.prefix || t("notif_push_title"), {
      body: n.data.title || "",
      icon: "https://mehal.pp.ua/favicon.ico",
      tag: n.id,
      requireInteraction: true,
    })
    notif.onclick = () => {
      window.focus()
      onClick()
      notif.close()
    }
    setTimeout(() => notif.close(), 10000)
  } catch {}
}

export default function NotificationToast() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [toast, setToast] = useState<Notification | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const prevCountRef = useRef(0)
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestPushPermission()
  }, [])

  const handleNotificationClick = useCallback((n: Notification) => {
    markRead(n.id, n.data.url)
    setToast(null)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread")
      if (Array.isArray(data)) {
        const oldCount = prevCountRef.current
        prevCountRef.current = data.length

        if (data.length > oldCount && oldCount > 0) {
          const newOnes = data.slice(0, data.length - oldCount)
          if (newOnes.length > 0) {
            const latest = newOnes[0]
            setToast(latest)
            setTimeout(() => setToast(null), 5000)

            if (soundEnabled) playSound()

            sendPushNotification(latest, () => handleNotificationClick(latest))
          }
        }

        setNotifications(data)
      }
    } catch {
      // silent
    }
  }, [soundEnabled, handleNotificationClick])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markRead = async (id: string, url?: string) => {
    try {
      await api.post("/notifications/" + id + "/read")
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (url) navigate(url)
    setShowPanel(false)
  }

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all")
    } catch {}
    setNotifications([])
    setShowPanel(false)
  }

  return (
    <>
      {/* Toast notification (top-right popup) */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-4 fade-in max-w-sm">
          <div className="bg-[var(--b24-card)] rounded-xl shadow-2xl border border-[var(--b24-border)] p-4 flex items-start gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="mt-0.5">{iconMap[toast.type] || <Bell className="w-4 h-4 text-[var(--b24-primary)]" />}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--b24-text)]">{toast.data.prefix}</p>
              <p className="text-xs text-[var(--b24-text-secondary)] truncate mt-0.5">{toast.data.title}</p>
            </div>
            <button
              onClick={() => { markRead(toast.id, toast.data.url); setToast(null) }}
              className="text-[var(--b24-primary)] text-xs font-medium hover:underline whitespace-nowrap cursor-pointer"
            >{t("notif_go")}</button>
            <button onClick={() => setToast(null)} className="text-[var(--b24-text-secondary)] hover:text-[var(--b24-text)] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bell icon in header */}
      <div className="relative" ref={panelRef}>
        <div className="flex items-center gap-1">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer"
          title={t("notif_title")}
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#CC3333] text-[var(--b24-text-inverse)] text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer flex items-center"
          title={soundEnabled ? t("notif_sound_off") : t("notif_sound_on")}
        >
          <Volume2 className={"w-4 h-4 " + (soundEnabled ? "opacity-100" : "opacity-30")} />
        </button>
        </div>

        {/* Dropdown panel */}
        {showPanel && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--b24-card)] rounded-xl shadow-2xl border border-[var(--b24-border)] z-50 max-h-96 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--b24-border)]">
              <h3 className="text-sm font-semibold text-[var(--b24-text)]">{t("notif_notifications")}</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-[var(--b24-primary)] hover:underline flex items-center gap-1 cursor-pointer">
                  <CheckCheck className="w-3 h-3" />{t("notif_read_all")}
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-[var(--b24-text-secondary)] text-sm">{t("notif_no_notifications")}</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id, n.data.url)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--b24-hover)] cursor-pointer border-b border-[#F0F2F5] last:border-0 transition-colors"
                  >
                    <div className="mt-0.5">{iconMap[n.type] || <Bell className="w-4 h-4 text-[var(--b24-primary)]" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--b24-text)]">{n.data.prefix}</p>
                      <p className="text-xs text-[var(--b24-text-secondary)] truncate mt-0.5">{n.data.title}</p>
                      <p className="text-[10px] text-[var(--b24-text-tertiary)] mt-1">{n.created_at}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
