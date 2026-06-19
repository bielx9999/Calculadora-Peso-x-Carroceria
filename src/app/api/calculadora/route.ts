import { calcularCarga, criarItemCarga } from "@/lib/calcular-carga"
import { listProducts, listVehicles } from "@/lib/repository"
import { calculationSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const parsed = calculationSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Selecione itens validos." }, { status: 400 })
  try {
    const [products, vehicles] = await Promise.all([listProducts(), listVehicles()])
    const items = parsed.data.itens.map((item) => {
      const product = products.find((candidate) => candidate.id === item.produto_id)
      if (!product) throw new Error("Produto nao encontrado")
      return criarItemCarga(product, item.quantidade)
    })
    return Response.json(calcularCarga(items, vehicles, parsed.data.peso_total_kg))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no calculo." }, { status: 400 })
  }
}
