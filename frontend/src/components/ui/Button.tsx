import { forwardRef } from "react"
import type { ButtonHTMLAttributes } from "react"
import { clsx } from "clsx"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost"
  size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button ref={ref} className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C6FD5]/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          { "bg-[var(--b24-primary)] text-[var(--b24-text-inverse)] hover:bg-[#1B5EC4]": variant === "primary",
            "bg-[var(--b24-bg-light)] text-[var(--b24-text-sidebar)] border border-[#C0C7D0] hover:bg-[var(--b24-content)]": variant === "secondary",
            "bg-[#E94B4B] text-[var(--b24-text-inverse)] hover:bg-[#D83A3A]": variant === "destructive",
            "hover:bg-[var(--b24-bg-light)] text-[var(--b24-text-sidebar)]": variant === "ghost",
            "h-8 px-3 text-sm": size === "sm", "h-10 px-4 text-sm": size === "md", "h-12 px-6 text-base": size === "lg" },
          className
        )} {...props} />
    )
  }
)
export default Button