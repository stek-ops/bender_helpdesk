import { forwardRef } from "react"
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"
import { clsx } from "clsx"

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto"><table ref={ref} className={clsx("w-full caption-bottom text-sm", className)} {...props} /></div>
))
const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={clsx("[&_tr]:border-b border-[var(--b24-border)]", className)} {...props} />
))
const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={clsx("[&_tr:last-child]:border-0", className)} {...props} />
))
const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={clsx("border-b border-[var(--b24-border)] transition-colors hover:bg-[var(--b24-bg-light)]", className)} {...props} />
))
const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={clsx("h-10 px-4 text-left align-middle font-medium text-[var(--b24-text-secondary)] text-xs uppercase tracking-wider", className)} {...props} />
))
const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={clsx("py-3 px-4 align-middle text-[var(--b24-text)]", className)} {...props} />
))

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }