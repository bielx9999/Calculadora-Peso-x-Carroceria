import { PageHeader } from "@/components/page-header"
import { VehiclesManager } from "@/components/vehicles-manager"
import { listVehicles } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function VehiclesPage() {
  return <div className="space-y-6"><PageHeader title="Implementos" /><VehiclesManager initialVehicles={await listVehicles()} /></div>
}
