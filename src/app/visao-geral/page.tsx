import Link from "next/link"
import { ArrowRight, Calculator, History, Route, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listProducts, listSimulations, listVehicles } from "@/lib/repository"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [vehicles, products, simulations] = await Promise.all([listVehicles(), listProducts(), listSimulations()])
  const activeVehicles = vehicles.filter((item) => item.ativo)
  const metrics = [
    { label: "Veiculos ativos", value: activeVehicles.length, detail: `${vehicles.length} cadastrados`, icon: Truck, color: "text-blue-600 bg-blue-500/10" },
    { label: "Itens no historico", value: products.filter((item) => item.ativo).length, detail: "reutilizaveis na calculadora", icon: History, color: "text-violet-600 bg-violet-500/10" },
    { label: "Simulacoes", value: simulations.length, detail: "planejamentos salvos", icon: Route, color: "text-emerald-600 bg-emerald-500/10" },
  ]
  return <div className="space-y-7">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bom dia, equipe de logistica.</h1></div><Button asChild className="bg-[#FFCC29] text-slate-900 hover:bg-[#E6B800]"><Link href="/calculadora"><Calculator className="h-4 w-4" />Nova simulacao</Link></Button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => <Card key={metric.label}><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="metric-grid mt-2 text-2xl font-semibold">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p></div><span className={`rounded-lg p-2.5 ${metric.color}`}><metric.icon className="h-5 w-5" /></span></CardContent></Card>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Simulacoes recentes</CardTitle></div><Button asChild variant="ghost" size="sm"><Link href="/simulacoes">Ver todas <ArrowRight className="h-4 w-4" /></Link></Button></CardHeader><CardContent>{simulations.length ? <div className="divide-y">{simulations.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between py-4"><div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{number.format(item.peso_total_kg)} kg · {item.numero_veiculos} veiculo(s)</p></div><Badge>{item.status}</Badge></div>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed text-center"><Calculator className="mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhuma simulacao salva</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Calcule sua primeira carga para acompanhar o historico aqui.</p><Button asChild variant="link"><Link href="/calculadora">Comecar agora</Link></Button></div>}</CardContent></Card>
      <Card className="overflow-hidden bg-[#1e3a5f] text-white"><CardHeader><CardTitle>Planejamento rapido</CardTitle></CardHeader><CardContent className="space-y-5">{["Informe os itens e quantidades", "Compare peso e area automaticamente", "Salve e compartilhe a simulacao"].map((label, index) => <div key={label} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{index + 1}</span><p className="text-sm text-white/85">{label}</p></div>)}<Button asChild className="mt-3 w-full bg-white text-[#1e3a5f] hover:bg-white/90"><Link href="/calculadora">Abrir calculadora <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
    </section>
  </div>
}
