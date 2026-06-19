"use client"

/* React Hook Form watch is intentionally used for live calculated fields. */
/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useState } from "react"
import { Box, Edit3, Plus, Power, PowerOff, Search, Trash2 } from "lucide-react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { Product } from "@/types"
import { productSchema, type ProductInput } from "@/lib/validations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const empty: ProductInput = { nome: "", tipo: "caixa", sku: "", comprimento_cm: 0, largura_cm: 0, empilhavel: false, limite_empilhamento: 1, fragil: false, obs: "", ativo: true }
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 })

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const form = useForm<ProductInput>({ resolver: zodResolver(productSchema) as Resolver<ProductInput>, defaultValues: empty })
  const dimensions = useWatch({ control: form.control, name: ["comprimento_cm", "largura_cm"] })
  const area = dimensions.reduce((total, value) => total * (Number(value || 0) / 100), 1)
  const filtered = useMemo(
    () => products.filter((item) => `${item.nome} ${item.sku || ""} ${item.tipo}`.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  )

  function showForm(product?: Product) {
    setEditing(product || null)
    form.reset(product ? {
      nome: product.nome,
      tipo: product.tipo,
      sku: product.sku || "",
      comprimento_cm: product.comprimento_cm,
      largura_cm: product.largura_cm,
      empilhavel: product.empilhavel,
      limite_empilhamento: product.limite_empilhamento,
      fragil: product.fragil,
      obs: product.obs || "",
      ativo: product.ativo,
    } : empty)
    setOpen(true)
  }

  async function submit(input: ProductInput) {
    const response = await fetch(editing ? `/api/produtos/${editing.id}` : "/api/produtos", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!response.ok) return toast.error("Não foi possível salvar o produto.")
    const saved = await response.json() as Product
    setProducts((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
    toast.success(editing ? "Produto atualizado." : "Produto adicionado ao catálogo.")
    setOpen(false)
  }

  async function toggleActive(product: Product) {
    const response = await fetch(`/api/produtos/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !product.ativo }),
    })
    if (!response.ok) return toast.error(`Falha ao ${product.ativo ? "desativar" : "ativar"} o produto.`)
    const saved = await response.json() as Product
    setProducts((current) => current.map((item) => item.id === saved.id ? saved : item))
    toast.success(`Produto ${saved.ativo ? "ativado" : "desativado"}.`)
  }

  async function remove(product: Product) {
    if (!confirm(`Excluir permanentemente ${product.nome}? Esta ação não pode ser desfeita.`)) return
    const response = await fetch(`/api/produtos/${product.id}`, { method: "DELETE" })
    if (!response.ok) return toast.error("Falha ao excluir o produto.")
    setProducts((current) => current.filter((item) => item.id !== product.id))
    toast.success("Produto excluído.")
  }

  return <>
    <Card><CardContent className="p-0">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, SKU ou tipo" className="pl-9" /></div>
        <Button onClick={() => showForm()} className="bg-[#f26522] text-white hover:bg-[#d95619]"><Plus className="h-4 w-4" />Novo produto</Button>
      </div>
      <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead>Dimensões da base</TableHead><TableHead>Área unitária</TableHead><TableHead>Características</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map((product) => <TableRow key={product.id}>
          <TableCell><div className="flex items-center gap-3"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-600"><Box className="h-4 w-4" /></span><div><p className="font-medium">{product.nome}</p><p className="font-mono text-xs text-muted-foreground">{product.sku || "Sem SKU"}</p></div></div></TableCell>
          <TableCell><Badge variant="outline" className="capitalize">{product.tipo}</Badge></TableCell>
          <TableCell className="text-sm text-muted-foreground">{number.format(product.comprimento_cm)} × {number.format(product.largura_cm)} cm</TableCell>
          <TableCell>{number.format(product.area_unitaria_m2)} m²</TableCell>
          <TableCell><div className="flex gap-1">{product.empilhavel && <Badge variant="secondary">Empilhável</Badge>}{product.fragil && <Badge variant="destructive">Frágil</Badge>}{!product.ativo && <Badge variant="secondary">Inativo</Badge>}</div></TableCell>
          <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => showForm(product)} aria-label={`Editar ${product.nome}`} title="Editar"><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => toggleActive(product)} aria-label={`${product.ativo ? "Desativar" : "Ativar"} ${product.nome}`} title={product.ativo ? "Desativar" : "Ativar"}>{product.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-emerald-600" />}</Button><Button variant="ghost" size="icon" onClick={() => remove(product)} aria-label={`Excluir ${product.nome}`} title="Excluir definitivamente" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>
    </CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Cadastrar produto"}</DialogTitle><DialogDescription>Comprimento e largura determinam a área de piso ocupada.</DialogDescription></DialogHeader>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><Input {...form.register("nome")} /></Field>
          <Field label="SKU"><Input {...form.register("sku")} /></Field>
          <Field label="Tipo"><Select value={form.watch("tipo")} onValueChange={(value: ProductInput["tipo"]) => form.setValue("tipo", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["peca", "palete", "caixa", "tambor", "outro"].map((type) => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}</SelectContent></Select></Field>
          <div className="hidden sm:block" />
          <Field label="Comprimento (cm)"><Input type="number" step="0.1" {...form.register("comprimento_cm")} /></Field>
          <Field label="Largura (cm)"><Input type="number" step="0.1" {...form.register("largura_cm")} /></Field>
          <div className="rounded-lg border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Área calculada</p><p className="metric-grid mt-1 text-lg font-semibold">{Number.isFinite(area) ? number.format(area) : 0} m²</p></div>
          <div className="flex items-center justify-between rounded-lg border p-3"><div><Label>Empilhável</Label><p className="text-xs text-muted-foreground">Permite sobreposição</p></div><Switch checked={form.watch("empilhavel")} onCheckedChange={(value) => form.setValue("empilhavel", value)} /></div>
          <Field label="Limite de empilhamento"><Input type="number" min="1" {...form.register("limite_empilhamento")} /></Field>
          <div className="flex items-center justify-between rounded-lg border p-3"><div><Label>Frágil</Label><p className="text-xs text-muted-foreground">Exige cuidado especial</p></div><Switch checked={form.watch("fragil")} onCheckedChange={(value) => form.setValue("fragil", value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea {...form.register("obs")} /></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>Salvar produto</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </>
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
