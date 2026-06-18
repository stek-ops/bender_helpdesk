import api from "./axios"

export const getUsers = async () => { const { data } = await api.get("/admin/users"); return data }

export const createUser = async (user: Record<string, unknown>) => {
  const { data } = await api.post("/admin/users", user); return data
}

export const updateUser = async (id: number, user: Record<string, unknown>) => {
  const { data } = await api.put("/admin/users/" + id, user); return data
}

export const getCategoryGroups = async () => { const { data } = await api.get("/admin/category-groups"); return data }

export const createCategoryGroup = async (group: Record<string, unknown>) => {
  const { data } = await api.post("/admin/category-groups", group); return data
}

export const updateCategoryGroup = async (id: number, payload: Record<string, unknown>) => { const { data } = await api.put("/admin/category-groups/" + id, payload); return data }

export const deleteCategoryGroup = async (id: number) => { await api.delete("/admin/category-groups/" + id) }

export const getCategoriesAdmin = async () => { const { data } = await api.get("/admin/categories"); return data }

export const createCategory = async (cat: Record<string, unknown>) => {
  const { data } = await api.post("/admin/categories", cat); return data
}

export const updateCategory = async (id: number, payload: Record<string, unknown>) => { const { data } = await api.put("/admin/categories/" + id, payload); return data }

export const deleteCategory = async (id: number) => { await api.delete("/admin/categories/" + id) }


export const getKeywordRules = async () => {
  const { data } = await api.get("/admin/keyword-rules"); return data
}

export const createKeywordRule = async (rule: Record<string, unknown>) => {
  const { data } = await api.post("/admin/keyword-rules", rule); return data
}

export const updateKeywordRule = async (id: number, payload: Record<string, unknown>) => {
  const { data } = await api.put("/admin/keyword-rules/" + id, payload); return data
}

export const deleteKeywordRule = async (id: number) => {
  await api.delete("/admin/keyword-rules/" + id)
}
