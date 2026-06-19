import { createProduct, listProducts } from "@/lib/repository"
import { productSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams.get("q")?.toLowerCase()
    const products = await listProducts()
    return Response.json(search ? products.filter((item) => item.nome.toLowerCase().includes(search) || item.sku?.toLowerCase().includes(search)) : products)
  } catch { return Response.json({ error: "Nao foi possivel carregar os produtos." }, { status: 500 }) }
}

export async function POST(request: Request) {
  const parsed = productSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Dados invalidos", issues: parsed.error.flatten() }, { status: 400 })
  try { return Response.json(await createProduct(parsed.data), { status: 201 }) }
  catch { return Response.json({ error: "Nao foi possivel cadastrar o produto." }, { status: 500 }) }
}
