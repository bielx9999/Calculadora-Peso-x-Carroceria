"use client"

import dynamic from "next/dynamic"
import type { VehicleAllocation } from "@/types"

const LoadDistributionCanvas = dynamic(
  () => import("@/components/load-distribution-canvas").then((module) => module.LoadDistributionCanvas),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" /> },
)

export function SavedLoadDistribution({ distribution }: { distribution: VehicleAllocation[] }) {
  const savedAllocations = distribution.filter((allocation) => Array.isArray(allocation.posicoes))

  if (!savedAllocations.length) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Esta simulação foi salva em uma versão anterior e não possui posições para desenhar.</div>
  }

  return <div className="grid gap-4 md:grid-cols-2">{savedAllocations.map((allocation) => <section key={allocation.indice} className="space-y-2"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Veículo {allocation.indice} · {allocation.veiculo.nome}</p><p className="text-xs text-muted-foreground">{allocation.ocupacao_area.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ocupado</p></div><LoadDistributionCanvas allocation={allocation} vehicle={allocation.veiculo} /></section>)}</div>
}
