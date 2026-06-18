const BASE = "/api"

export const uploadImage = async (file: File | Blob, filename = "screenshot.png"): Promise<string> => {
  const form = new FormData()
  form.append("file", file, filename)
  const token = localStorage.getItem("token")
  const res = await fetch(BASE + "/upload", {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: form,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(res.status + ": " + err)
  }
  const data = await res.json()
  return data.url
}
