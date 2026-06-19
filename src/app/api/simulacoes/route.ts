import { createSimulation, listSimulations } from "@/lib/repository"
import type { Simulation } from "@/types"

export async function GET() {
  try { return Response.json(await listSimulations()) }
  catch { return Response.json({ error: "Nao foi possivel carregar as simulacoes." }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<Simulation, "id" | "criado_em" | "atualizado_em">
    if (!body.nome?.trim() || !body.resultado_json) return Response.json({ error: "Nome e resultado sao obrigatorios." }, { status: 400 })
    return Response.json(await createSimulation(body), { status: 201 })
  } catch { return Response.json({ error: "Nao foi possivel salvar a simulacao." }, { status: 500 }) }
}
