// cX-shop logotipi: ichida "cX" yozilgan xarid sumkasi + nom
// favicon ham shu belgidan (public/favicon.svg), o'zgartirsangiz ikkalasini ham yangilang

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M11 12V9a5 5 0 0 1 10 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="3" y="11" width="26" height="19" rx="5" fill="currentColor" />
      <text
        x="16"
        y="25"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="-0.3"
      >
        cX
      </text>
    </svg>
  )
}

// compact: juda tor telefonlarda (380px dan kichik) faqat belgi qoladi, header sig'ishi uchun
function Logo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="size-8 shrink-0 text-gray-950" />
      <span
        className={`text-xl font-bold tracking-tight whitespace-nowrap text-gray-950 ${
          compact ? 'max-[380px]:hidden' : ''
        }`}
      >
        cX<span className="font-medium text-gray-500">-shop</span>
      </span>
    </span>
  )
}

export default Logo
