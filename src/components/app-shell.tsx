"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, History, LayoutDashboard, Menu, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { href: "/", label: "Visao geral", icon: LayoutDashboard },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/veiculos", label: "Frota", icon: Truck },
  { href: "/simulacoes", label: "Simulacoes", icon: History },
]

function Navigation() {
  const pathname = usePathname()
  return <nav className="space-y-1.5">{navigation.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    return <Link key={item.href} href={item.href} prefetch={false} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-[#FFCC29]/20 hover:text-foreground", active && "bg-[#FFCC29] text-slate-900 shadow-sm hover:bg-[#E6B800] hover:text-slate-900")}><item.icon className="h-4 w-4" />{item.label}</Link>
  })}</nav>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/35">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background p-5 text-foreground lg:flex lg:flex-col"><div className="flex-1"><Navigation /></div><div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground"><span className="mb-1 block font-semibold text-foreground">Ambiente operacional</span>Dados demonstrativos ativos</div></aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-muted/35 px-4 lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="h-4 w-4" /><span className="sr-only">Abrir menu</span></Button></SheetTrigger><SheetContent side="left" className="w-72 bg-background p-5 text-foreground"><SheetTitle className="sr-only">Navegacao</SheetTitle><Navigation /></SheetContent></Sheet><ThemeToggle /></header><main className="mx-auto max-w-[1500px] p-4 md:p-7">{children}</main></div>
  </div>
}
