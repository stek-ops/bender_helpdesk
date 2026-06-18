import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MessageSquare, X, Send, Zap, HelpCircle, FileText, List } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

interface Message {
  text: string
  isUser: boolean
}

const fallbackReplies: Record<string, string[]> = {
  "create": [
    "Ну що, знову щось зламалося? Давай, створюй заявку, я поки піду пиво пити.",
    "Створити заявку? Нарешті хоч якась робота! Кнопка в меню ліворуч.",
    "О, нове завдання! Тисни «Створити заявку», не гальмуй.",
  ],
  "status": [
    "Хочеш знати статус? Зайди в «Мої заявки», там все написано. Я не телепат, блін.",
    "Статус можна подивитися в списку заявок. Або запитай у адміна, він все одно знає краще.",
  ],
  "hello": [
    "Привіт, м'ясний мішечок! Чим можу допомогти?",
    "А, це ти. Що зламалося цього разу?",
    "Вітання! Я Бендер Родрігес, ваш цифровий помічник. Не сподівайся на багато.",
  ],
  "admin": [
    "Адмінка? Тільки для обраних. Якщо ти адмін — тисни «Адмін-панель».",
    "Хочеш керувати? Тобі потрібні права адміна. В мене є, але я не ділюся.",
  ],
  "thanks": [
    "Звертайся. Серйозно, звертайся. Мені все одно нічого робити.",
    "Не дякуй. Краще пива принеси.",
    "Та нема за що. Я б і так нічого не робив.",
  ],
  "problem": [
    "О, проблема! Нарешті щось цікаве. Розкажи детальніше в заявці.",
    "Звучить як щось, що потребує уваги. Або ігнорування. Створи заявку — вирішимо.",
  ],
  "default": [
    "Я не знаю, що на це відповісти. Я всього лише робот-помічник, а не екстрасенс.",
    "Спробуй написати «допомога» або «створити заявку». Я туплю, буває.",
    "Краще створи заявку, там тобі точно допоможуть. А я піду іржавіти далі.",
  ],
}

function getFallback(input: string): string {
  const lower = input.toLowerCase()
  const cats: [string, string][] = [
    ["створ", "create"], ["заявк", "create"], ["new", "create"], ["проблем", "problem"],
    ["статус", "status"], ["де моя", "status"], ["прогрес", "status"],
    ["привіт", "hello"], ["хай", "hello"], ["добр", "hello"], ["hi", "hello"],
    ["адмін", "admin"], ["admin", "admin"], ["панель", "admin"],
    ["дяк", "thanks"], ["спасиб", "thanks"],
  ]
  for (const [kw, cat] of cats) {
    if (lower.includes(kw)) {
      const arr = fallbackReplies[cat]
      return arr[Math.floor(Math.random() * arr.length)]
    }
  }
  const def = fallbackReplies["default"]
  return def[Math.floor(Math.random() * def.length)]
}

async function askAI(question: string): Promise<string | null> {
  const token = localStorage.getItem("token")
  if (!token) return null
  try {
    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ message: question }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.answer || null
  } catch {
    return null
  }
}

export default function BenderAssistant() {
  const { t } = useTranslation()
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("bender:toggle", handler)
    return () => window.removeEventListener("bender:toggle", handler)
  }, [])
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { text: "Привіт! Я Бендер Родрігес, ваш цифровий помічник. Тут щось трапилося?", isUser: false },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const send = async () => {
    if (!input.trim() || loading) return
    const question = input
    setInput("")
    setMessages(prev => [...prev, { text: question, isUser: true }])
    setLoading(true)

    const aiAnswer = await askAI(question)
    const reply = aiAnswer || getFallback(question)

    setMessages(prev => [...prev, { text: reply, isUser: false }])
    setLoading(false)
  }

  const quickAction = (text: string, path: string) => {
    setMessages(prev => [...prev, { text, isUser: true }])
    if (path !== "#") {
      setTimeout(() => navigate(path), 300)
      setOpen(false)
    } else {
      setMessages(prev => [...prev, {
        text: t("bender_faq_no_data"),
        isUser: false,
      }])
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {open && (
        <div className="bg-[var(--b24-card)] rounded-2xl shadow-2xl border border-[var(--b24-border)] w-[360px] max-h-[520px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-[var(--b24-header)] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-[#B8860B]">
              <img src="https://static.wikia.nocookie.net/anime-characters-fight/images/6/6a/%D0%91%D0%B5%D0%BD%D0%B4%D0%B5%D1%80_4.png/revision/latest/scale-to-width-down/700?cb=20220603140448&path-prefix=ru" alt="Bender" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-[var(--b24-text-inverse)] text-sm font-semibold">{t("bender_title")}</div>
              <div className="text-[var(--b24-text-tertiary)] text-xs">{t("bender_subtitle")}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--b24-text-tertiary)] hover:text-[var(--b24-text-inverse)] transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2.5 bg-[var(--b24-hover)] border-b border-[var(--b24-border)] flex gap-2">
            <button onClick={() => quickAction(t("bender_quick_create"), "/tickets/create")}
              className="flex items-center gap-1.5 text-xs bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] px-3 py-1.5 rounded-full hover:bg-[#1B5EC4] transition-colors cursor-pointer">
              <Zap className="w-3 h-3" /> {t("bender_new_ticket_btn")}
            </button>
            <button onClick={() => quickAction(t("bender_quick_show"), "/tickets")}
              className="flex items-center gap-1.5 text-xs bg-[var(--b24-border)] text-[var(--b24-text-sidebar)] px-3 py-1.5 rounded-full hover:bg-[var(--b24-border-light)] transition-colors cursor-pointer">
              <List className="w-3 h-3" />{t("bender_quick_show")}
            </button>
            <button onClick={() => quickAction(t("bender_quick_help"), "#")}
              className="flex items-center gap-1.5 text-xs bg-[var(--b24-border)] text-[var(--b24-text-sidebar)] px-3 py-1.5 rounded-full hover:bg-[var(--b24-border-light)] transition-colors cursor-pointer">
              <HelpCircle className="w-3 h-3" />{t("bender_quick_help")}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isUser ? "justify-end" : "justify-start"}`}>
                {!m.isUser && (
                  <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-0.5 shrink-0 border border-[#B8860B]">
                    <img src="https://static.wikia.nocookie.net/anime-characters-fight/images/6/6a/%D0%91%D0%B5%D0%BD%D0%B4%D0%B5%D1%80_4.png/revision/latest/scale-to-width-down/700?cb=20220603140448&path-prefix=ru" alt="Bender" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.isUser
                    ? "bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] rounded-br-md"
                    : "bg-[var(--b24-content)] text-[var(--b24-text)] rounded-bl-md"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-0.5 shrink-0 border border-[#B8860B]">
                  <img src="https://static.wikia.nocookie.net/anime-characters-fight/images/6/6a/%D0%91%D0%B5%D0%BD%D0%B4%D0%B5%D1%80_4.png/revision/latest/scale-to-width-down/700?cb=20220603140448&path-prefix=ru" alt="Bender" className="w-full h-full object-cover" />
                </div>
                <div className="bg-[var(--b24-content)] text-[var(--b24-text)] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[var(--b24-primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--b24-primary)] rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--b24-primary)] rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--b24-border)] p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={t("bender_placeholder")}
              className="flex-1 rounded-full border border-[#C0C7D0] px-4 py-2 text-sm outline-none focus:border-[var(--b24-primary)] transition-colors bg-[var(--b24-hover)]"
              disabled={loading}
            />
            <button onClick={send} disabled={loading}
              className="w-9 h-9 rounded-full bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] flex items-center justify-center hover:bg-[#1B5EC4] transition-colors shrink-0 disabled:opacity-50 cursor-pointer">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-20 h-20 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-[#B8860B] cursor-pointer overflow-hidden bg-[var(--b24-card)]"
        title={t("bender_floating_title")}
      >
        {open ? <X className="w-6 h-6 text-[#D4A017] mx-auto mt-4" /> : (
          <img src="https://static.wikia.nocookie.net/anime-characters-fight/images/6/6a/%D0%91%D0%B5%D0%BD%D0%B4%D0%B5%D1%80_4.png/revision/latest/scale-to-width-down/700?cb=20220603140448&path-prefix=ru" alt="Bender" className="w-full h-full object-cover" />
        )}
      </button>
    </div>
  )
}
