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

interface User { id: number; name: string; email: string; role: string; token?: string }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token
      axios.get("/api/auth/me").then(res => setUser(res.data.user)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Завантаження...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={(u: User) => { setUser(u); localStorage.setItem("token", u.token || "") }} />} />
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
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
