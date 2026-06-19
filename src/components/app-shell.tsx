"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, History, LayoutDashboard, Menu, Package, Truck, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { href: "/", label: "Visao geral", icon: LayoutDashboard },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/veiculos", label: "Frota", icon: Truck },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/simulacoes", label: "Simulacoes", icon: History },
]

function Navigation() {
  const pathname = usePathname()
  return <nav className="space-y-1.5">{navigation.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    return <Link key={item.href} href={item.href} prefetch={false} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground")}><item.icon className="h-4 w-4" />{item.label}</Link>
  })}</nav>
}

function Brand() {
  return <Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f26522] text-white shadow-sm"><Waypoints className="h-5 w-5" /></span><span><strong className="block text-lg tracking-tight">CargoCalc</strong><span className="block text-xs text-sidebar-foreground/55">Inteligencia de cargas</span></span></Link>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/35">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground lg:flex lg:flex-col"><Brand /><div className="mt-9 flex-1"><Navigation /></div><div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/65"><span className="mb-1 block font-semibold text-sidebar-foreground">Ambiente operacional</span>Dados demonstrativos ativos</div></aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-7"><div className="flex items-center gap-3 lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="h-4 w-4" /><span className="sr-only">Abrir menu</span></Button></SheetTrigger><SheetContent side="left" className="w-72 bg-sidebar p-5 text-sidebar-foreground"><SheetTitle className="sr-only">Navegacao</SheetTitle><Brand /><div className="mt-9"><Navigation /></div></SheetContent></Sheet><span className="font-semibold">CargoCalc</span></div><div className="hidden lg:block"><p className="text-sm font-medium">Central de operacoes</p><p className="text-xs text-muted-foreground">Planeje cada embarque com seguranca.</p></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 sm:block dark:text-emerald-400">Sistema online</span><ThemeToggle /></div></header><main className="mx-auto max-w-[1500px] p-4 md:p-7">{children}</main></div>
  </div>
}
