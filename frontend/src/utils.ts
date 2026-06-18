import { uploadImage } from "./api/upload"

export function renderContent(text: string): string {
  return text
    .replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg border border-[#E6E9EC] my-2" />')
    .replace(/\n/g, "<br />")
}

export async function handleImagePaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  value: string,
  setValue: (v: string) => void,
): Promise<void> {
  // Method 1: clipboardData.items
  const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith("image/"))
  let file: File | null = item?.getAsFile() ?? null

  // Method 2: clipboardData.files
  if (!file && e.clipboardData?.files?.length) {
    file = Array.from(e.clipboardData.files).find(f => f.type.startsWith("image/")) || null
  }

  // Method 3: navigator.clipboard.read() (Clipboard API)
  if (!file && navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read()
      for (const clipItem of items) {
        for (const type of clipItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipItem.getType(type)
            file = new File([blob], "screenshot.png", { type })
            break
          }
        }
        if (file) break
      }
    } catch {
      // Clipboard API not available or permission denied
    }
  }

  if (!file) return
  e.preventDefault()

  try {
    const url = await uploadImage(file)
    const el = e.currentTarget
    const pos = el.selectionStart
    const tag = "![" + file.name + "](" + url + ")"
    setValue(value.slice(0, pos) + tag + value.slice(el.selectionEnd))
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = pos + tag.length
      el.focus()
    })
  } catch (err) {
    console.error("Paste upload failed", err)
  }
}
