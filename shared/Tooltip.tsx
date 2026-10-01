import type { ReactNode } from 'react'

// Brauzerning oddiy title yozuvi o'rniga: sichqoncha yoki klaviatura fokusida chiqadigan to'q
// "tabletka" (strelka bilan). Ekran o'quvchilar uchun matn tugmaning aria-label'ida bo'ladi.
// side — tugmaning tagida yoki tepasida; align — qaysi chetga tekislanadi (ekrandan chiqmasligi uchun).

const SIDE = {
  bottom: { box: 'top-full mt-2 translate-y-1', arrow: '-top-1' },
  top: { box: 'bottom-full mb-2 -translate-y-1', arrow: '-bottom-1' },
}
const ALIGN = {
  end: { box: 'right-0', arrow: 'right-3' },
  center: { box: 'left-1/2 -translate-x-1/2', arrow: 'left-1/2 -translate-x-1/2' },
  start: { box: 'left-0', arrow: 'left-3' },
}

function Tooltip({
  label,
  children,
  hidden = false,
  side = 'bottom',
  align = 'end',
  className = '',
}: {
  label: string
  children: ReactNode
  hidden?: boolean
  side?: keyof typeof SIDE
  align?: keyof typeof ALIGN
  className?: string
}) {
  return (
    <div className={`group/tip relative flex ${className}`}>
      {children}
      {!hidden && (
        <span
          role="tooltip"
          aria-hidden="true"
          className={`pointer-events-none absolute z-50 rounded-lg bg-gray-950/90 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg backdrop-blur-sm transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:translate-y-0 group-has-[:focus-visible]/tip:opacity-100 ${SIDE[side].box} ${ALIGN[align].box}`}
        >
          {label}
          <span className={`absolute size-2 rotate-45 bg-gray-950/90 ${SIDE[side].arrow} ${ALIGN[align].arrow}`} />
        </span>
      )}
    </div>
  )
}

export default Tooltip
