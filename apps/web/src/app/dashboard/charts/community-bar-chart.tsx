export interface CommunityBarDatum {
  name: string
  value: number
}

const ROW_HEIGHT = 32
const BAR_HEIGHT = 18
const RADIUS = 4
const LABEL_WIDTH = 160
const CHART_WIDTH = 640
const RIGHT_PADDING = 48
const BAR_MAX_WIDTH = CHART_WIDTH - LABEL_WIDTH - RIGHT_PADDING

/** Horizontal bar growing right from x=0: rounded at the data end, square at the baseline. */
function roundedBarPath(width: number, height: number): string {
  const r = Math.min(RADIUS, width, height / 2)
  if (width <= 0) return ""
  return [
    `M 0 0`,
    `L ${width - r} 0`,
    `Q ${width} 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `Q ${width} ${height} ${width - r} ${height}`,
    `L 0 ${height}`,
    `Z`,
  ].join(" ")
}

export function CommunityBarChart({ data }: { data: CommunityBarDatum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">No communities yet.</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)
  const height = data.length * ROW_HEIGHT

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${height}`}
      className="w-full"
      role="img"
      aria-label="Active residents by community"
    >
      {data.map((d, i) => {
        const barWidth = (d.value / max) * BAR_MAX_WIDTH
        const y = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2
        return (
          <g key={d.name}>
            <text
              x={LABEL_WIDTH - 8}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
            >
              {d.name.length > 22 ? `${d.name.slice(0, 21)}…` : d.name}
            </text>
            <g transform={`translate(${LABEL_WIDTH}, ${y})`}>
              <path d={roundedBarPath(barWidth, BAR_HEIGHT)} className="fill-[#2a78d6] dark:fill-[#3987e5]">
                <title>{`${d.name}: ${d.value}`}</title>
              </path>
              <text
                x={barWidth + 6}
                y={BAR_HEIGHT / 2}
                dominantBaseline="middle"
                className="fill-black text-[11px] font-medium dark:fill-zinc-50"
              >
                {d.value}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
