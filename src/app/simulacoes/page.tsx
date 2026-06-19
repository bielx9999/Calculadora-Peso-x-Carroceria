import { PageHeader } from "@/components/page-header"
import { SimulationsList } from "@/components/simulations-list"
import { listSimulations } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function SimulationsPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Historico" title="Simulacoes de carga" description="Consulte, duplique e acompanhe seus planejamentos." /><SimulationsList initialSimulations={await listSimulations()} /></div>
}
