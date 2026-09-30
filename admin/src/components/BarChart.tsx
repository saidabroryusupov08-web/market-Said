import { useEffect, useRef, useState } from 'react'

// Oddiy SVG ustunli grafik (bitta ko'rsatkich). Qoidalar (dataviz):
//  - ustun <= 24px, tepasi 4px yumaloq, pasti tekis, ustunlar orasida bo'sh joy
//  - bitta rang (#1d4ed8, fon bilan kontrast >= 3:1 — validator bilan tekshirilgan)
//  - ingichka, qattiq (dashed emas) och kulrang to'r chiziqlari
//  - har ustun sichqoncha va klaviatura (Tab) bilan tooltip ko'rsatadi; hit-zona ustundan katta
//  - tanlangan ustun rang bilan emas: tepasida qiymat, pastda qalin yorliq va och fon polosasi

export const CHART_COLOR = '#1d4ed8'

export type Bar = {
  key: string
  label: string // o'q ostidagi qisqa yorliq
  value: number
  title: string // tooltip sarlavhasi
  details?: string // tooltip ikkinchi qatori
}

// "chiroyli" o'q qiymatlari: 0, 500, 1000 ...
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function BarChart({
  bars,
  height = 220,
  selectedKey,
  onSelect,
  formatValue,
  formatTick,
  labelEvery = 1,
  ariaLabel,
}: {
  bars: Bar[]
  height?: number
  selectedKey?: string
  onSelect?: (key: string) => void
  formatValue: (n: number) => string
  formatTick: (n: number) => string
  labelEvery?: number // har nechanchi yorliq ko'rsatilsin (kunlar ko'p bo'lganda)
  ariaLabel: string
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const pad = { top: 20, right: 8, bottom: 26, left: 52 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const ticks = niceTicks(Math.max(0, ...bars.map((b) => b.value)))
  const top = ticks[ticks.length - 1] || 1
  const slot = plotW / Math.max(1, bars.length)
  const barW = Math.max(3, Math.min(24, slot * 0.62))
  const y = (v: number) => pad.top + plotH - (v / top) * plotH
  const selectedIndex = bars.findIndex((b) => b.key === selectedKey)

  const active = hover !== null ? bars[hover] : null
  const tooltipX = hover !== null ? pad.left + slot * hover + slot / 2 : 0

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
        {/* to'r chiziqlari va o'q yozuvlari */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[11px] tabular-nums">
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* tanlangan ustun orqasidagi och polosa */}
        {selectedIndex >= 0 && (
          <rect x={pad.left + slot * selectedIndex + 1} y={pad.top} width={slot - 2} height={plotH} rx="6" fill="#eff6ff" />
        )}

        {bars.map((b, i) => {
          const cx = pad.left + slot * i + slot / 2
          const h = Math.max(0, pad.top + plotH - y(b.value))
          const r = Math.min(4, h / 2, barW / 2)
          const x0 = cx - barW / 2
          const yTop = pad.top + plotH - h
          const isSelected = i === selectedIndex
          const isHover = i === hover
          // tepasi yumaloq, pasti tekis ustun
          const d =
            h <= 0
              ? ''
              : `M${x0},${pad.top + plotH}V${yTop + r}Q${x0},${yTop} ${x0 + r},${yTop}H${x0 + barW - r}Q${x0 + barW},${yTop} ${x0 + barW},${yTop + r}V${pad.top + plotH}Z`
          return (
            <g
              key={b.key}
              tabIndex={0}
              role={onSelect ? 'button' : undefined}
              aria-label={`${b.title}: ${formatValue(b.value)}${b.details ? `, ${b.details}` : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((cur) => (cur === i ? null : cur))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((cur) => (cur === i ? null : cur))}
              onClick={() => onSelect?.(b.key)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelect(b.key)
                }
              }}
              className={`outline-none ${onSelect ? 'cursor-pointer' : ''}`}
            >
              {/* ko'rinmas katta hit-zona: butun ustun balandligi va kengligi */}
              <rect x={pad.left + slot * i} y={pad.top} width={slot} height={plotH + pad.bottom} fill="transparent" />
              {d && <path d={d} fill={CHART_COLOR} opacity={isHover ? 0.8 : 1} />}
              {isSelected && b.value > 0 && (
                <text x={cx} y={yTop - 6} textAnchor="middle" className="fill-gray-900 text-[11px] font-semibold">
                  {formatTick(b.value)}
                </text>
              )}
              {(i % labelEvery === 0 || isSelected) && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] ${isSelected ? 'fill-gray-950 font-semibold' : 'fill-gray-500'}`}
                >
                  {b.label}
                </text>
              )}
            </g>
          )
        })}
        {/* nol chizig'i */}
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} stroke="#d1d5db" strokeWidth="1" />
      </svg>

      {active && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs whitespace-nowrap shadow-lg"
          style={{
            left: Math.min(Math.max(tooltipX, 80), width - 80),
            top: Math.max(0, y(active.value) - 64),
          }}
        >
          <p className="text-sm font-semibold text-gray-950">{formatValue(active.value)}</p>
          <p className="text-gray-500">{active.title}</p>
          {active.details && <p className="text-gray-500">{active.details}</p>}
        </div>
      )}
    </div>
  )
}

export default BarChart
