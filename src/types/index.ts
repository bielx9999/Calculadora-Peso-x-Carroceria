export type VehicleType = "fiorino" | "van_furgao" | "van_bau" | "truck" | "carreta" | "vanderleia"
export type ProductType = "peca" | "palete" | "caixa" | "tambor" | "outro"
export type SimulationStatus = "rascunho" | "calculada" | "aprovada"

export interface Vehicle {
  id: string
  nome: string
  tipo: VehicleType
  capacidade_kg: number
  comprimento_m: number
  largura_m: number
  area_m2: number
  ativo: boolean
  criado_em: string
}

export interface Product {
  id: string
  nome: string
  tipo: ProductType
  sku: string | null
  comprimento_cm: number
  largura_cm: number
  altura_cm?: number | null
  area_unitaria_m2: number
  empilhavel: boolean
  limite_empilhamento: number
  fragil: boolean
  obs: string | null
  ativo: boolean
  criado_em: string
}

export interface LoadItem {
  produto: Product
  quantidade: number
  area_total_m2: number
}

export interface LoadPlacement {
  id: string
  produto_id: string
  nome: string
  quantidade: number
  x_m: number
  y_m: number
  comprimento_m: number
  largura_m: number
  altura_unitaria_m?: number
  rotacionado: boolean
}

export interface VehicleAllocation {
  indice: number
  veiculo: Vehicle
  peso_kg: number
  area_m2: number
  ocupacao_peso: number
  ocupacao_area: number
  posicoes: LoadPlacement[]
}

export interface VehicleAlternative {
  veiculo: Vehicle
  compativel: boolean
  motivo: string | null
  quantidade: number
  ocupacao_peso: number
  ocupacao_area: number
  fator_limitante: "PESO" | "AREA"
}

export interface LoadResult {
  visualizacao_versao?: number
  tipo: "unico" | "multiplo"
  veiculo: Vehicle
  quantidade: number
  peso_total_kg: number
  area_total_m2: number
  ocupacao_peso: number
  ocupacao_area: number
  fator_limitante: "PESO" | "AREA"
  distribuicao: VehicleAllocation[]
  alternativas: VehicleAlternative[]
}

export interface Simulation {
  id: string
  nome: string
  status: SimulationStatus
  peso_total_kg: number
  area_total_m2: number
  numero_veiculos: number
  resultado_json: LoadResult
  criado_em: string
  atualizado_em: string
}
