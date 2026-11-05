import { LoadCalculator } from "@/components/load-calculator"
import { PageHeader } from "@/components/page-header"
import { listProducts } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function CalculatorPage() {
  return <div className="space-y-6"><PageHeader title="Planeje uma nova carga" /><LoadCalculator products={await listProducts()} /></div>
}
