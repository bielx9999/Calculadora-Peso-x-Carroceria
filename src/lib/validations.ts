import { z } from "zod"

const positive = z.coerce.number().positive("Informe um valor maior que zero")

export const vehicleSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  tipo: z.enum(["fiorino", "van_furgao", "van_bau", "truck", "carreta", "vanderleia"]),
  capacidade_kg: positive,
  comprimento_m: positive,
  largura_m: positive,
  ativo: z.boolean().default(true),
})

export const productSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  tipo: z.enum(["peca", "palete", "caixa", "tambor", "outro"]),
  sku: z.string().trim().nullable().optional(),
  comprimento_cm: positive,
  largura_cm: positive,
  altura_cm: positive.nullish(),
  empilhavel: z.boolean().default(false),
  limite_empilhamento: z.coerce.number().int().min(1).default(1),
  fragil: z.boolean().default(false),
  obs: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
})

export const calculationSchema = z.object({
  itens: z.array(z.object({ produto_id: z.string(), quantidade: z.number().int().positive() })).min(1),
  peso_total_kg: positive,
  direcao_distribuicao: z.enum(["lado_a_lado", "horizontal"]).default("lado_a_lado"),
})

export type VehicleInput = z.infer<typeof vehicleSchema>
export type ProductInput = z.infer<typeof productSchema>
