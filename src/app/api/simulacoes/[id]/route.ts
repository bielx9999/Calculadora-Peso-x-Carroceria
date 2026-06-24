import { deleteSimulation } from "@/lib/repository"

export async function DELETE(_: Request, { params }: RouteContext<"/api/simulacoes/[id]">) {
  const { id } = await params
  const deleted = await deleteSimulation(id)
  return deleted ? Response.json({ success: true }) : Response.json({ error: "Simulacao nao encontrada" }, { status: 404 })
}
