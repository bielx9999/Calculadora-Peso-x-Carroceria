"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva"
import type { Vehicle, VehicleAllocation } from "@/types"
import { Button } from "@/components/ui/button"

const palette = ["#2563eb", "#FFCC29", "#16a34a", "#9333ea", "#ca8a04", "#0891b2", "#e11d48"]

function colorFor(id: string) {
  const hash = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

interface LoadDistributionCanvasProps {
  allocation: VehicleAllocation
  vehicle: Vehicle
}

const sideViews = ["Lateral esquerda", "Frente", "Lateral direita", "Traseira"]

function SideView({ allocation, vehicle, quadrant, containerWidth }: LoadDistributionCanvasProps & {
  quadrant: number
  containerWidth: number
}) {
  const span = quadrant % 2 === 0 ? vehicle.comprimento_m : vehicle.largura_m
  const projections = allocation.posicoes.map((position) => {
    const { x_m: x, y_m: y, comprimento_m: length, largura_m: width } = position
    const starts = [x, y, vehicle.comprimento_m - x - length, vehicle.largura_m - y - width]
    const depths = [y, vehicle.comprimento_m - x - length, vehicle.largura_m - y - width, x]
    return {
      position,
      start: starts[quadrant],
      depth: depths[quadrant],
      width: quadrant % 2 === 0 ? length : width,
      height: (position.altura_unitaria_m ?? 0) * position.quantidade,
    }
  }).sort((a, b) => b.depth - a.depth)
  const maxHeight = projections.reduce((highest, item) => Math.max(highest, item.height), 0)
  const scale = Math.min((containerWidth - 48) / span, 190 / Math.max(maxHeight, 1), 95)
  const floorWidth = span * scale
  const floorX = (containerWidth - floorWidth) / 2
  const floorY = Math.max(88, maxHeight * scale + 16)

  return <>
    <Stage width={containerWidth} height={floorY + 34}>
      <Layer>
        {projections.map(({ position, start, width, height }) => {
          const x = floorX + start * scale
          const displayWidth = width * scale
          const color = colorFor(position.produto_id)
          if (!height) return <Line key={position.id} points={[x, floorY + 4, x + displayWidth, floorY + 4]} stroke={color} strokeWidth={3} dash={[4, 3]} />
          return <Group key={position.id}>
            <Rect x={x} y={floorY - height * scale} width={displayWidth} height={height * scale} fill={color} stroke="#ffffff" strokeWidth={1} />
            {displayWidth > 44 && height * scale > 16 && <Text x={x + 2} y={floorY - height * scale} width={displayWidth - 4} height={height * scale} text={position.quantidade > 1 ? `${position.nome} (${position.quantidade})` : position.nome} fontSize={10} fill="#ffffff" ellipsis align="center" verticalAlign="middle" />}
          </Group>
        })}
        <Line points={[floorX, floorY, floorX + floorWidth, floorY]} stroke="#64748b" strokeWidth={2} />
        <Text x={floorX} y={floorY + 12} width={floorWidth} text={`${span.toLocaleString("pt-BR")} m`} fontSize={12} fill="#64748b" align="center" />
      </Layer>
    </Stage>
    {projections.some((item) => !item.height) && <p className="px-3 pb-2 text-xs text-muted-foreground">Tracejado no piso = produto sem altura informada.</p>}
  </>
}

export function LoadDistributionCanvas({ allocation, vehicle }: LoadDistributionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(720)
  const [side, setSide] = useState(false)
  const [quadrant, setQuadrant] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(Math.max(entry.contentRect.width, 280)))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(() => {
    const horizontalPadding = 48
    const topPadding = 32
    const bottomPadding = 34
    const availableWidth = Math.max(containerWidth - horizontalPadding * 2, 180)
    const scale = Math.min(availableWidth / vehicle.comprimento_m, 190 / vehicle.largura_m, 520 / vehicle.comprimento_m)
    const floorWidth = vehicle.comprimento_m * scale
    const floorHeight = vehicle.largura_m * scale
    return {
      scale,
      floorX: (containerWidth - floorWidth) / 2,
      floorY: topPadding,
      floorWidth,
      floorHeight,
      stageHeight: floorHeight + topPadding + bottomPadding,
    }
  }, [containerWidth, vehicle.comprimento_m, vehicle.largura_m])

  const legend = useMemo(() => {
    const products = new Map<string, string>()
    allocation.posicoes.forEach((position) => products.set(position.produto_id, position.nome))
    return Array.from(products.entries())
  }, [allocation.posicoes])

  return <div ref={containerRef} className="overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-950/60">
    <div className="flex flex-wrap items-center gap-2 border-b p-2">
      <Button type="button" size="sm" variant={side ? "outline" : "secondary"} aria-pressed={!side} onClick={() => setSide(false)}>Vista superior</Button>
      <Button type="button" size="sm" variant={side ? "secondary" : "outline"} aria-pressed={side} onClick={() => setSide(true)}>Vista lateral</Button>
      {side && <>
        <Button type="button" size="sm" variant="outline" aria-label="Girar 90 graus para a esquerda" onClick={() => setQuadrant((current) => (current + 3) % 4)}>↶ 90°</Button>
        <Button type="button" size="sm" variant="outline" aria-label="Girar 90 graus para a direita" onClick={() => setQuadrant((current) => (current + 1) % 4)}>↷ 90°</Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">{sideViews[quadrant]}</span>
      </>}
    </div>
    <div role="img" aria-label={`Distribuição da carga no veículo ${allocation.indice}, ${vehicle.nome}, ${side ? sideViews[quadrant] : "vista superior"}`}>
    {side ? <SideView allocation={allocation} vehicle={vehicle} quadrant={quadrant} containerWidth={containerWidth} /> : <Stage width={containerWidth} height={geometry.stageHeight}>
      <Layer>
        <Text x={geometry.floorX} y={9} text={`${vehicle.nome} · vista superior`} fontSize={12} fontStyle="bold" fill="#64748b" />
        <Rect x={geometry.floorX} y={geometry.floorY} width={geometry.floorWidth} height={geometry.floorHeight} fill="#ffffff" stroke="#1e3a5f" strokeWidth={3} cornerRadius={3} />
        {Array.from({ length: Math.floor(vehicle.comprimento_m) + 1 }, (_, meter) => meter).map((meter) => <Line key={`x-${meter}`} points={[geometry.floorX + meter * geometry.scale, geometry.floorY, geometry.floorX + meter * geometry.scale, geometry.floorY + geometry.floorHeight]} stroke="#cbd5e1" strokeWidth={1} dash={[4, 5]} />)}
        {allocation.posicoes.map((position) => {
          const x = geometry.floorX + position.x_m * geometry.scale
          const y = geometry.floorY + position.y_m * geometry.scale
          const width = position.comprimento_m * geometry.scale
          const height = position.largura_m * geometry.scale
          const showLabel = width > 50 && height > 28
          const stackBadgeX = x + Math.max(width - 10, 10)
          const stackBadgeY = y + 10
          return <Group key={position.id}>
            <Rect x={x + 1} y={y + 1} width={Math.max(width - 2, 1)} height={Math.max(height - 2, 1)} fill={colorFor(position.produto_id)} opacity={0.82} stroke="#ffffff" strokeWidth={1} cornerRadius={2} />
            {showLabel && <Text x={x + 3} y={y + 3} width={Math.max(width - 6, 1)} height={Math.max(height - 6, 1)} text={position.nome} fontSize={Math.min(10, Math.max(7, height / 4))} fill="#ffffff" ellipsis align="center" verticalAlign="middle" />}
            {position.quantidade > 1 && <><Circle x={stackBadgeX} y={stackBadgeY} radius={9} fill="#0f172a" stroke="#ffffff" strokeWidth={1.5} /><Text x={stackBadgeX - 9} y={stackBadgeY - 6} width={18} text={`${position.quantidade}`} fontSize={10} fontStyle="bold" fill="#ffffff" align="center" /></>}
          </Group>
        })}
        <Text x={geometry.floorX} y={geometry.floorY + geometry.floorHeight + 10} width={geometry.floorWidth} text={`${vehicle.comprimento_m.toLocaleString("pt-BR")} m`} fontSize={12} fill="#64748b" align="center" />
        <Text x={8} y={geometry.floorY + geometry.floorHeight / 2 - 7} width={geometry.floorX - 16} text={`${vehicle.largura_m.toLocaleString("pt-BR")} m`} fontSize={12} fill="#64748b" align="right" />
      </Layer>
    </Stage>}
    </div>
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t bg-background/80 px-3 py-2">{legend.map(([id, name]) => <span key={id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorFor(id) }} />{name}</span>)}{allocation.posicoes.some((position) => position.quantidade > 1) && <span className="text-[11px] font-medium text-muted-foreground">Número no item = unidades empilhadas</span>}</div>
  </div>
}
