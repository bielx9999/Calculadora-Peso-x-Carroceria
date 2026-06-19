"use client"

/* React Hook Form watch is intentionally used for live calculated fields. */
/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useState } from "react"
import { Edit3, Plus, Power, PowerOff, Search, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Vehicle, VehicleType } from "@/types"
import { vehicleSchema, type VehicleInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "fiorino", label: "Fiorino" },
  { value: "van_furgao", label: "Van Furgão" },
  { value: "van_bau", label: "Van Baú" },
  { value: "truck", label: "Truck" },
  { value: "carreta", label: "Carreta" },
  { value: "vanderleia", label: "Vanderleia" },
]

const typeLabels = Object.fromEntries(vehicleTypes.map((item) => [item.value, item.label])) as Record<VehicleType, string>
const empty: VehicleInput = { nome: "", tipo: "fiorino", capacidade_kg: 0, comprimento_m: 0, largura_m: 0, ativo: true }
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })

export function VehiclesManager({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [open, setOpen] = useState(false)
  const form = useForm<VehicleInput>({ resolver: zodResolver(vehicleSchema) as Resolver<VehicleInput>, defaultValues: empty })
  const dimensions = useWatch({ control: form.control, name: ["comprimento_m", "largura_m"] })
  const volume = dimensions.reduce((total, value) => total * Number(value || 0), 1)
  const filtered = useMemo(
    () => vehicles.filter((item) => `${item.nome} ${typeLabels[item.tipo]}`.toLowerCase().includes(search.toLowerCase())),
    [vehicles, search],
  )

  function showForm(vehicle?: Vehicle) {
    setEditing(vehicle || null)
    form.reset(vehicle ? {
      nome: vehicle.nome,
      tipo: vehicle.tipo,
      capacidade_kg: vehicle.capacidade_kg,
      comprimento_m: vehicle.comprimento_m,
      largura_m: vehicle.largura_m,
      ativo: vehicle.ativo,
    } : empty)
    setOpen(true)
  }

  async function submit(input: VehicleInput) {
    const response = await fetch(editing ? `/api/veiculos/${editing.id}` : "/api/veiculos", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!response.ok) return toast.error("Não foi possível salvar o veículo.")
    const saved = await response.json() as Vehicle
    setVehicles((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
    toast.success(editing ? "Veículo atualizado." : "Veículo adicionado à frota.")
    setOpen(false)
  }

  async function toggleActive(vehicle: Vehicle) {
    const response = await fetch(`/api/veiculos/${vehicle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !vehicle.ativo }),
    })
    if (!response.ok) return toast.error(`Falha ao ${vehicle.ativo ? "desativar" : "ativar"} o veículo.`)
    const saved = await response.json() as Vehicle
    setVehicles((current) => current.map((item) => item.id === saved.id ? saved : item))
    toast.success(`Veículo ${saved.ativo ? "ativado" : "desativado"}.`)
  }

  async function remove(vehicle: Vehicle) {
    if (!confirm(`Excluir permanentemente ${vehicle.nome}? Esta ação não pode ser desfeita.`)) return
    const response = await fetch(`/api/veiculos/${vehicle.id}`, { method: "DELETE" })
    if (!response.ok) return toast.error("Falha ao excluir o veículo.")
    setVehicles((current) => current.filter((item) => item.id !== vehicle.id))
    toast.success("Veículo excluído.")
  }

  return <>
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo de carroceria" className="pl-9" />
          </div>
          <Button onClick={() => showForm()} className="bg-[#FFCC29] text-slate-900 hover:bg-[#E6B800]"><Plus className="h-4 w-4" />Novo veículo</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Veículo</TableHead><TableHead>Carroceria</TableHead><TableHead>Capacidade</TableHead><TableHead>Área útil</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((vehicle) => <TableRow key={vehicle.id}>
              <TableCell><div className="flex items-center gap-3"><span className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Truck className="h-4 w-4" /></span><p className="font-medium">{vehicle.nome}</p></div></TableCell>
              <TableCell>{typeLabels[vehicle.tipo]}</TableCell>
              <TableCell className="metric-grid">{number.format(vehicle.capacidade_kg)} kg</TableCell>
              <TableCell className="metric-grid">{number.format(vehicle.area_m2)} m²</TableCell>
              <TableCell><Badge variant={vehicle.ativo ? "default" : "secondary"}>{vehicle.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
              <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => showForm(vehicle)} aria-label={`Editar ${vehicle.nome}`} title="Editar"><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => toggleActive(vehicle)} aria-label={`${vehicle.ativo ? "Desativar" : "Ativar"} ${vehicle.nome}`} title={vehicle.ativo ? "Desativar" : "Ativar"}>{vehicle.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-emerald-600" />}</Button><Button variant="ghost" size="icon" onClick={() => remove(vehicle)} aria-label={`Excluir ${vehicle.nome}`} title="Excluir definitivamente" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Editar veículo" : "Cadastrar veículo"}</DialogTitle><DialogDescription>Informe a capacidade e as dimensões da área útil de piso.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" error={form.formState.errors.nome?.message}><Input {...form.register("nome")} placeholder="Ex.: Van Furgão" /></Field>
            <Field label="Carroceria">
              <Select value={form.watch("tipo")} onValueChange={(value: VehicleType) => form.setValue("tipo", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{vehicleTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Capacidade (kg)" error={form.formState.errors.capacidade_kg?.message}><Input type="number" step="0.01" {...form.register("capacidade_kg")} /></Field>
            <Field label="Comprimento (m)"><Input type="number" step="0.01" {...form.register("comprimento_m")} /></Field>
            <Field label="Largura (m)"><Input type="number" step="0.01" {...form.register("largura_m")} /></Field>
            <div className="rounded-lg border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Área útil calculada</p><p className="metric-grid mt-1 text-lg font-semibold">{Number.isFinite(volume) ? number.format(volume) : 0} m²</p></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>Salvar veículo</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
}

function Field({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>
}
