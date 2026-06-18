import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import Login from "./pages/Login"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Tickets from "./pages/Tickets"
import TicketDetail from "./pages/TicketDetail"
import CreateTicket from "./pages/CreateTicket"
import AdminDashboard from "./admin/AdminDashboard"
import AdminTickets from "./admin/AdminTickets"
import Categories from "./admin/Categories"
import Users from "./admin/Users"
import KeywordRules from "./admin/KeywordRules"
import TeamsSettings from "./admin/TeamsSettings"
import LdapSettings from "./admin/LdapSettings"
import MicrosoftSettings from "./admin/MicrosoftSettings"
import KnowledgeList from "./pages/KnowledgeList"
import KnowledgeDetail from "./pages/KnowledgeDetail"
import KnowledgeForm from "./pages/KnowledgeForm"
import Profile from "./pages/Profile"
import EmailSettings from "./admin/EmailSettings"
import { LanguageProvider } from "./hooks/useTranslation"

interface User { id: number; name: string; email: string; role: string }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogin = (u: any) => {
    setUser(u.user || u)
    localStorage.setItem("token", u.token || u.access_token || "")
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const code = params.get("code")
    if (window.location.pathname === "/login/microsoft") {
      if (code) {
        axios.get("/api/auth/oauth/callback?code=" + code).then(res => {
          const data = res.data
          const user = { id: data.id, name: data.name, email: data.email, role: data.role, token: data.token }
          localStorage.setItem("user", JSON.stringify(user))
          handleLogin(user)
          window.location.href = "/"
        }).catch(() => {
          window.location.href = "/login"
        })
      }
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token
      axios.get("/api/auth/me").then(res => setUser(res.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading...</div>

  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/login/microsoft" element={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>Redirecting...</div>} />
        <Route path="/" element={user ? <Layout user={user} onLogout={() => { setUser(null); localStorage.removeItem("token") }} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/create" element={<CreateTicket />} />
          <Route path="tickets/:id" element={<TicketDetail user={user} />} />
          {user?.role === "admin" && (
            <>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/tickets" element={<AdminTickets />} />
              <Route path="admin/categories" element={<Categories />} />
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/keyword-rules" element={<KeywordRules />} />
              <Route path="admin/teams" element={<TeamsSettings />} />
              <Route path="admin/ldap" element={<LdapSettings />} />
              <Route path="admin/microsoft" element={<MicrosoftSettings />} />
              <Route path="admin/email" element={<EmailSettings />} />
            </>
          )}
          <Route path="knowledge" element={<KnowledgeList admin={user?.role === "admin"} />} />
          <Route path="knowledge/:id" element={<KnowledgeDetail admin={user?.role === "admin"} />} />
          <Route path="knowledge/create" element={<KnowledgeForm />} />
          <Route path="knowledge/:id/edit" element={<KnowledgeForm />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
