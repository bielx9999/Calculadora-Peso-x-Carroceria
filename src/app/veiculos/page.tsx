import { PageHeader } from "@/components/page-header"
import { VehiclesManager } from "@/components/vehicles-manager"
import { listVehicles } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function VehiclesPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Frota" title="Veiculos e carrocerias" description="Gerencie a capacidade disponivel para cada operacao." /><VehiclesManager initialVehicles={await listVehicles()} /></div>
}
