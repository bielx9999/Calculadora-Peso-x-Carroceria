"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, PackagePlus, Pencil, Save, Scale, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import type { LoadItem, LoadResult, Product, Simulation } from "@/types"
import { criarItemCarga } from "@/lib/calcular-carga"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadItemEntry } from "@/components/load-item-entry"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const steps = ["Dados da carga", "Resultado", "Salvar simulação"]
const LoadDistributionCanvas = dynamic(
  () => import("@/components/load-distribution-canvas").then((module) => module.LoadDistributionCanvas),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" /> },
)

export function LoadCalculator({ products }: { products: Product[] }) {
  const [step, setStep] = useState(1)
  const [loadWeight, setLoadWeight] = useState(0)
  const [items, setItems] = useState<LoadItem[]>([])
  const [addingItem, setAddingItem] = useState(true)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [result, setResult] = useState<LoadResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const totalArea = useMemo(() => items.reduce((total, item) => total + item.area_total_m2, 0), [items])

  function addItem(product: Product, quantity: number) {
    setItems((current) => {
      if (editingItemId) return current.map((item) => item.produto.id === editingItemId ? criarItemCarga(product, quantity) : item)
      const existing = current.find((item) => item.produto.id === product.id)
      if (!existing) return [...current, criarItemCarga(product, quantity)]
      return current.map((item) => item.produto.id === product.id ? criarItemCarga(product, item.quantidade + quantity) : item)
    })
    setEditingItemId(null)
    setAddingItem(false)
  }

  function editItem(productId: string) {
    setEditingItemId(productId)
    setAddingItem(true)
  }

  function removeItem(productId: string) {
    setItems((current) => {
      const remaining = current.filter((item) => item.produto.id !== productId)
      if (!remaining.length) setAddingItem(true)
      return remaining
    })
    if (editingItemId === productId) setEditingItemId(null)
  }

  async function calculate() {
    if (!items.length) return toast.error("Adicione ao menos um produto.")
    if (!Number.isFinite(loadWeight) || loadWeight <= 0) return toast.error("Informe o peso total da carga.")
    setLoading(true)
    const response = await fetch("/api/calculadora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itens: items.map((item) => ({ produto_id: item.produto.id, quantidade: item.quantidade })),
        peso_total_kg: loadWeight,
      }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return toast.error(body.error || "Falha ao calcular.")
    setResult(body as LoadResult)
    setStep(2)
  }

  async function save() {
    if (!result || !name.trim()) return toast.error("Informe um nome para a simulação.")
    const payload: Omit<Simulation, "id" | "criado_em" | "atualizado_em"> = {
      nome: name.trim(),
      status: "calculada",
      peso_total_kg: result.peso_total_kg,
      area_total_m2: result.area_total_m2,
      numero_veiculos: result.quantidade,
      resultado_json: { ...result, visualizacao_versao: 1 },
    }
    const response = await fetch("/api/simulacoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, observacoes: notes }) })
    if (!response.ok) return toast.error("Não foi possível salvar a simulação.")
    toast.success("Simulação salva no histórico.")
    setStep(1)
    setItems([])
    setLoadWeight(0)
    setResult(null)
    setName("")
    setNotes("")
  }

  return <div className="space-y-6">
    <div className="grid grid-cols-3 gap-2">{steps.map((label, index) => {
      const current = index + 1
      return <div key={label} className={cn("rounded-xl border p-3 transition-colors", step === current ? "border-[#FFCC29] bg-[#FFCC29]/10" : step > current ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card")}><div className="flex items-center gap-2"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", step === current ? "bg-[#FFCC29] text-slate-900" : step > current ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>{step > current ? "✓" : current}</span><span className="hidden text-sm font-medium sm:block">{label}</span></div></div>
    })}</div>

    {step === 1 && <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Card><CardHeader><CardTitle>Monte a carga</CardTitle><CardDescription>Informe o peso total e os itens que ocupam a área útil de piso.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="rounded-xl border border-[#FFCC29]/50 bg-[#FFCC29]/10 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px] sm:items-end"><div><div className="mb-1 flex items-center gap-2"><Scale className="h-4 w-4 text-[#987600] dark:text-[#FFCC29]" /><Label htmlFor="load-weight">Peso total da carga</Label></div><p className="text-xs text-muted-foreground">Use o peso total informado pelo cliente.</p></div><div className="relative"><Input id="load-weight" type="number" min="0.01" step="0.01" value={loadWeight || ""} onChange={(event) => setLoadWeight(Number(event.target.value))} placeholder="0,00" className="pr-12 text-lg font-semibold" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span></div></div>
        </div>
        <div className="space-y-3">
          {addingItem ? <>
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{editingItemId ? "Editar produto" : "Adicionar produto"}</p>{items.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingItem(false); setEditingItemId(null) }}>{editingItemId ? "Cancelar edição" : "Concluir inclusão"}</Button>}</div>
            <LoadItemEntry key={editingItemId || "new-item"} products={products} initialItem={items.find((item) => item.produto.id === editingItemId)} onAdd={addItem} />
          </> : <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3"><div><p className="text-sm font-medium">Produtos adicionados</p><p className="text-xs text-muted-foreground">Você já pode calcular a carga ou incluir outro produto.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setAddingItem(true)}><PackagePlus className="h-4 w-4" />Adicionar outro produto</Button></div>}
        </div>
        <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Qtd.</TableHead><TableHead>Área ocupada</TableHead><TableHead /></TableRow></TableHeader><TableBody>{items.length ? items.map((item) => <TableRow key={item.produto.id}><TableCell><p className="font-medium">{item.produto.nome}</p><p className="text-xs text-muted-foreground">{item.produto.comprimento_cm} × {item.produto.largura_cm} cm{item.produto.empilhavel ? ` · até ${item.produto.limite_empilhamento} por pilha` : " · não empilhável"}</p></TableCell><TableCell>{item.quantidade}</TableCell><TableCell>{number.format(item.area_total_m2)} m²</TableCell><TableCell><div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Editar ${item.produto.nome}`} onClick={() => editItem(item.produto.id)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remover ${item.produto.nome} da carga`} onClick={() => removeItem(item.produto.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="h-36 text-center text-muted-foreground">Nenhum item adicionado.</TableCell></TableRow>}</TableBody></Table></div>
      </CardContent></Card>
      <Card className="h-fit xl:sticky xl:top-24"><CardHeader><CardTitle>Resumo da carga</CardTitle><CardDescription>Atualizado em tempo real</CardDescription></CardHeader><CardContent className="space-y-5"><Metric label="Peso informado" value={`${number.format(loadWeight)} kg`} /><Metric label="Área de piso calculada" value={`${number.format(totalArea)} m²`} /><div className="border-t pt-5"><p className="mb-3 text-xs text-muted-foreground">{items.length} produto(s) diferente(s)</p><Button className="w-full bg-[#FFCC29] text-slate-900 hover:bg-[#E6B800]" onClick={calculate} disabled={loading || !items.length || loadWeight <= 0}>{loading ? "Calculando..." : "Calcular carga"}<ArrowRight className="h-4 w-4" /></Button></div></CardContent></Card>
    </div>}

    {step === 2 && result && <Result result={result} onBack={() => setStep(1)} onNext={() => setStep(3)} />}

    {step === 3 && result && <div className="grid gap-5 lg:grid-cols-[1fr_380px]"><Card><CardHeader><CardTitle>Identifique a simulação</CardTitle><CardDescription>Salve este planejamento para consulta e aprovação.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label>Nome da simulação</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Carga Cliente XYZ - Junho" /></div><div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Instruções de embarque, janela de entrega..." rows={5} /></div><div className="flex justify-between"><Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" />Voltar</Button><Button onClick={save}><Save className="h-4 w-4" />Salvar simulação</Button></div></CardContent></Card><Card className="h-fit bg-muted/40"><CardHeader><CardTitle className="text-base">Resumo final</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><SummaryLine label="Composição" value={describeFleet(result)} /><SummaryLine label="Quantidade" value={`${result.quantidade}`} /><SummaryLine label="Peso total" value={`${number.format(result.peso_total_kg)} kg`} /><SummaryLine label="Área total" value={`${number.format(result.area_total_m2)} m²`} /><SummaryLine label="Fator limitante" value={result.fator_limitante} /></CardContent></Card></div>}
  </div>
}

function Result({ result, onBack, onNext }: { result: LoadResult, onBack: () => void, onNext: () => void }) {
  const unique = result.tipo === "unico"
  return <div className="space-y-5">
    <Card className={cn("border-l-4", unique ? "border-l-emerald-500" : "border-l-amber-500")}>
      <CardHeader><div className="flex items-start justify-between gap-3"><div className="flex gap-3">{unique ? <CheckCircle2 className="h-7 w-7 text-emerald-500" /> : <AlertTriangle className="h-7 w-7 text-amber-500" />}<div><CardTitle>{unique ? "Cabe em 1 veículo" : `Necessários ${result.quantidade} veículos`}</CardTitle><CardDescription className="mt-1">Composição sugerida: {describeFleet(result)}</CardDescription></div></div><Badge variant="outline">Limite: {result.fator_limitante}</Badge></div></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2"><Occupancy label="Ocupação por peso" value={result.ocupacao_peso} detail={`${number.format(result.peso_total_kg)} kg no total`} /><Occupancy label="Ocupação da área de piso" value={result.ocupacao_area} detail={`${number.format(result.area_total_m2)} m² no total`} /></CardContent>
    </Card>

    {result.tipo === "multiplo" && <Card><CardHeader><CardTitle className="text-base">Distribuição sugerida</CardTitle><CardDescription>Combinação otimizada para reduzir capacidade excedente no último veículo.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{result.distribuicao.map((allocation) => <div key={allocation.indice} className="rounded-xl border p-4"><div className="mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-[#987600] dark:text-[#FFCC29]" /><p className="font-medium">Veículo {allocation.indice} · {allocation.veiculo.nome}</p></div><p className="text-sm text-muted-foreground">{number.format(allocation.peso_kg)} kg · {number.format(allocation.area_m2)} m²</p></div>)}</CardContent></Card>}

    <Card>
      <CardHeader><CardTitle className="text-base">Visualização da distribuição</CardTitle><CardDescription>Vista superior em escala, incluindo 2 cm de folga entre os produtos.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{result.distribuicao.map((allocation) => <section key={allocation.indice} className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium">Veículo {allocation.indice} · {allocation.veiculo.nome}</p><p className="text-xs text-muted-foreground">{number.format(allocation.ocupacao_area)}% ocupado</p></div><LoadDistributionCanvas allocation={allocation} vehicle={allocation.veiculo} /></section>)}</CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">Comparação com outras carrocerias</CardTitle><CardDescription>Veja como a mesma carga seria distribuída em cada tipo cadastrado.</CardDescription></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{result.alternativas.map((alternative) => {
        const selected = result.distribuicao.some((allocation) => allocation.veiculo.id === alternative.veiculo.id)
        return <div key={alternative.veiculo.id} className={cn("rounded-xl border p-4", selected && "border-[#FFCC29] bg-[#FFCC29]/10")}>
          <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{alternative.veiculo.nome}</p><p className="text-xs text-muted-foreground">{number.format(alternative.veiculo.comprimento_m)} × {number.format(alternative.veiculo.largura_m)} m · {number.format(alternative.veiculo.area_m2)} m²</p></div>{selected ? <Badge>Na composição</Badge> : !alternative.veiculo.ativo ? <Badge variant="secondary">Inativa</Badge> : null}</div>
          {alternative.compativel ? <div className="mt-4 space-y-2"><SummaryLine label="Veículos necessários" value={`${alternative.quantidade}`} /><SummaryLine label="Ocupação por peso" value={`${number.format(alternative.ocupacao_peso)}%`} /><SummaryLine label="Ocupação por área" value={`${number.format(alternative.ocupacao_area)}%`} /><SummaryLine label="Fator limitante" value={alternative.fator_limitante} /></div> : <p className="mt-4 text-sm text-destructive">{alternative.motivo}</p>}
        </div>
      })}</CardContent>
    </Card>

    <div className="flex justify-between"><Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" />Ajustar carga</Button><Button onClick={onNext}>Continuar<ArrowRight className="h-4 w-4" /></Button></div>
  </div>
}

function Occupancy({ label, value, detail }: { label: string, value: number, detail: string }) {
  return <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium">{label}</span><strong className="metric-grid">{number.format(value)}%</strong></div><Progress value={Math.min(value, 100)} className="h-3" /><p className="text-xs text-muted-foreground">{detail}</p></div>
}

function Metric({ label, value }: { label: string, value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="metric-grid mt-1 text-2xl font-semibold">{value}</p></div>
}

function describeFleet(result: LoadResult) {
  const counts = new Map<string, number>()
  result.distribuicao.forEach((allocation) => counts.set(allocation.veiculo.nome, (counts.get(allocation.veiculo.nome) || 0) + 1))
  return Array.from(counts.entries()).map(([name, count]) => `${count}× ${name}`).join(" + ")
}

function SummaryLine({ label, value }: { label: string, value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
}
