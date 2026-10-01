import type { ReactNode } from 'react'

// Brauzerning oddiy title yozuvi o'rniga: sichqoncha yoki klaviatura fokusida tugma tagida
// chiqadigan to'q "tabletka" (strelka bilan). Ekran o'quvchilar uchun matn aria-label'da bo'ladi.
function Tooltip({ label, children, hidden = false }: { label: string; children: ReactNode; hidden?: boolean }) {
  return (
    <div className="group/tip relative flex">
      {children}
      {!hidden && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full right-0 z-50 mt-2 translate-y-1 rounded-lg bg-gray-950/90 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg backdrop-blur-sm transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:translate-y-0 group-has-[:focus-visible]/tip:opacity-100"
        >
          {label}
          <span className="absolute -top-1 right-3 size-2 rotate-45 bg-gray-950/90" />
        </span>
      )}
    </div>
  )
}

export default Tooltip
