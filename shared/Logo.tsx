import { useId } from 'react'

// cX-shop logotipi: ko'k -> qizil gradientli kvadrat ichida oq beysbol kepkasi, old tomonida "cX".
// Favicon ham shu belgidan (public/favicon.svg va admin/public/favicon.svg) — o'zgartirsangiz
// uchalasini ham yangilang.
export const BRAND_FROM = '#1d4ed8' // ko'k
export const BRAND_TO = '#e11d48' // qizil

// 64x64 koordinatalarda (kvadrat markaziga tushishi uchun 4px pastga surilgan)
const CROWN = 'M7.5 38.5C7 26.4 16.4 17.6 28.6 17C40.6 16.4 49.4 23.4 50.6 33.6L51 38.6C36.6 40.6 21.6 40.6 7.5 38.5Z'
const VISOR = 'M43.6 35.2C49.8 33.2 56.8 33.9 61 37.3C62.2 38.3 61.6 40.2 60 40.4C54.2 41.2 48.2 40.9 42.8 39.6Z'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  // bir sahifada bir nechta logotip bo'lsa, gradient id'lari to'qnashmasligi uchun
  const gradientId = `cx-logo-${useId().replace(/:/g, '')}`
  const gradient = `url(#${gradientId})`
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND_FROM} />
          <stop offset="1" stopColor={BRAND_TO} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={gradient} />
      <g transform="translate(0 4)">
        {/* kepka tepasi va soyaboni (kozirek) */}
        <path fill="#fff" d={CROWN} />
        <path fill="#fff" d={VISOR} />
        {/* tikuv chiziqlari va pastki tasma */}
        <g stroke={gradient} fill="none" strokeLinecap="round">
          <path d="M28.6 17C34.8 20.4 39 27.6 40.4 38.8" strokeWidth="1.5" opacity=".5" />
          <path d="M28.6 17C23.4 21.4 20.8 29 20.6 39.4" strokeWidth="1.5" opacity=".4" />
          <path d="M8 35.2C22 37.2 37 37.2 50.8 35.4" strokeWidth="1.3" opacity=".3" />
        </g>
        {/* old tomondagi yozuv */}
        <text
          x="30.6"
          y="32"
          textAnchor="middle"
          fontFamily="system-ui, 'Segoe UI', Arial, sans-serif"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="-.3"
          fill={gradient}
        >
          cX
        </text>
        {/* tepadagi tugma */}
        <circle cx="28.6" cy="16.6" r="2.4" fill="#fff" stroke={gradient} strokeWidth=".9" strokeOpacity=".5" />
      </g>
    </svg>
  )
}

// compact: juda tor telefonlarda (380px dan kichik) faqat belgi qoladi, header sig'ishi uchun
function Logo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="size-9 shrink-0" />
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
