"use client"

import { useMemo, useState } from "react"
import { formatNaira } from "@waste-hub/shared-types"

export interface RevenueTrendPoint {
  label: string
  amountKobo: number
}

const WIDTH = 640
const HEIGHT = 220
const MARGIN = { top: 16, right: 16, bottom: 28, left: 64 }
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom

/** Rounds a max value up to a clean-looking tick ceiling (1/2/5 * 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return niceNormalized * magnitude
}

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points, maxKobo, ticks } = useMemo(() => {
    const maxRaw = Math.max(...data.map((d) => d.amountKobo), 0)
    const max = niceMax(maxRaw)
    const stepX = data.length > 1 ? PLOT_WIDTH / (data.length - 1) : 0
    const pts = data.map((d, i) => ({
      ...d,
      x: MARGIN.left + (data.length > 1 ? i * stepX : PLOT_WIDTH / 2),
      y: MARGIN.top + PLOT_HEIGHT - (max > 0 ? (d.amountKobo / max) * PLOT_HEIGHT : 0),
    }))
    const tickValues = [0, max / 2, max]
    return { points: pts, maxKobo: max, ticks: tickValues }
  }, [data])

  if (data.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">No payment data yet.</p>
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${MARGIN.top + PLOT_HEIGHT} L ${points[0].x} ${MARGIN.top + PLOT_HEIGHT} Z`
  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const lastPoint = points[points.length - 1]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue trend"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {ticks.map((tick, i) => {
          const y = MARGIN.top + PLOT_HEIGHT - (maxKobo > 0 ? (tick / maxKobo) * PLOT_HEIGHT : 0)
          return (
            <g key={i}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y}
                y2={y}
                className="stroke-black/10 dark:stroke-white/10"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-500 text-[10px] dark:fill-zinc-500"
              >
                {tick >= 100000 ? `₦${Math.round(tick / 100000) / 10}M` : formatNaira(tick)}
              </text>
            </g>
          )
        })}

        <path d={areaPath} className="fill-[#2a78d6]/10 dark:fill-[#3987e5]/10" />
        <path
          d={linePath}
          fill="none"
          className="stroke-[#2a78d6] dark:stroke-[#3987e5]"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-zinc-500 text-[10px] dark:fill-zinc-500"
          >
            {p.label}
          </text>
        ))}

        {/* End marker with direct label */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r={5} className="fill-[#2a78d6] dark:fill-[#3987e5]" />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={5}
          fill="none"
          strokeWidth={2}
          className="stroke-white dark:stroke-zinc-950"
        />
        <text
          x={lastPoint.x}
          y={lastPoint.y - 12}
          textAnchor="middle"
          className="fill-black text-[11px] font-medium dark:fill-zinc-50"
        >
          {formatNaira(lastPoint.amountKobo)}
        </text>

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
              className="stroke-black/20 dark:stroke-white/20"
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.y} r={5} className="fill-[#2a78d6] dark:fill-[#3987e5]" />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={5}
              fill="none"
              strokeWidth={2}
              className="stroke-white dark:stroke-zinc-950"
            />
          </>
        )}

        {/* Invisible hit targets, one per point, wider than the mark for easy hover */}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - (PLOT_WIDTH / Math.max(points.length - 1, 1)) / 2}
            y={MARGIN.top}
            width={PLOT_WIDTH / Math.max(points.length - 1, 1)}
            height={PLOT_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded border border-black/10 bg-white px-2 py-1 text-xs shadow-sm dark:border-white/10 dark:bg-zinc-900"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
          }}
        >
          <div className="font-medium text-black dark:text-zinc-50">{formatNaira(hovered.amountKobo)}</div>
          <div className="text-zinc-500 dark:text-zinc-500">{hovered.label}</div>
        </div>
      )}
    </div>
  )
}
