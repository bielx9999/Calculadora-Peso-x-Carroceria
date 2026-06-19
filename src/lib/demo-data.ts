import type { Product, Simulation, Vehicle } from "@/types"

const now = new Date().toISOString()

export const demoVehicles: Vehicle[] = [
  { id: "v1", nome: "Fiorino", tipo: "fiorino", capacidade_kg: 650, comprimento_m: 1.8, largura_m: 1.25, area_m2: 2.25, ativo: true, criado_em: now },
  { id: "v2", nome: "Van Furgão", tipo: "van_furgao", capacidade_kg: 1500, comprimento_m: 3.2, largura_m: 1.7, area_m2: 5.44, ativo: true, criado_em: now },
  { id: "v3", nome: "Van Baú", tipo: "van_bau", capacidade_kg: 1800, comprimento_m: 4.2, largura_m: 2, area_m2: 8.4, ativo: true, criado_em: now },
  { id: "v4", nome: "Truck", tipo: "truck", capacidade_kg: 14000, comprimento_m: 8, largura_m: 2.45, area_m2: 19.6, ativo: true, criado_em: now },
  { id: "v5", nome: "Carreta", tipo: "carreta", capacidade_kg: 27000, comprimento_m: 14, largura_m: 2.48, area_m2: 34.72, ativo: true, criado_em: now },
  { id: "v6", nome: "Vanderleia", tipo: "vanderleia", capacidade_kg: 32000, comprimento_m: 14.8, largura_m: 2.48, area_m2: 36.7, ativo: true, criado_em: now },
]

export const demoProducts: Product[] = [
  { id: "p1", nome: "Palete de bebidas", tipo: "palete", sku: "PAL-BEB-01", comprimento_cm: 120, largura_cm: 100, area_unitaria_m2: 1.2, empilhavel: false, limite_empilhamento: 1, fragil: false, obs: null, ativo: true, criado_em: now },
  { id: "p2", nome: "Caixa de componentes", tipo: "caixa", sku: "CXP-204", comprimento_cm: 60, largura_cm: 40, area_unitaria_m2: 0.24, empilhavel: true, limite_empilhamento: 4, fragil: false, obs: null, ativo: true, criado_em: now },
  { id: "p3", nome: "Tambor industrial", tipo: "tambor", sku: "TAM-200L", comprimento_cm: 60, largura_cm: 60, area_unitaria_m2: 0.36, empilhavel: false, limite_empilhamento: 1, fragil: false, obs: "Manter na vertical", ativo: true, criado_em: now },
  { id: "p4", nome: "Peca usinada", tipo: "peca", sku: "PEC-A90", comprimento_cm: 90, largura_cm: 40, area_unitaria_m2: 0.36, empilhavel: true, limite_empilhamento: 2, fragil: true, obs: "Proteger contra impacto", ativo: true, criado_em: now },
  { id: "p5", nome: "Caixa de eletronicos", tipo: "caixa", sku: "ELT-480", comprimento_cm: 55, largura_cm: 38, area_unitaria_m2: 0.209, empilhavel: true, limite_empilhamento: 3, fragil: true, obs: null, ativo: true, criado_em: now },
]

export const demoSimulations: Simulation[] = []
