import { useId } from 'react'

// cX-shop logotipi: ko'k -> qizil gradientli kvadrat ichida oq ot boshi (shaxmat oti uslubida) + nom.
// Favicon ham shu belgidan (public/favicon.svg va admin/public/favicon.svg) — o'zgartirsangiz
// uchalasini ham yangilang.
export const BRAND_FROM = '#1d4ed8' // ko'k
export const BRAND_TO = '#e11d48' // qizil

const HORSE =
  'M9 26.5C9.4 22.4 10.6 19.6 12.6 17.6C11.2 17.9 9.6 18.5 8.2 18.3C6.6 18.1 5.9 16.6 6.7 15.3C8.4 12.6 10.6 10 13.4 8.3L13.1 5.2L15.6 7.2L17.2 4.6L18.2 7.3C22.4 8.2 25 11.9 25 16.8C25 20.3 24 23.6 23.6 26.5Z'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  // bir sahifada bir nechta logotip bo'lsa, gradient id'lari to'qnashmasligi uchun
  const gradientId = `cx-logo-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND_FROM} />
          <stop offset="1" stopColor={BRAND_TO} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path fill="#fff" d={HORSE} />
      {/* ko'z */}
      <circle cx="14.6" cy="11.4" r="1.1" fill={BRAND_FROM} />
      {/* poydevor */}
      <rect x="7.5" y="26" width="17.5" height="2.2" rx="1.1" fill="#fff" />
    </svg>
  )
}

// compact: juda tor telefonlarda (380px dan kichik) faqat belgi qoladi, header sig'ishi uchun
function Logo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="size-8 shrink-0" />
      <span
        className={`text-xl font-extrabold tracking-tight whitespace-nowrap ${
          compact ? 'max-[380px]:hidden' : ''
        }`}
      >
        <span className="bg-gradient-to-br from-blue-700 to-rose-600 bg-clip-text text-transparent">
          cX
        </span>
        <span className="font-semibold text-slate-500">-shop</span>
      </span>
    </span>
  )
}

export default Logo
