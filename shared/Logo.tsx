import { useId } from 'react'

// cX-shop logotipi: ko'k -> qizil gradientli kvadrat ichida polo o'yinchisi — o'ngga chopayotgan
// ot ustida chavandoz, qo'lida ko'tarilgan klyushka (o'zimizning original chizma).
// Favicon ham shu belgidan (public/favicon.svg va admin/public/favicon.svg) — o'zgartirsangiz
// uchalasini ham yangilang.
export const BRAND_FROM = '#1d4ed8' // ko'k
export const BRAND_TO = '#e11d48' // qizil

// 64x64 koordinatalarda
const HORSE =
  'M40 28C43 24 45 19 48 16.5L48.4 13L50.6 16C53 17 55.6 19.6 57.6 22.6C58.4 24 57.6 25.8 56 25.8C54.2 25.8 52.6 25.4 51.4 26C50.6 28.4 50 31 49.6 34C52.4 36 55 38.4 57.6 41.2C58.3 42 57.6 43.2 56.5 42.9C53.6 42.2 50.6 40.8 47.6 39.6C47.2 41.6 47.8 44 48.4 46.2C48.7 47.4 47.4 48 46.6 47.2C44.8 45.2 43.6 43 42.8 41.2C38.6 42.4 34 42.6 29.6 42C28.4 44.4 26.6 46.6 24 48.2C22.8 48.8 21.8 47.6 22.6 46.6C24 44.8 25 43 25.4 41.2C23 41.6 20 43.4 16.2 46C15 46.8 14 45.6 14.8 44.6C17 41.8 18.6 39.4 19.2 37C18.2 35 17.4 33.8 16.2 33.2C13.6 34 11 35.8 8.4 38.2C7.8 38.7 6.9 38 7.4 37.3C9.4 34 12.2 30.6 16.4 28.8C19.6 27.4 24 27 28.6 27.2C32.6 27.4 36.6 27.8 40 28Z'
const RIDER_BODY = 'M30.2 27.6C30.4 24.4 31.6 21.2 34 18.8L37.4 20.2C36.2 22.8 35.8 25.4 36.2 28Z'
const RIDER_LEG = 'M32.2 27C34.6 28 36.8 29.4 38.4 31L37.4 36.4L35.2 36L35.8 32.6C34.2 31.6 32.8 30.6 31.2 30Z'
const HELMET = 'M34 15.4C34.2 12.6 36 11.6 38 11.8C39.8 12 40.8 13.4 40.8 15Z'

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
      <g fill="#fff">
        <path d={HORSE} />
        <path d={RIDER_BODY} />
        {/* oyoq ot tanasidan ajralib turishi uchun gradient chiziq bilan */}
        <path d={RIDER_LEG} stroke={gradient} strokeWidth=".9" strokeLinejoin="round" />
        <circle cx="37" cy="15.6" r="3" />
        <path d={HELMET} />
      </g>
      {/* qo'l va klyushka */}
      <g stroke="#fff" strokeLinecap="round">
        <path d="M34.2 20L29.4 15.4" strokeWidth="2.4" />
        <path d="M29.4 15.4L20.2 5.6" strokeWidth="1.3" />
        <path d="M18 6.8L22 3.6" strokeWidth="2.2" />
      </g>
      {/* otning ko'zi */}
      <circle cx="52.8" cy="19.8" r="1" fill={BRAND_FROM} />
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
