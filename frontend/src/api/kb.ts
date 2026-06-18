import api from "./axios"

export function getArticles(params?: Record<string, string>) {
  return api.get("/kb", { params }).then(r => r.data)
}

export function getArticle(id: number) {
  return api.get("/kb/" + id).then(r => r.data)
}

export function createArticle(data: any) {
  return api.post("/kb", data).then(r => r.data)
}

export function updateArticle(id: number, data: any) {
  return api.put("/kb/" + id, data).then(r => r.data)
}

export function deleteArticle(id: number) {
  return api.delete("/kb/" + id)
}
