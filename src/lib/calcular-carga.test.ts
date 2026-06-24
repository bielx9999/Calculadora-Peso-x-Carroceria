import { describe, expect, it } from "vitest"
import { calcularCarga, criarItemCarga } from "./calcular-carga"
import { demoProducts, demoVehicles } from "./demo-data"

describe("calcularCarga", () => {
  it("seleciona o menor veiculo que comporta peso e area", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[1], 10)], demoVehicles, 320)
    expect(result.tipo).toBe("unico")
    expect(result.veiculo.id).toBe("v1")
    expect(result.quantidade).toBe(1)
  })

  it("calcula multiplos veiculos pelo fator mais restritivo", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[0], 80)], demoVehicles, 65600)
    expect(result.tipo).toBe("multiplo")
    expect(result.quantidade).toBe(4)
    expect(result.fator_limitante).toBe("AREA")
    expect(result.distribuicao).toHaveLength(4)
  })

  it("rejeita uma carga vazia", () => {
    expect(() => calcularCarga([], demoVehicles, 100)).toThrow(/ao menos um item/i)
  })

  it("usa o peso total informado pelo cliente", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[1], 1)], demoVehicles, 1200)
    expect(result.peso_total_kg).toBe(1200)
    expect(result.veiculo.id).toBe("v2")
  })

  it("gera posicoes ilustrativas dentro dos limites do veiculo", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[1], 10)], demoVehicles, 320)
    const placements = result.distribuicao.flatMap((allocation) => allocation.posicoes)
    expect(placements.reduce((total, placement) => total + placement.quantidade, 0)).toBe(10)
    expect(placements.every((placement) => placement.x_m + placement.comprimento_m <= result.veiculo.comprimento_m + 0.001)).toBe(true)
    expect(placements.every((placement) => placement.y_m + placement.largura_m <= result.veiculo.largura_m + 0.001)).toBe(true)
    expect(result.alternativas).toHaveLength(demoVehicles.length)
  })

  it("preenche a largura antes de iniciar uma nova fileira", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[2], 3)], demoVehicles, 100)
    const positions = result.distribuicao[0].posicoes
    expect(positions[0]).toMatchObject({ x_m: 0, y_m: 0 })
    expect(positions[1]).toMatchObject({ x_m: 0, y_m: 0.62 })
    expect(positions[2]).toMatchObject({ x_m: 0.62, y_m: 0 })
  })

  it("permite distribuir na horizontal um atras do outro", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[2], 3)], [demoVehicles[3]], 100, "horizontal")
    const positions = result.distribuicao[0].posicoes
    expect(positions[0]).toMatchObject({ x_m: 0, y_m: 0 })
    expect(positions[1]).toMatchObject({ x_m: 0.62, y_m: 0 })
    expect(positions[2]).toMatchObject({ x_m: 1.24, y_m: 0 })
  })

  it("mantem dois paletes de 1,40 x 1,00 lado a lado em 2,40 m", () => {
    const pallet = { ...demoProducts[0], comprimento_cm: 140, largura_cm: 100, area_unitaria_m2: 1.4 }
    const truck = { ...demoVehicles[3], largura_m: 2.4, area_m2: demoVehicles[3].comprimento_m * 2.4 }
    const result = calcularCarga([criarItemCarga(pallet, 2)], [truck], 1000)
    expect(result.distribuicao[0].posicoes).toMatchObject([
      { x_m: 0, y_m: 0, comprimento_m: 1.4, largura_m: 1, rotacionado: false },
      { x_m: 0, y_m: 1.02, comprimento_m: 1.4, largura_m: 1, rotacionado: false },
    ])
  })

  it("mantem dois centimetros entre produtos e fileiras", () => {
    const result = calcularCarga([criarItemCarga(demoProducts[2], 3)], demoVehicles, 100)
    const [first, second, third] = result.distribuicao[0].posicoes
    expect(second.y_m - (first.y_m + first.largura_m)).toBeCloseTo(0.02, 3)
    expect(third.x_m - (first.x_m + first.comprimento_m)).toBeCloseTo(0.02, 3)
  })

  it("combina carrocerias menores no restante da carga", () => {
    const vanderleia = { ...demoVehicles[5], id: "vanderleia-teste", ativo: true, capacidade_kg: 34000 }
    const carreta = { ...demoVehicles[4], id: "carreta-teste", ativo: true, capacidade_kg: 25000 }
    const result = calcularCarga([criarItemCarga(demoProducts[1], 150)], [vanderleia, carreta], 150000)
    const names = result.distribuicao.map((allocation) => allocation.veiculo.nome)
    expect(result.quantidade).toBe(5)
    expect(names.filter((name) => name === carreta.nome).length).toBeGreaterThan(0)
    expect(names.filter((name) => name === vanderleia.nome).length).toBeLessThan(5)
  })

  it("prefere duas carretas em vez de misturar truck e vanderleia quando atende a carga", () => {
    const vehicles = [
      { ...demoVehicles[3], id: "truck-teste", nome: "Truck", tipo: "truck" as const, capacidade_kg: 14000, comprimento_m: 8, largura_m: 2.4, area_m2: 19.2 },
      { ...demoVehicles[4], id: "carreta-teste", nome: "Carreta", tipo: "carreta" as const, capacidade_kg: 26000, comprimento_m: 12.4, largura_m: 2.4, area_m2: 29.76 },
      { ...demoVehicles[5], id: "vanderleia-teste", nome: "Vanderleia", tipo: "vanderleia" as const, capacidade_kg: 34000, comprimento_m: 14, largura_m: 2.4, area_m2: 33.6 },
    ]
    const rodas = { ...demoProducts[0], id: "rodas-teste", nome: "rodas", tipo: "outro" as const, comprimento_cm: 100, largura_cm: 93, area_unitaria_m2: 0.93, empilhavel: false, limite_empilhamento: 1 }
    const result = calcularCarga([criarItemCarga(rodas, 26)], vehicles, 47000)

    expect(result.quantidade).toBe(2)
    expect(result.distribuicao.every((allocation) => allocation.veiculo.id === "carreta-teste")).toBe(true)
    expect(result.distribuicao.every((allocation) => allocation.peso_kg <= allocation.veiculo.capacidade_kg)).toBe(true)
    expect(result.distribuicao.reduce((total, allocation) => total + allocation.peso_kg, 0)).toBeCloseTo(47000, 1)
  })

  it("prioriza a menor quantidade antes da capacidade excedente", () => {
    const pequeno = { ...demoVehicles[3], id: "pequeno", tipo: "truck" as const, capacidade_kg: 10000, area_m2: 19.6 }
    const grande = { ...demoVehicles[5], id: "grande", tipo: "vanderleia" as const, capacidade_kg: 30000, area_m2: 36.7 }
    const produto = { ...demoProducts[1], empilhavel: false, limite_empilhamento: 1 }
    const result = calcularCarga([criarItemCarga(produto, 2)], [pequeno, grande], 59000)
    expect(result.quantidade).toBe(2)
    expect(result.distribuicao.every((allocation) => allocation.veiculo.id === grande.id)).toBe(true)
  })

  it("nao limita a otimizacao a doze veiculos", () => {
    const grande = { ...demoVehicles[5], capacidade_kg: 1000 }
    const produto = { ...demoProducts[1], empilhavel: false, limite_empilhamento: 1 }
    const result = calcularCarga([criarItemCarga(produto, 13)], [grande], 13000)
    expect(result.quantidade).toBe(13)
  })

  it("combina formatos complementares quando nenhum tipo atende sozinho", () => {
    const longo = { ...demoVehicles[3], id: "longo", tipo: "truck" as const, capacidade_kg: 1000, comprimento_m: 3, largura_m: 1, area_m2: 3 }
    const largo = { ...demoVehicles[4], id: "largo", tipo: "carreta" as const, capacidade_kg: 1000, comprimento_m: 2, largura_m: 2, area_m2: 4 }
    const produtoLongo = { ...demoProducts[0], id: "produto-longo", comprimento_cm: 300, largura_cm: 100, area_unitaria_m2: 3 }
    const produtoLargo = { ...demoProducts[1], id: "produto-largo", comprimento_cm: 200, largura_cm: 200, area_unitaria_m2: 4, empilhavel: false }
    const result = calcularCarga([criarItemCarga(produtoLongo, 1), criarItemCarga(produtoLargo, 1)], [longo, largo], 1000)
    expect(result.quantidade).toBe(2)
    expect(new Set(result.distribuicao.map((allocation) => allocation.veiculo.id))).toEqual(new Set([longo.id, largo.id]))
  })

  it("calcula e posiciona produtos pelo limite de empilhamento", () => {
    const produto = { ...demoProducts[0], empilhavel: true, limite_empilhamento: 3 }
    const item = criarItemCarga(produto, 7)
    const result = calcularCarga([item], demoVehicles, 500)
    const positions = result.distribuicao.flatMap((allocation) => allocation.posicoes)
    expect(item.area_total_m2).toBeCloseTo(produto.area_unitaria_m2 * 3, 3)
    expect(positions).toHaveLength(3)
    expect(positions.map((position) => position.quantidade)).toEqual([3, 3, 1])
  })
})
