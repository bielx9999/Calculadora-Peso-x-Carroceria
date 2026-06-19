import { LoadCalculator } from "@/components/load-calculator"
import { PageHeader } from "@/components/page-header"
import { listProducts } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function CalculatorPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Motor de calculo" title="Planeje uma nova carga" description="Encontre a carroceria ideal considerando peso e volume." /><LoadCalculator products={await listProducts()} /></div>
}
