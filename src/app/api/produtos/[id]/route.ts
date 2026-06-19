import { deleteProduct, updateProduct } from "@/lib/repository"
import { productSchema } from "@/lib/validations"

export async function PUT(request: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const parsed = productSchema.partial().safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Dados invalidos" }, { status: 400 })
  const { id } = await params
  const product = await updateProduct(id, parsed.data)
  return product ? Response.json(product) : Response.json({ error: "Produto nao encontrado" }, { status: 404 })
}

export async function DELETE(_: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const { id } = await params
  const deleted = await deleteProduct(id)
  return deleted ? Response.json({ success: true }) : Response.json({ error: "Produto nao encontrado" }, { status: 404 })
}
