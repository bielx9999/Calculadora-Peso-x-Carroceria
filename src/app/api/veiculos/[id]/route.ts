import { deleteVehicle, updateVehicle } from "@/lib/repository"
import { vehicleSchema } from "@/lib/validations"

export async function PUT(request: Request, { params }: RouteContext<"/api/veiculos/[id]">) {
  const parsed = vehicleSchema.partial().safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Dados invalidos" }, { status: 400 })
  const { id } = await params
  const vehicle = await updateVehicle(id, parsed.data)
  return vehicle ? Response.json(vehicle) : Response.json({ error: "Veiculo nao encontrado" }, { status: 404 })
}

export async function DELETE(_: Request, { params }: RouteContext<"/api/veiculos/[id]">) {
  const { id } = await params
  const deleted = await deleteVehicle(id)
  return deleted ? Response.json({ success: true }) : Response.json({ error: "Veiculo nao encontrado" }, { status: 404 })
}
