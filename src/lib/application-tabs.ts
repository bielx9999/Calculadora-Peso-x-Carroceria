import { Calculator, createLucideIcon, History, LayoutDashboard } from "lucide-react"

const Trailer = createLucideIcon("Trailer", [
  ["path", { d: "M3 16V5h18v11H3Zm18 0h2m-6 0v4", key: "body" }],
  ["circle", { cx: "6", cy: "18", r: "2", key: "rear-wheel" }],
  ["circle", { cx: "11", cy: "18", r: "2", key: "front-wheel" }],
])

export const applicationTabs = [
  { href: "/visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/veiculos", label: "Implementos", icon: Trailer },
  { href: "/simulacoes", label: "Simulações", icon: History },
]
