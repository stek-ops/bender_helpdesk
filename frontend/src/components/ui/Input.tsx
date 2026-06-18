import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { clsx } from "clsx"

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={clsx(
      "flex h-10 w-full rounded-md border border-[#C0C7D0] bg-[var(--b24-card)] px-3 py-2 text-sm text-[var(--b24-text)] placeholder:text-[#A8ADB4] transition-colors hover:border-[#979DA6] focus:outline-none focus:border-[var(--b24-primary)] focus:ring-2 focus:ring-[#2C6FD5]/20 disabled:opacity-50", className
    )} {...props} />
  )
)
export default Input