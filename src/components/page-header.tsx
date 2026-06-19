import type { ReactNode } from "react"

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string, title: string, description: string, action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f26522]">{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p></div>{action}</div>
}
