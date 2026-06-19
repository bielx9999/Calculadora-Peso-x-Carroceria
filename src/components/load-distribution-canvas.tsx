"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva"
import type { Vehicle, VehicleAllocation } from "@/types"

const palette = ["#2563eb", "#f26522", "#16a34a", "#9333ea", "#ca8a04", "#0891b2", "#e11d48"]

function colorFor(id: string) {
  const hash = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

interface LoadDistributionCanvasProps {
  allocation: VehicleAllocation
  vehicle: Vehicle
}

export function LoadDistributionCanvas({ allocation, vehicle }: LoadDistributionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(720)

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

  return <div ref={containerRef} role="img" aria-label={`Distribuição ilustrativa da carga no veículo ${allocation.indice}, carroceria ${vehicle.nome}`} className="overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-950/60">
    <Stage width={containerWidth} height={geometry.stageHeight}>
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
          return <Group key={position.id}>
            <Rect x={x + 1} y={y + 1} width={Math.max(width - 2, 1)} height={Math.max(height - 2, 1)} fill={colorFor(position.produto_id)} opacity={0.82} stroke="#ffffff" strokeWidth={1} cornerRadius={2} />
            {showLabel && <Text x={x + 3} y={y + 3} width={Math.max(width - 6, 1)} height={Math.max(height - 6, 1)} text={`${position.nome}${position.quantidade > 1 ? `\n×${position.quantidade}` : ""}`} fontSize={Math.min(10, Math.max(7, height / 4))} fill="#ffffff" ellipsis align="center" verticalAlign="middle" />}
          </Group>
        })}
        <Text x={geometry.floorX} y={geometry.floorY + geometry.floorHeight + 10} width={geometry.floorWidth} text={`${vehicle.comprimento_m.toLocaleString("pt-BR")} m`} fontSize={12} fill="#64748b" align="center" />
        <Text x={8} y={geometry.floorY + geometry.floorHeight / 2 - 7} width={geometry.floorX - 16} text={`${vehicle.largura_m.toLocaleString("pt-BR")} m`} fontSize={12} fill="#64748b" align="right" />
      </Layer>
    </Stage>
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t bg-background/80 px-3 py-2">{legend.map(([id, name]) => <span key={id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorFor(id) }} />{name}</span>)}</div>
  </div>
}
