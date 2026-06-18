import { clsx } from "clsx"

interface BadgeProps { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string }

function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={clsx(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium leading-4",
      { "bg-[var(--b24-content)] text-[var(--b24-text-sidebar)]": variant === "default",
        "bg-[var(--b24-success-bg)] text-[var(--b24-success-text)]": variant === "success",
        "bg-[var(--b24-warning-bg)] text-[var(--b24-warning-text)]": variant === "warning",
        "bg-[var(--b24-danger-bg)] text-[var(--b24-danger-text)]": variant === "danger",
        "bg-[var(--b24-info-bg)] text-[var(--b24-info-text)]": variant === "info" }, className
    )}>{children}</span>
  )
}
export default Badge