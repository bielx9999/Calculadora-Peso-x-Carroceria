"use client"

import { useMemo, useState } from "react"
import { History, PackagePlus, Ruler } from "lucide-react"
import { toast } from "sonner"
import type { LoadItem, Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface LoadItemEntryProps {
  products: Product[]
  onAdd: (product: Product, quantity: number) => void
  initialItem?: LoadItem
}

export function LoadItemEntry({ products, onAdd, initialItem }: LoadItemEntryProps) {
  const initialProduct = initialItem?.produto
  const [history, setHistory] = useState(products)
  const [name, setName] = useState(initialProduct?.nome || "")
  const [length, setLength] = useState(initialProduct?.comprimento_cm || 0)
  const [width, setWidth] = useState(initialProduct?.largura_cm || 0)
  const [height, setHeight] = useState(initialProduct?.altura_cm?.toString() ?? "")
  const [quantity, setQuantity] = useState(initialItem?.quantidade || 1)
  const [stackable, setStackable] = useState(initialProduct?.empilhavel || false)
  const [stackLimit, setStackLimit] = useState(initialProduct?.empilhavel ? initialProduct.limite_empilhamento : 2)
  const [selectedId, setSelectedId] = useState<string | null>(initialProduct?.id || null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const area = (length / 100) * (width / 100)
  const suggestions = useMemo(() => {
    const term = name.trim().toLowerCase()
    if (!term) return []
    return history
      .filter((product) => product.ativo && product.nome.toLowerCase().includes(term))
      .slice(0, 6)
  }, [history, name])

  function selectProduct(product: Product) {
    setName(product.nome)
    setLength(product.comprimento_cm)
    setWidth(product.largura_cm)
    setHeight(product.altura_cm?.toString() ?? "")
    setStackable(product.empilhavel)
    setStackLimit(product.empilhavel ? Math.max(product.limite_empilhamento, 2) : 2)
    setSelectedId(product.id)
    setShowSuggestions(false)
  }

  async function addItem() {
    if (!name.trim()) return toast.error("Informe o nome do produto.")
    if (length <= 0 || width <= 0) return toast.error("Informe comprimento e largura válidos.")
    if (height !== "" && (!Number.isFinite(Number(height)) || Number(height) <= 0)) return toast.error("Informe uma altura válida.")
    if (!Number.isInteger(quantity) || quantity <= 0) return toast.error("Informe uma quantidade válida.")
    if (stackable && (!Number.isInteger(stackLimit) || stackLimit < 2)) return toast.error("Informe um limite de empilhamento de pelo menos 2 unidades.")

    setSaving(true)
    const existing = history.find((product) => product.id === selectedId)
      || history.find((product) => product.nome.toLowerCase() === name.trim().toLowerCase())
    const payload = {
      nome: name.trim(),
      tipo: existing?.tipo || "outro",
      sku: existing?.sku || null,
      comprimento_cm: length,
      largura_cm: width,
      altura_cm: height === "" ? null : Number(height),
      empilhavel: stackable,
      limite_empilhamento: stackable ? stackLimit : 1,
      fragil: existing?.fragil || false,
      obs: existing?.obs || null,
      ativo: true,
    }
    const response = await fetch(existing ? `/api/produtos/${existing.id}` : "/api/produtos", {
      method: existing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!response.ok) return toast.error("Não foi possível gravar o produto no histórico.")

    const saved = await response.json() as Product
    setHistory((current) => existing
      ? current.map((product) => product.id === saved.id ? saved : product)
      : [saved, ...current])
    onAdd(saved, quantity)
    toast.success(initialItem ? "Produto atualizado na carga e no histórico." : existing ? "Produto reutilizado e adicionado." : "Produto salvo no histórico e adicionado.")
    setName("")
    setLength(0)
    setWidth(0)
    setHeight("")
    setQuantity(1)
    setStackable(false)
    setStackLimit(2)
    setSelectedId(null)
  }

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_90px_auto] lg:items-end">
      <div className="relative space-y-2">
        <Label htmlFor="product-name">Nome do produto</Label>
        <Input id="product-name" value={name} onFocus={() => setShowSuggestions(Boolean(name.trim()))} onBlur={() => setShowSuggestions(false)} onChange={(event) => { const value = event.target.value; setName(value); setSelectedId(null); setShowSuggestions(Boolean(value.trim())) }} placeholder="Digite ou escolha um item usado anteriormente" autoComplete="off" />
        {showSuggestions && suggestions.length > 0 && <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">{suggestions.map((product) => <button key={product.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectProduct(product)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"><span className="font-medium">{product.nome}</span><span className="text-xs text-muted-foreground">{product.comprimento_cm} × {product.largura_cm}{product.altura_cm ? ` × ${product.altura_cm}` : ""} cm</span></button>)}</div>}
      </div>
      <div className="space-y-2"><Label htmlFor="product-length">Comprimento (cm)</Label><Input id="product-length" type="number" min="0.01" step="0.01" value={length || ""} onChange={(event) => setLength(Number(event.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="product-width">Largura (cm)</Label><Input id="product-width" type="number" min="0.01" step="0.01" value={width || ""} onChange={(event) => setWidth(Number(event.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="product-height">Altura (cm)</Label><Input id="product-height" type="number" min="0.01" step="0.01" value={height} onChange={(event) => setHeight(event.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="product-quantity">Quantidade</Label><Input id="product-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></div>
      <Button type="button" onClick={addItem} disabled={saving}><PackagePlus className="h-4 w-4" />{saving ? "Salvando..." : initialItem ? "Atualizar produto" : "Adicionar"}</Button>
    </div>

    <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[1fr_180px] sm:items-end">
      <div className="flex items-center justify-between gap-4 sm:justify-start"><div><Label htmlFor="product-stackable" className="text-sm font-medium">Permitir empilhamento</Label><p className="mt-1 text-xs text-muted-foreground">Ative quando mais de uma unidade puder ocupar a mesma posição no piso.</p></div><Switch id="product-stackable" checked={stackable} onCheckedChange={setStackable} aria-label="Permitir empilhamento do produto" /></div>
      {stackable && <div className="space-y-2"><Label htmlFor="product-stack-limit">Unidades por pilha</Label><Input id="product-stack-limit" type="number" min="2" step="1" value={stackLimit} onChange={(event) => setStackLimit(Number(event.target.value))} /></div>}
    </div>

    <div className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-[#987600] dark:text-[#FFCC29]" /><span className="text-sm text-muted-foreground">Área unitária</span><strong className="metric-grid">{area.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} m²</strong></div>
      {history.filter((product) => product.ativo).length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1 text-xs text-muted-foreground"><History className="h-3.5 w-3.5" />Histórico:</span>{history.filter((product) => product.ativo).slice(0, 4).map((product) => <Button key={product.id} type="button" variant="outline" size="sm" className="h-7 rounded-full px-2.5 text-xs" onClick={() => selectProduct(product)}>{product.nome}</Button>)}</div>}
    </div>
  </div>
}
