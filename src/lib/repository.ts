import "server-only"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { demoProducts, demoSimulations, demoVehicles } from "@/lib/demo-data"
import { getSupabaseServerClient } from "@/lib/supabase"
import type { Product, Simulation, Vehicle } from "@/types"
import type { ProductInput, VehicleInput } from "@/lib/validations"

interface LocalDatabase {
  vehicles: Vehicle[]
  products: Product[]
  simulations: Simulation[]
}

const dataDirectory = path.join(process.cwd(), ".data")
const dataFile = path.join(dataDirectory, "demo-db.json")
let writeQueue: Promise<void> = Promise.resolve()

function initialDatabase(): LocalDatabase {
  return {
    vehicles: structuredClone(demoVehicles),
    products: structuredClone(demoProducts),
    simulations: structuredClone(demoSimulations),
  }
}

async function readLocalDatabase(): Promise<LocalDatabase> {
  try {
    const stored = JSON.parse(await readFile(dataFile, "utf8")) as LocalDatabase
    const hasLegacyFields = stored.vehicles.some((vehicle) => "placa" in vehicle || "altura_m" in vehicle || "volume_m3" in vehicle)
      || stored.products.some((product) => "peso_unitario_kg" in product || "altura_cm" in product || "volume_unitario_m3" in product)
    const normalized = {
      vehicles: stored.vehicles.map((vehicle) => {
        const current = { ...vehicle } as Vehicle & { placa?: string | null; altura_m?: number; volume_m3?: number }
        current.area_m2 = current.comprimento_m * current.largura_m
        delete current.placa
        delete current.altura_m
        delete current.volume_m3
        return current
      }),
      products: stored.products.map((product) => {
        const current = { ...product } as Product & { peso_unitario_kg?: number; altura_cm?: number; volume_unitario_m3?: number }
        current.area_unitaria_m2 = (current.comprimento_cm / 100) * (current.largura_cm / 100)
        delete current.peso_unitario_kg
        delete current.altura_cm
        delete current.volume_unitario_m3
        return current
      }),
      simulations: stored.simulations,
    }
    if (hasLegacyFields) await saveLocalDatabase(normalized)
    return normalized
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    const database = initialDatabase()
    await saveLocalDatabase(database)
    return database
  }
}

async function saveLocalDatabase(database: LocalDatabase) {
  await mkdir(dataDirectory, { recursive: true })
  await writeFile(dataFile, JSON.stringify(database, null, 2), "utf8")
}

async function updateLocalDatabase<T>(update: (database: LocalDatabase) => T): Promise<T> {
  let result!: T
  writeQueue = writeQueue.then(async () => {
    const database = await readLocalDatabase()
    result = update(database)
    await saveLocalDatabase(database)
  })
  await writeQueue
  return result
}

export async function listVehicles(): Promise<Vehicle[]> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return (await readLocalDatabase()).vehicles
  const { data, error } = await supabase.from("veiculos").select("*").order("capacidade_kg")
  if (error) throw error
  return data as Vehicle[]
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.from("veiculos").insert(input).select().single()
    if (error) throw error
    return data as Vehicle
  }
  const vehicle: Vehicle = {
    ...input,
    id: crypto.randomUUID(),
    area_m2: input.comprimento_m * input.largura_m,
    criado_em: new Date().toISOString(),
  }
  return updateLocalDatabase((database) => {
    database.vehicles.unshift(vehicle)
    return vehicle
  })
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle | null> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.from("veiculos").update(input).eq("id", id).select().single()
    if (error) throw error
    return data as Vehicle
  }
  return updateLocalDatabase((database) => {
    const index = database.vehicles.findIndex((item) => item.id === id)
    if (index < 0) return null
    const merged = { ...database.vehicles[index], ...input }
    merged.area_m2 = merged.comprimento_m * merged.largura_m
    database.vehicles[index] = merged
    return merged
  })
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { error } = await supabase.from("veiculos").delete().eq("id", id)
    if (error) throw error
    return true
  }
  return updateLocalDatabase((database) => {
    const index = database.vehicles.findIndex((item) => item.id === id)
    if (index < 0) return false
    database.vehicles.splice(index, 1)
    return true
  })
}

export async function listProducts(): Promise<Product[]> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return (await readLocalDatabase()).products
  const { data, error } = await supabase.from("produtos").select("*").order("nome")
  if (error) throw error
  return data as Product[]
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.from("produtos").insert(input).select().single()
    if (error) throw error
    return data as Product
  }
  const product: Product = {
    ...input,
    sku: input.sku || null,
    obs: input.obs || null,
    id: crypto.randomUUID(),
    area_unitaria_m2: (input.comprimento_cm / 100) * (input.largura_cm / 100),
    criado_em: new Date().toISOString(),
  }
  return updateLocalDatabase((database) => {
    database.products.unshift(product)
    return product
  })
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.from("produtos").update(input).eq("id", id).select().single()
    if (error) throw error
    return data as Product
  }
  return updateLocalDatabase((database) => {
    const index = database.products.findIndex((item) => item.id === id)
    if (index < 0) return null
    const merged = { ...database.products[index], ...input }
    merged.area_unitaria_m2 = (merged.comprimento_cm / 100) * (merged.largura_cm / 100)
    database.products[index] = merged
    return merged
  })
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { error } = await supabase.from("produtos").delete().eq("id", id)
    if (error) throw error
    return true
  }
  return updateLocalDatabase((database) => {
    const index = database.products.findIndex((item) => item.id === id)
    if (index < 0) return false
    database.products.splice(index, 1)
    return true
  })
}

export async function listSimulations(): Promise<Simulation[]> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return (await readLocalDatabase()).simulations
  const { data, error } = await supabase.from("simulacoes").select("*").order("criado_em", { ascending: false })
  if (error) throw error
  return (data || []).map((item) => ({ ...item, numero_veiculos: item.resultado_json?.quantidade || 0 })) as Simulation[]
}

export async function createSimulation(input: Omit<Simulation, "id" | "criado_em" | "atualizado_em">): Promise<Simulation> {
  const now = new Date().toISOString()
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const payload = { nome: input.nome, status: input.status, peso_total_kg: input.peso_total_kg, area_total_m2: input.area_total_m2, resultado_json: input.resultado_json }
    const { data, error } = await supabase.from("simulacoes").insert(payload).select().single()
    if (error) throw error
    return { ...data, numero_veiculos: input.numero_veiculos } as Simulation
  }
  const simulation: Simulation = { ...input, id: crypto.randomUUID(), criado_em: now, atualizado_em: now }
  return updateLocalDatabase((database) => {
    database.simulations.unshift(simulation)
    return simulation
  })
}
