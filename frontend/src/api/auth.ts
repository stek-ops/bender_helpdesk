import api from "./axios"

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password })
  return data
}

export const logout = async () => { await api.post("/auth/logout") }

export const getMe = async () => { const { data } = await api.get("/auth/me"); return data }
