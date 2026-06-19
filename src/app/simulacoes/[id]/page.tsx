import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { listSimulations } from "@/lib/repository"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
export const dynamic = "force-dynamic"

export default async function SimulationDetailPage({ params }: PageProps<"/simulacoes/[id]">) {
  const { id } = await params
  const simulation = (await listSimulations()).find((item) => item.id === id)
  if (!simulation) notFound()
  const result = simulation.resultado_json
  const counts = new Map<string, number>()
  result.distribuicao.forEach((allocation) => counts.set(allocation.veiculo.nome, (counts.get(allocation.veiculo.nome) || 0) + 1))
  const composition = Array.from(counts.entries()).map(([name, count]) => `${count}× ${name}`).join(" + ")

  return <div className="space-y-6">
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link href="/simulacoes"><ArrowLeft className="h-4 w-4" />Voltar ao histórico</Link></Button><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-2 flex gap-2"><Badge>{simulation.status}</Badge><Badge variant="outline">{result.fator_limitante}</Badge></div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{simulation.nome}</h1><p className="mt-1 text-muted-foreground">Planejamento salvo com {result.quantidade} veículo(s).</p></div></div></div>
    <section className="grid gap-4 sm:grid-cols-3"><Metric label="Peso total" value={`${number.format(result.peso_total_kg)} kg`} /><Metric label="Área total" value={`${number.format(result.area_total_m2)} m²`} /><Metric label="Composição" value={composition} /></section>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Ocupação planejada</CardTitle></CardHeader><CardContent className="grid gap-6 sm:grid-cols-2"><Occupancy label="Peso por veículo" value={result.ocupacao_peso} /><Occupancy label="Área por veículo" value={result.ocupacao_area} /></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Distribuição</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{result.distribuicao.map((allocation) => <div key={allocation.indice} className="rounded-xl border p-4"><p className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4 text-[#f26522]" />Veículo {allocation.indice} · {allocation.veiculo.nome}</p><p className="mt-2 text-sm text-muted-foreground">{number.format(allocation.peso_kg)} kg · {number.format(allocation.area_m2)} m²</p></div>)}</CardContent></Card>
  </div>
}

function Metric({ label, value }: { label: string, value: string }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="metric-grid mt-2 text-xl font-semibold">{value}</p></CardContent></Card>
}

function Occupancy({ label, value }: { label: string, value: number }) {
  return <div className="space-y-2"><div className="flex justify-between text-sm"><span>{label}</span><strong>{number.format(value)}%</strong></div><Progress value={value} /></div>
}
