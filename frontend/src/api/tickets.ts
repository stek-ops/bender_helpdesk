import api from "./axios"

export const getTickets = async (params?: Record<string, string>) => {
  const { data } = await api.get("/tickets", { params })
  return data
}

export const getTicket = async (id: number) => {
  const { data } = await api.get("/tickets/" + id)
  return data
}

export const createTicket = async (form: FormData) => {
  const { data } = await api.post("/tickets", form, { headers: { "Content-Type": "multipart/form-data" } })
  return data
}

export const getExecutors = async () => {
  const { data } = await api.get("/tickets/executors")
  return data
}

export const getCategories = async () => {
  const { data } = await api.get("/tickets/categories")
  return data
}


export const matchKeywords = async (title: string) => {
  try {
    const { data } = await api.post("/tickets/match-keywords", { title })
    return data
  } catch {
    return null
  }
}
