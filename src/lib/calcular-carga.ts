import type { LoadItem, LoadPlacement, LoadResult, Product, Vehicle, VehicleAllocation, VehicleAlternative } from "@/types"

const round = (value: number, digits = 2) => Number(value.toFixed(digits))
const PRODUCT_GAP_M = 0.02

interface FloorUnit {
  id: string
  product: Product
  quantity: number
  length: number
  width: number
}

interface PackingBin {
  placements: LoadPlacement[]
  occupiedArea: number
  rowX: number
  usedWidth: number
  rowLength: number
}

interface PlacementCandidate {
  length: number
  width: number
  rotated: boolean
  newRow: boolean
}

function createFloorUnits(items: LoadItem[]): FloorUnit[] {
  return items.flatMap((item) => {
    const stackLimit = item.produto.empilhavel ? Math.max(item.produto.limite_empilhamento, 1) : 1
    const stackCount = Math.ceil(item.quantidade / stackLimit)
    return Array.from({ length: stackCount }, (_, index) => ({
      id: `${item.produto.id}-${index + 1}`,
      product: item.produto,
      quantity: Math.min(stackLimit, item.quantidade - index * stackLimit),
      length: item.produto.comprimento_cm / 100,
      width: item.produto.largura_cm / 100,
    }))
  }).sort((a, b) => b.length * b.width - a.length * a.width || Math.max(b.length, b.width) - Math.max(a.length, a.width))
}

function createBin(): PackingBin {
  return {
    placements: [],
    occupiedArea: 0,
    rowX: 0,
    usedWidth: 0,
    rowLength: 0,
  }
}

function findCandidate(unit: FloorUnit, bin: PackingBin, vehicle: Vehicle): PlacementCandidate | null {
  const orientations = [
    { length: unit.length, width: unit.width, rotated: false },
    { length: unit.width, width: unit.length, rotated: true },
  ]
  const currentRow = orientations
    .filter((orientation) => bin.usedWidth + (bin.usedWidth > 0 ? PRODUCT_GAP_M : 0) + orientation.width <= vehicle.largura_m + 0.001
      && bin.rowX + Math.max(bin.rowLength, orientation.length) <= vehicle.comprimento_m + 0.001)
    .map((orientation) => ({ ...orientation, newRow: false }))
  if (currentRow.length) return currentRow[0]

  const nextRowX = bin.rowX + bin.rowLength + (bin.rowLength > 0 ? PRODUCT_GAP_M : 0)
  const nextRow = orientations
    .filter((orientation) => orientation.width <= vehicle.largura_m + 0.001
      && nextRowX + orientation.length <= vehicle.comprimento_m + 0.001)
    .map((orientation) => ({ ...orientation, newRow: true }))
  return nextRow[0] || null
}

function placeUnit(unit: FloorUnit, bin: PackingBin, candidate: PlacementCandidate) {
  if (candidate.newRow) {
    bin.rowX += bin.rowLength + (bin.rowLength > 0 ? PRODUCT_GAP_M : 0)
    bin.usedWidth = 0
    bin.rowLength = 0
  }
  const positionY = bin.usedWidth + (bin.usedWidth > 0 ? PRODUCT_GAP_M : 0)
  bin.placements.push({
    id: unit.id,
    produto_id: unit.product.id,
    nome: unit.product.nome,
    quantidade: unit.quantity,
    x_m: round(bin.rowX, 3),
    y_m: round(positionY, 3),
    comprimento_m: round(candidate.length, 3),
    largura_m: round(candidate.width, 3),
    rotacionado: candidate.rotated,
  })
  bin.occupiedArea += candidate.length * candidate.width
  bin.usedWidth = positionY + candidate.width
  bin.rowLength = Math.max(bin.rowLength, candidate.length)
}

function packUnits(units: FloorUnit[], vehicle: Vehicle, minimumBins: number): PackingBin[] | null {
  if (units.some((unit) => !findCandidate(unit, createBin(), vehicle))) return null
  const bins = Array.from({ length: minimumBins }, () => createBin())

  for (const unit of units) {
    const binOrder = bins.map((bin, index) => ({ bin, index })).sort((a, b) => a.bin.occupiedArea - b.bin.occupiedArea)
    let placed = false
    for (const { bin } of binOrder) {
      const candidate = findCandidate(unit, bin, vehicle)
      if (!candidate) continue
      placeUnit(unit, bin, candidate)
      placed = true
      break
    }
    if (!placed) {
      const bin = createBin()
      const candidate = findCandidate(unit, bin, vehicle)
      if (!candidate) return null
      placeUnit(unit, bin, candidate)
      bins.push(bin)
    }
  }
  return bins
}

function buildVehiclePlan(units: FloorUnit[], vehicle: Vehicle, totalWeight: number, totalArea: number) {
  const minimumByWeight = Math.ceil(totalWeight / vehicle.capacidade_kg)
  const bins = packUnits(units, vehicle, minimumByWeight)
  if (!bins) {
    const alternative: VehicleAlternative = {
      veiculo: vehicle,
      compativel: false,
      motivo: "Um ou mais itens não cabem nas dimensões da carroceria",
      quantidade: 0,
      ocupacao_peso: 0,
      ocupacao_area: 0,
      fator_limitante: "AREA",
    }
    return { alternative, bins: [] }
  }

  const quantity = bins.length
  const weightOccupancy = (totalWeight / quantity / vehicle.capacidade_kg) * 100
  const areaOccupancy = (totalArea / quantity / vehicle.area_m2) * 100
  const alternative: VehicleAlternative = {
    veiculo: vehicle,
    compativel: true,
    motivo: null,
    quantidade: quantity,
    ocupacao_peso: round(weightOccupancy),
    ocupacao_area: round(areaOccupancy),
    fator_limitante: quantity > minimumByWeight || areaOccupancy > weightOccupancy ? "AREA" : "PESO",
  }
  return { alternative, bins }
}

interface FleetBin extends PackingBin {
  vehicle: Vehicle
}

function vehicleCombinations(vehicles: Vehicle[], count: number, start = 0, current: Vehicle[] = [], output: Vehicle[][] = []) {
  if (current.length === count) {
    output.push([...current])
    return output
  }
  for (let index = start; index < vehicles.length; index += 1) {
    current.push(vehicles[index])
    vehicleCombinations(vehicles, count, index, current, output)
    current.pop()
  }
  return output
}

function packMixedFleet(units: FloorUnit[], fleet: Vehicle[]): FleetBin[] | null {
  const bins: FleetBin[] = [...fleet]
    .sort((a, b) => b.capacidade_kg - a.capacidade_kg || b.area_m2 - a.area_m2)
    .map((vehicle) => ({ ...createBin(), vehicle }))

  for (const unit of units) {
    let placed = false
    for (const bin of bins) {
      const candidate = findCandidate(unit, bin, bin.vehicle)
      if (!candidate) continue
      placeUnit(unit, bin, candidate)
      placed = true
      break
    }
    if (!placed) return null
  }
  return bins
}

function findMixedPlan(units: FloorUnit[], activeVehicles: Vehicle[], totalWeight: number, totalArea: number, maximumCount: number) {
  const uniqueTypes = Array.from(new Map(activeVehicles.map((vehicle) => [vehicle.tipo, vehicle])).values())
  const largestCapacity = Math.max(...uniqueTypes.map((vehicle) => vehicle.capacidade_kg))
  const largestArea = Math.max(...uniqueTypes.map((vehicle) => vehicle.area_m2))
  const minimumCount = Math.max(Math.ceil(totalWeight / largestCapacity), Math.ceil(totalArea / largestArea), 1)
  const searchLimit = Math.min(maximumCount, 12)

  for (let count = minimumCount; count <= searchLimit; count += 1) {
    let best: { bins: FleetBin[]; score: number } | null = null
    for (const combination of vehicleCombinations(uniqueTypes, count)) {
      const totalCapacity = combination.reduce((sum, vehicle) => sum + vehicle.capacidade_kg, 0)
      const totalFloorArea = combination.reduce((sum, vehicle) => sum + vehicle.area_m2, 0)
      if (totalCapacity < totalWeight || totalFloorArea < totalArea) continue
      const bins = packMixedFleet(units, combination)
      if (!bins) continue
      const score = totalCapacity / largestCapacity + totalFloorArea / largestArea
      if (!best || score < best.score) best = { bins, score }
    }
    if (best) return best.bins
  }
  return null
}

export function calcularCarga(items: LoadItem[], vehicles: Vehicle[], totalWeight: number): LoadResult {
  if (!items.length) throw new Error("Adicione ao menos um item para calcular a carga.")
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) throw new Error("Informe o peso total da carga.")

  const validVehicles = vehicles.filter((vehicle) => vehicle.capacidade_kg > 0 && vehicle.area_m2 > 0)
  const totalArea = items.reduce((total, item) => total + item.area_total_m2, 0)
  const units = createFloorUnits(items)
  const plans = validVehicles
    .map((vehicle) => buildVehiclePlan(units, vehicle, totalWeight, totalArea))
    .sort((a, b) => a.alternative.veiculo.area_m2 - b.alternative.veiculo.area_m2)

  const available = plans
    .filter(({ alternative }) => alternative.veiculo.ativo && alternative.compativel)
    .sort((a, b) => a.alternative.quantidade - b.alternative.quantidade || a.alternative.veiculo.area_m2 - b.alternative.veiculo.area_m2)
  if (!available.length) throw new Error("Nenhuma carroceria ativa comporta as dimensões dos itens.")

  const suggested = available[0]
  const activeVehicles = validVehicles.filter((vehicle) => vehicle.ativo)
  const mixedBins = findMixedPlan(units, activeVehicles, totalWeight, totalArea, suggested.alternative.quantidade)
  const selectedBins: FleetBin[] = mixedBins || suggested.bins.map((bin) => ({ ...bin, vehicle: suggested.alternative.veiculo }))
  const fleetCapacity = selectedBins.reduce((sum, bin) => sum + bin.vehicle.capacidade_kg, 0)
  const fleetArea = selectedBins.reduce((sum, bin) => sum + bin.vehicle.area_m2, 0)
  const weightOccupancy = (totalWeight / fleetCapacity) * 100
  const areaOccupancy = (totalArea / fleetArea) * 100
  const distribution: VehicleAllocation[] = selectedBins.map((bin, index) => {
    const allocatedWeight = totalWeight * (bin.vehicle.capacidade_kg / fleetCapacity)
    return {
    indice: index + 1,
    veiculo: bin.vehicle,
    peso_kg: round(allocatedWeight),
    area_m2: round(bin.occupiedArea, 3),
    ocupacao_peso: round((allocatedWeight / bin.vehicle.capacidade_kg) * 100),
    ocupacao_area: round((bin.occupiedArea / bin.vehicle.area_m2) * 100),
    posicoes: bin.placements,
  }})

  return {
    tipo: selectedBins.length === 1 ? "unico" : "multiplo",
    veiculo: selectedBins[0].vehicle,
    quantidade: selectedBins.length,
    peso_total_kg: round(totalWeight),
    area_total_m2: round(totalArea, 3),
    ocupacao_peso: round(weightOccupancy),
    ocupacao_area: round(areaOccupancy),
    fator_limitante: areaOccupancy > weightOccupancy ? "AREA" : "PESO",
    distribuicao: distribution,
    alternativas: plans.map(({ alternative }) => alternative),
  }
}

export function criarItemCarga(produto: LoadItem["produto"], quantidade: number): LoadItem {
  const floorUnits = produto.empilhavel ? Math.ceil(quantidade / Math.max(produto.limite_empilhamento, 1)) : quantidade
  return { produto, quantidade, area_total_m2: round(produto.area_unitaria_m2 * floorUnits, 3) }
}
