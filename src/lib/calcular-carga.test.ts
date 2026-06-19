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
    const result = calcularCarga([criarItemCarga(demoProducts[1], 1)], [vanderleia, carreta], 150000)
    const names = result.distribuicao.map((allocation) => allocation.veiculo.nome)
    expect(result.quantidade).toBe(5)
    expect(names.filter((name) => name === carreta.nome).length).toBeGreaterThan(0)
    expect(names.filter((name) => name === vanderleia.nome).length).toBeLessThan(5)
  })
})
