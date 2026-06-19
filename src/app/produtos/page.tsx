import { PageHeader } from "@/components/page-header"
import { ProductsManager } from "@/components/products-manager"
import { listProducts } from "@/lib/repository"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  return <div className="space-y-6"><PageHeader eyebrow="Catalogo" title="Produtos e volumes" description="Centralize as caracteristicas dos itens transportados." /><ProductsManager initialProducts={await listProducts()} /></div>
}
