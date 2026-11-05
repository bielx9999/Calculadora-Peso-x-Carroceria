import type { LoadItem, LoadPlacement, LoadResult, Product, Vehicle, VehicleAllocation, VehicleAlternative } from "@/types"

const round = (value: number, digits = 2) => Number(value.toFixed(digits))
const PRODUCT_GAP_M = 0.02
type DistributionDirection = "lado_a_lado" | "horizontal"

interface FloorUnit {
  id: string
  product: Product
  quantity: number
  weightKg: number
  length: number
  width: number
}

interface PackingBin {
  placements: LoadPlacement[]
  occupiedArea: number
  occupiedWeight: number
  rowX: number
  usedWidth: number
  rowLength: number
  laneY: number
  usedLength: number
  laneWidth: number
}

interface PlacementCandidate {
  length: number
  width: number
  rotated: boolean
  newRow: boolean
  score: number
}

function createFloorUnits(items: LoadItem[], totalWeight: number): FloorUnit[] {
  const totalQuantity = items.reduce((total, item) => total + item.quantidade, 0)
  const unitWeight = totalWeight / totalQuantity
  return items.flatMap((item) => {
    const stackLimit = item.produto.empilhavel ? Math.max(item.produto.limite_empilhamento, 1) : 1
    const stackCount = Math.ceil(item.quantidade / stackLimit)
    const stackQuantity = (index: number) => Math.min(stackLimit, item.quantidade - index * stackLimit)
    return Array.from({ length: stackCount }, (_, index) => ({
      id: `${item.produto.id}-${index + 1}`,
      product: item.produto,
      quantity: stackQuantity(index),
      weightKg: stackQuantity(index) * unitWeight,
      length: item.produto.comprimento_cm / 100,
      width: item.produto.largura_cm / 100,
    }))
  }).sort((a, b) => b.length * b.width - a.length * a.width || Math.max(b.length, b.width) - Math.max(a.length, a.width))
}

function createBin(): PackingBin {
  return {
    placements: [],
    occupiedArea: 0,
    occupiedWeight: 0,
    rowX: 0,
    usedWidth: 0,
    rowLength: 0,
    laneY: 0,
    usedLength: 0,
    laneWidth: 0,
  }
}

function findSideBySideCandidate(unit: FloorUnit, bin: PackingBin, vehicle: Vehicle): PlacementCandidate | null {
  const orientations = [
    { length: unit.length, width: unit.width, rotated: false },
    { length: unit.width, width: unit.length, rotated: true },
  ]
  const currentRow = orientations
    .filter((orientation) => bin.usedWidth + (bin.usedWidth > 0 ? PRODUCT_GAP_M : 0) + orientation.width <= vehicle.largura_m + 0.001
      && bin.rowX + Math.max(bin.rowLength, orientation.length) <= vehicle.comprimento_m + 0.001)
    .map((orientation) => {
      const nextUsedWidth = bin.usedWidth + (bin.usedWidth > 0 ? PRODUCT_GAP_M : 0) + orientation.width
      const nextRowLength = Math.max(bin.rowLength, orientation.length)
      const widthWaste = vehicle.largura_m - nextUsedWidth
      const lengthGrowth = nextRowLength - bin.rowLength
      return { ...orientation, newRow: false, score: widthWaste * 4 + lengthGrowth + Number(orientation.rotated) * 2 }
    })
    .sort((a, b) => a.score - b.score)
  if (currentRow.length) return currentRow[0]

  const nextRowX = bin.rowX + bin.rowLength + (bin.rowLength > 0 ? PRODUCT_GAP_M : 0)
  const nextRow = orientations
    .filter((orientation) => orientation.width <= vehicle.largura_m + 0.001
      && nextRowX + orientation.length <= vehicle.comprimento_m + 0.001)
    .map((orientation) => {
      const widthWaste = vehicle.largura_m - orientation.width
      const remainingLength = vehicle.comprimento_m - (nextRowX + orientation.length)
      return { ...orientation, newRow: true, score: 100 + widthWaste * 4 + remainingLength + Number(orientation.rotated) * 2 }
    })
    .sort((a, b) => a.score - b.score)
  return nextRow[0] || null
}

function findHorizontalCandidate(unit: FloorUnit, bin: PackingBin, vehicle: Vehicle): PlacementCandidate | null {
  const orientations = [
    { length: unit.length, width: unit.width, rotated: false },
    { length: unit.width, width: unit.length, rotated: true },
  ]
  const currentLane = orientations
    .filter((orientation) => bin.usedLength + (bin.usedLength > 0 ? PRODUCT_GAP_M : 0) + orientation.length <= vehicle.comprimento_m + 0.001
      && bin.laneY + Math.max(bin.laneWidth, orientation.width) <= vehicle.largura_m + 0.001)
    .map((orientation) => {
      const nextUsedLength = bin.usedLength + (bin.usedLength > 0 ? PRODUCT_GAP_M : 0) + orientation.length
      const nextLaneWidth = Math.max(bin.laneWidth, orientation.width)
      const lengthWaste = vehicle.comprimento_m - nextUsedLength
      const widthGrowth = nextLaneWidth - bin.laneWidth
      return { ...orientation, newRow: false, score: lengthWaste * 4 + widthGrowth + Number(orientation.rotated) * 2 }
    })
    .sort((a, b) => a.score - b.score)
  if (currentLane.length) return currentLane[0]

  const nextLaneY = bin.laneY + bin.laneWidth + (bin.laneWidth > 0 ? PRODUCT_GAP_M : 0)
  const nextLane = orientations
    .filter((orientation) => orientation.length <= vehicle.comprimento_m + 0.001
      && nextLaneY + orientation.width <= vehicle.largura_m + 0.001)
    .map((orientation) => {
      const lengthWaste = vehicle.comprimento_m - orientation.length
      const remainingWidth = vehicle.largura_m - (nextLaneY + orientation.width)
      return { ...orientation, newRow: true, score: 100 + lengthWaste * 4 + remainingWidth + Number(orientation.rotated) * 2 }
    })
    .sort((a, b) => a.score - b.score)
  return nextLane[0] || null
}

function findCandidate(unit: FloorUnit, bin: PackingBin, vehicle: Vehicle, direction: DistributionDirection): PlacementCandidate | null {
  return direction === "horizontal"
    ? findHorizontalCandidate(unit, bin, vehicle)
    : findSideBySideCandidate(unit, bin, vehicle)
}

function placeUnit(unit: FloorUnit, bin: PackingBin, candidate: PlacementCandidate, direction: DistributionDirection) {
  const unitHeight = unit.product.altura_cm
  const dimensions = {
    comprimento_m: round(candidate.length, 3),
    largura_m: round(candidate.width, 3),
    ...(unitHeight && unitHeight > 0 ? { altura_unitaria_m: unitHeight / 100 } : {}),
    rotacionado: candidate.rotated,
  }

  if (direction === "horizontal") {
    if (candidate.newRow) {
      bin.laneY += bin.laneWidth + (bin.laneWidth > 0 ? PRODUCT_GAP_M : 0)
      bin.usedLength = 0
      bin.laneWidth = 0
    }
    const positionX = bin.usedLength + (bin.usedLength > 0 ? PRODUCT_GAP_M : 0)
    bin.placements.push({
      id: unit.id,
      produto_id: unit.product.id,
      nome: unit.product.nome,
      quantidade: unit.quantity,
      x_m: round(positionX, 3),
      y_m: round(bin.laneY, 3),
      ...dimensions,
    })
    bin.occupiedArea += candidate.length * candidate.width
    bin.occupiedWeight += unit.weightKg
    bin.usedLength = positionX + candidate.length
    bin.laneWidth = Math.max(bin.laneWidth, candidate.width)
    return
  }

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
    ...dimensions,
  })
  bin.occupiedArea += candidate.length * candidate.width
  bin.occupiedWeight += unit.weightKg
  bin.usedWidth = positionY + candidate.width
  bin.rowLength = Math.max(bin.rowLength, candidate.length)
}

function packUnitsInFixedBins(units: FloorUnit[], vehicle: Vehicle, count: number, direction: DistributionDirection): PackingBin[] | null {
  if (units.some((unit) => unit.weightKg > vehicle.capacidade_kg + 0.001 || !findCandidate(unit, createBin(), vehicle, direction))) return null
  const bins = Array.from({ length: count }, () => createBin())

  for (const unit of units) {
    const options = bins.flatMap((bin, index) => {
      const candidate = findCandidate(unit, bin, vehicle, direction)
      return candidate && bin.occupiedWeight + unit.weightKg <= vehicle.capacidade_kg + 0.001 ? [{ bin, index, candidate }] : []
    }).sort((a, b) => a.candidate.score - b.candidate.score
      || b.bin.occupiedArea - a.bin.occupiedArea
      || a.index - b.index)
    if (!options.length) return null
    placeUnit(unit, options[0].bin, options[0].candidate, direction)
  }
  return bins
}

function packUnits(units: FloorUnit[], vehicle: Vehicle, minimumBins: number, direction: DistributionDirection): PackingBin[] | null {
  const maximumBins = Math.max(minimumBins, units.length)
  for (let count = minimumBins; count <= maximumBins; count += 1) {
    const bins = packUnitsInFixedBins(units, vehicle, count, direction)
    if (bins) return bins
  }
  return null
}

function buildVehiclePlan(units: FloorUnit[], vehicle: Vehicle, totalWeight: number, totalArea: number, direction: DistributionDirection) {
  const minimumByWeight = Math.ceil(totalWeight / vehicle.capacidade_kg)
  const bins = packUnits(units, vehicle, minimumByWeight, direction)
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

function* vehicleCombinations(vehicles: Vehicle[], count: number, start = 0, current: Vehicle[] = []): Generator<Vehicle[]> {
  if (current.length === count) {
    yield [...current]
    return
  }
  for (let index = start; index < vehicles.length; index += 1) {
    current.push(vehicles[index])
    yield* vehicleCombinations(vehicles, count, index, current)
    current.pop()
  }
}

function packMixedFleet(units: FloorUnit[], fleet: Vehicle[], direction: DistributionDirection): FleetBin[] | null {
  const bins: FleetBin[] = [...fleet]
    .sort((a, b) => a.area_m2 - b.area_m2 || a.capacidade_kg - b.capacidade_kg)
    .map((vehicle) => ({ ...createBin(), vehicle }))

  for (const unit of units) {
    const options = bins.flatMap((bin, index) => {
      const candidate = findCandidate(unit, bin, bin.vehicle, direction)
      if (!candidate) return []
      if (bin.occupiedWeight + unit.weightKg > bin.vehicle.capacidade_kg + 0.001) return []
      const vehicleWaste = (bin.vehicle.area_m2 - unit.length * unit.width) / Math.max(bin.vehicle.area_m2, 1)
      const unusedBinPenalty = bin.placements.length ? 0 : 0.2
      return [{ bin, index, candidate, score: candidate.score + vehicleWaste + unusedBinPenalty }]
    }).sort((a, b) => a.score - b.score
      || a.bin.vehicle.area_m2 - b.bin.vehicle.area_m2
      || a.index - b.index)
    if (!options.length) return null
    placeUnit(unit, options[0].bin, options[0].candidate, direction)
  }
  return bins
}

function calculatePlanScore(bins: FleetBin[], totalWeight: number, totalArea: number, largestCapacity: number, largestArea: number) {
  const totalCapacity = bins.reduce((sum, bin) => sum + bin.vehicle.capacidade_kg, 0)
  const totalFloorArea = bins.reduce((sum, bin) => sum + bin.vehicle.area_m2, 0)
  const emptyBins = bins.filter((bin) => !bin.placements.length).length
  const occupiedBins = bins.filter((bin) => bin.placements.length)
  const distinctVehicles = new Set(bins.map((bin) => bin.vehicle.id)).size
  const averageAreaOccupancy = occupiedBins.length
    ? occupiedBins.reduce((sum, bin) => sum + bin.occupiedArea / bin.vehicle.area_m2, 0) / occupiedBins.length
    : 0
  const capacityWaste = (totalCapacity - totalWeight) / largestCapacity
  const areaWaste = (totalFloorArea - totalArea) / largestArea
  const vehicleCost = bins.reduce((sum, bin) => sum + (bin.vehicle.capacidade_kg / largestCapacity) + (bin.vehicle.area_m2 / largestArea), 0)
  return emptyBins * 1000
    + (distinctVehicles - 1) * 2.5
    + capacityWaste * 10
    + areaWaste * 4
    + vehicleCost
    - averageAreaOccupancy
}

function findMixedPlan(units: FloorUnit[], activeVehicles: Vehicle[], totalWeight: number, totalArea: number, maximumCount: number, direction: DistributionDirection) {
  const vehicleOptions = activeVehicles
    .sort((a, b) => b.capacidade_kg - a.capacidade_kg || b.area_m2 - a.area_m2)
  const largestCapacity = Math.max(...vehicleOptions.map((vehicle) => vehicle.capacidade_kg))
  const largestArea = Math.max(...vehicleOptions.map((vehicle) => vehicle.area_m2))
  const minimumCount = Math.max(Math.ceil(totalWeight / largestCapacity), Math.ceil(totalArea / largestArea), 1)

  for (let count = minimumCount; count <= maximumCount; count += 1) {
    let best: { bins: FleetBin[]; score: number } | null = null
    for (const combination of vehicleCombinations(vehicleOptions, count)) {
      const totalCapacity = combination.reduce((sum, vehicle) => sum + vehicle.capacidade_kg, 0)
      const totalFloorArea = combination.reduce((sum, vehicle) => sum + vehicle.area_m2, 0)
      if (totalCapacity < totalWeight || totalFloorArea < totalArea) continue
      const bins = packMixedFleet(units, combination, direction)
      if (!bins) continue
      const score = calculatePlanScore(bins, totalWeight, totalArea, largestCapacity, largestArea)
      if (!best || score < best.score) best = { bins, score }
    }
    if (best) return best.bins
  }
  return null
}

export function calcularCarga(items: LoadItem[], vehicles: Vehicle[], totalWeight: number, direction: DistributionDirection = "lado_a_lado"): LoadResult {
  if (!items.length) throw new Error("Adicione ao menos um item para calcular a carga.")
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) throw new Error("Informe o peso total da carga.")
  if (items.reduce((total, item) => total + item.quantidade, 0) <= 0) throw new Error("Informe a quantidade dos itens da carga.")

  const validVehicles = vehicles.filter((vehicle) => vehicle.capacidade_kg > 0 && vehicle.area_m2 > 0)
  const totalArea = items.reduce((total, item) => total + item.area_total_m2, 0)
  const units = createFloorUnits(items, totalWeight)
  const plans = validVehicles
    .map((vehicle) => buildVehiclePlan(units, vehicle, totalWeight, totalArea, direction))
    .sort((a, b) => a.alternative.veiculo.area_m2 - b.alternative.veiculo.area_m2)

  const available = plans
    .filter(({ alternative }) => alternative.veiculo.ativo && alternative.compativel)
    .sort((a, b) => a.alternative.quantidade - b.alternative.quantidade || a.alternative.veiculo.area_m2 - b.alternative.veiculo.area_m2)

  const suggested = available[0]
  const activeVehicles = validVehicles.filter((vehicle) => vehicle.ativo)
  if (!activeVehicles.length) throw new Error("Nenhuma carroceria ativa disponível para o cálculo.")
  const largestCapacity = Math.max(...activeVehicles.map((vehicle) => vehicle.capacidade_kg))
  const mixedUpperBound = suggested?.alternative.quantidade
    ?? units.length + Math.ceil(totalWeight / largestCapacity)
  const mixedBins = findMixedPlan(units, activeVehicles, totalWeight, totalArea, mixedUpperBound, direction)
  if (!mixedBins && !suggested) throw new Error("Nenhuma combinação de carrocerias ativas comporta as dimensões dos itens.")
  const selectedBins: FleetBin[] = mixedBins || suggested.bins.map((bin) => ({ ...bin, vehicle: suggested.alternative.veiculo }))
  const fleetCapacity = selectedBins.reduce((sum, bin) => sum + bin.vehicle.capacidade_kg, 0)
  const fleetArea = selectedBins.reduce((sum, bin) => sum + bin.vehicle.area_m2, 0)
  const weightOccupancy = (totalWeight / fleetCapacity) * 100
  const areaOccupancy = (totalArea / fleetArea) * 100
  const distribution: VehicleAllocation[] = selectedBins.map((bin, index) => {
    return {
    indice: index + 1,
    veiculo: bin.vehicle,
    peso_kg: round(bin.occupiedWeight),
    area_m2: round(bin.occupiedArea, 3),
    ocupacao_peso: round((bin.occupiedWeight / bin.vehicle.capacidade_kg) * 100),
    ocupacao_area: round((bin.occupiedArea / bin.vehicle.area_m2) * 100),
    posicoes: bin.placements,
  }})

  return {
    visualizacao_versao: 1,
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
