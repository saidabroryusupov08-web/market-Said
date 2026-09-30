import { useId } from 'react'

// cX-shop logotipi: och kvadrat ichida to'q ko'k (navy) beysbol kepkasi, 3/4 burchakdan;
// old tomonida qo'lda yozilgandek oq "cX" (shrift emas — chiziqlar, shuning uchun har qanday
// qurilmada bir xil ko'rinadi). Nom yozuvi ("cX-shop") ko'k -> qizil gradientda.
// Favicon ham shu belgidan (public/favicon.svg va admin/public/favicon.svg) — o'zgartirsangiz
// uchalasini ham yangilang.
export const BRAND_FROM = '#1d4ed8' // ko'k
export const BRAND_TO = '#e11d48' // qizil

// 64x64 koordinatalarda (kvadrat markaziga tushishi uchun 3px pastga surilgan)
const CROWN = 'M7 39C6 25.5 14.6 14.4 27.6 13.6C40 12.8 49.2 21 51 32.6C51.5 35.6 51.1 38.3 50.2 40C36 42.6 20.6 42.4 7 39Z'
const VISOR = 'M27.2 39.6C37.6 38.4 50 39 58 42.6C61.2 44 60.6 46.6 57.6 47.1C47.6 48.8 36.6 47.6 26.8 43.8C24.8 43 25.2 39.9 27.2 39.6Z'
const SCRIPT_C = 'M29.8 27.2C28.6 25.2 24.6 25.2 23.2 28.4C21.8 31.8 24 34.6 27.4 33.8C28.6 33.5 29.6 32.8 30.4 31.8'
const SCRIPT_X1 = 'M31.6 25.2C33.8 26 35.2 29 36.6 31.6C37.8 33.8 39 35.2 40.8 35.8'
const SCRIPT_X2 = 'M41.4 24.6C39.4 25 37.6 27.4 36.2 29.6C34.6 32 33.2 35 31 36.4C29.8 37.2 28.4 37.2 27.6 36.4'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  // bir sahifada bir nechta logotip bo'lsa, gradient id'lari to'qnashmasligi uchun
  const id = useId().replace(/:/g, '')
  const bg = `cx-bg-${id}`
  const crown = `cx-crown-${id}`
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={crown} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b2445" />
          <stop offset=".55" stopColor="#26335f" />
          <stop offset="1" stopColor="#1e2950" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${bg})`} />
      <g transform="translate(0 3)">
        <path fill={`url(#${crown})`} d={CROWN} />
        {/* tikuvlar va havo teshikchalari */}
        <g fill="none" stroke="#34457a" strokeWidth=".9" strokeLinecap="round">
          <path d="M27.4 13.8C32.6 18.4 35.6 28 36 40.6" />
          <path d="M27.4 13.8C21.4 18.2 17.4 27.6 16.4 39.8" />
        </g>
        <circle cx="20" cy="21.6" r="1" fill="#3b4c80" />
        <circle cx="36.2" cy="19.6" r="1" fill="#3b4c80" />
        {/* soyabon (kozirek) */}
        <path fill="#151d38" d={VISOR} />
        <path fill="none" stroke="#2c3a68" strokeWidth=".9" d="M27.6 40.8C37.6 40 49.4 40.6 57.2 43.8" />
        {/* tepadagi tugma */}
        <ellipse cx="27.4" cy="13.6" rx="3" ry="1.5" fill="#141b33" />
        {/* qo'lda yozilgandek "cX" */}
        <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-9 34 31)">
          <path d={SCRIPT_C} strokeWidth="2.1" />
          <path d={SCRIPT_X1} strokeWidth="2.2" />
          <path d={SCRIPT_X2} strokeWidth="2.2" />
          <path d="M24 38.8C31 37.4 38.6 37.2 46.6 38" strokeWidth="1.1" opacity=".85" />
        </g>
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
