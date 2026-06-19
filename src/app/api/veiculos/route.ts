import { createVehicle, listVehicles } from "@/lib/repository"
import { vehicleSchema } from "@/lib/validations"

export async function GET() {
  try { return Response.json(await listVehicles()) }
  catch { return Response.json({ error: "Nao foi possivel carregar os veiculos." }, { status: 500 }) }
}

export async function POST(request: Request) {
  const parsed = vehicleSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Dados invalidos", issues: parsed.error.flatten() }, { status: 400 })
  try { return Response.json(await createVehicle(parsed.data), { status: 201 }) }
  catch { return Response.json({ error: "Nao foi possivel cadastrar o veiculo." }, { status: 500 }) }
}
