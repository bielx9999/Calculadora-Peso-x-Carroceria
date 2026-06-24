"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CalendarDays, Copy, Eye, FileClock, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Simulation, SimulationStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" })

export function SimulationsList({ initialSimulations }: { initialSimulations: Simulation[] }) {
  const [simulations, setSimulations] = useState(initialSimulations)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("todos")
  const filtered = useMemo(() => simulations.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()) && (status === "todos" || item.status === status)), [simulations, search, status])

  async function duplicate(item: Simulation) {
    const payload = { nome: `${item.nome} (copia)`, status: "rascunho" as SimulationStatus, peso_total_kg: item.peso_total_kg, area_total_m2: item.area_total_m2, numero_veiculos: item.numero_veiculos, resultado_json: item.resultado_json }
    const response = await fetch("/api/simulacoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!response.ok) return toast.error("Nao foi possivel duplicar.")
    const duplicated = await response.json() as Simulation
    setSimulations((current) => [duplicated, ...current])
    toast.success("Simulacao duplicada como rascunho.")
  }

  async function remove(item: Simulation) {
    if (!confirm(`Excluir definitivamente a simulacao "${item.nome}"?`)) return
    const response = await fetch(`/api/simulacoes/${item.id}`, { method: "DELETE" })
    if (!response.ok) return toast.error("Nao foi possivel excluir a simulacao.")
    setSimulations((current) => current.filter((simulation) => simulation.id !== item.id))
    toast.success("Simulacao excluida.")
  }

  return <Card><CardContent className="p-0">
    <div className="flex flex-col gap-3 border-b p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar simulacao" className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="calculada">Calculada</SelectItem><SelectItem value="aprovada">Aprovada</SelectItem></SelectContent></Select></div>
    {filtered.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Simulacao</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Peso / Área</TableHead><TableHead>Veiculos</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell><div className="flex items-center gap-3"><span className="rounded-lg bg-[#FFCC29]/20 p-2 text-[#987600] dark:text-[#FFCC29]"><FileClock className="h-4 w-4" /></span><p className="font-medium">{item.nome}</p></div></TableCell><TableCell><span className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{date.format(new Date(item.criado_em))}</span></TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell><p>{number.format(item.peso_total_kg)} kg</p><p className="text-xs text-muted-foreground">{number.format(item.area_total_m2)} m²</p></TableCell><TableCell>{item.numero_veiculos}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => duplicate(item)} aria-label="Duplicar"><Copy className="h-4 w-4" /></Button><Button asChild variant="ghost" size="icon"><Link href={`/simulacoes/${item.id}`} aria-label="Visualizar"><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label={`Excluir ${item.nome}`} title="Excluir definitivamente" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><FileClock className="mb-3 h-9 w-9 text-muted-foreground" /><p className="font-medium">Nenhuma simulacao encontrada</p><p className="mt-1 text-sm text-muted-foreground">Os planejamentos salvos aparecerao aqui.</p></div>}
  </CardContent></Card>
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const variants = { rascunho: "secondary", calculada: "default", aprovada: "outline" } as const
  return <Badge variant={variants[status]} className="capitalize">{status}</Badge>
}
