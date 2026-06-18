import { forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { clsx } from "clsx"

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("rounded-lg bg-[var(--b24-card)] border border-[var(--b24-border)] shadow-sm", className)} {...props} />
))

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("flex flex-col space-y-1.5 px-5 py-4 border-b border-[var(--b24-border)]", className)} {...props} />
))

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={clsx("text-base font-semibold text-[var(--b24-text)] leading-none", className)} {...props} />
))

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("px-5 py-4", className)} {...props} />
))

export { Card, CardHeader, CardTitle, CardContent }